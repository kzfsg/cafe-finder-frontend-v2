import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Loader, 
  Box,
  Modal,
  Button
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import searchService from '../services/searchService';
import batchedCafeService from '../services/batchedCafeService';
import CafeCard from '../components/CafeCard';
import CafeDetails from '../components/CafeDetails';
import MasonryGrid from '../components/MasonryGrid';
import type { Cafe } from '../data/cafes';
import type { FilterOptions } from '../components/FilterDropdown';
import { getCurrentLocation } from '../utils/geolocation';

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [displayedCafes, setDisplayedCafes] = useState<Cafe[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreCafes, setHasMoreCafes] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const batchSize = 9; // Number of cafes to load in each batch
  
  // Get user location on component mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const position = await getCurrentLocation();
        setUserLocation({
          latitude: position.latitude,
          longitude: position.longitude
        });
      } catch (error) {
        // Silently fail if location access is denied
      }
    };
    
    getUserLocation();
  }, []);
  
  // Extract search parameters from URL
  const query = searchParams.get('q') || '';
  const location = searchParams.get('location') || '';
  const wifi = searchParams.get('wifi') === 'true';
  const powerOutlet = searchParams.get('powerOutlet') === 'true';
  const seatingCapacity = searchParams.get('seatingCapacity') ? Number(searchParams.get('seatingCapacity')) : null;
  const noiseLevel = searchParams.get('noiseLevel') as 'quiet' | 'moderate' | 'loud' | null || null;
  const priceRange = searchParams.get('priceRange') as '$' | '$$' | '$$$' | '$$$$' | null || null;
  const upvotes = searchParams.get('upvotes') ? Number(searchParams.get('upvotes')) : null;
  const downvotes = searchParams.get('downvotes') ? Number(searchParams.get('downvotes')) : null;

  // Create filters object from URL parameters
  const filters: FilterOptions = {
    location,
    wifi,
    powerOutlet,
    seatingCapacity,
    noiseLevel,
    priceRange,
    upvotes,
    downvotes,
    // Check for nearMe parameters
    nearMe: searchParams.get('nearMe.latitude') && searchParams.get('nearMe.longitude') && searchParams.get('nearMe.radiusKm') 
      ? {
          latitude: Number(searchParams.get('nearMe.latitude')),
          longitude: Number(searchParams.get('nearMe.longitude')),
          radiusKm: Number(searchParams.get('nearMe.radiusKm'))
        }
      : null
  };

  // Determine if we should use search or get all cafes
  const hasSearchParams = query || Object.values(filters).some(value => 
    value !== '' && value !== false && value !== null
  );

  // Fetch cafes using React Query with batched loading for all cases
  const { isLoading, error, refetch } = useQuery<Cafe[]>({
    queryKey: ['cafes-initial', query, filters, userLocation],
    queryFn: async () => {
      try {
        if (!userLocation) {
          return []; // Return empty array instead of undefined
        }
        
        // Clear the cache when search parameters change to ensure fresh results
        if (hasSearchParams) {
          batchedCafeService.clearCache();
        }
        
        // Use batched loading for both search and regular browsing
        const cafes = await batchedCafeService.loadInitialBatch(userLocation, batchSize, filters);
        setDisplayedCafes(cafes);
        setHasMoreCafes(cafes.length === batchSize); // If we got a full batch, there might be more
        
        return cafes; // Always return the cafes array
      } catch (error) {
        console.error('Error fetching cafes:', error);
        return []; // Return empty array on error
      }
    },
    enabled: !!userLocation, // Only run the query when we have user location
  });

  // Handle opening the cafe details modal
  const handleCafeClick = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setDetailsModalOpen(true);
  };
  
  // Load more cafes when user scrolls
  const loadMoreCafes = useCallback(async () => {
    if (!userLocation || isLoadingMore || !hasMoreCafes) {
      return;
    }
    
    try {
      setIsLoadingMore(true);
      const nextBatch = await batchedCafeService.loadNextBatch(
        userLocation,
        displayedCafes.length,
        batchSize,
        filters
      );
      
      if (nextBatch.length > 0) {
        setDisplayedCafes(prev => [...prev, ...nextBatch]);
        setHasMoreCafes(nextBatch.length === batchSize);
      } else {
        setHasMoreCafes(false);
      }
    } catch (error) {
      console.error('Error loading more cafes:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [userLocation, isLoadingMore, hasMoreCafes, displayedCafes.length, filters, hasSearchParams]);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreCafes();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loadMoreCafes]);
  
  // Handle upvote/downvote updates with optimistic UI updates
  const handleVoteUpdate = async (cafeId: number, updatedCafe: Cafe) => {
    console.log('Vote update received for cafe:', cafeId, updatedCafe);
    
    // Optimistically update the UI immediately
    const updatedCafes = displayedCafes.map(cafe => 
      cafe.id === cafeId ? { ...cafe, ...updatedCafe } : cafe
    );
    setDisplayedCafes(updatedCafes);
    
    // Update the selected cafe if it's the one being voted on
    if (selectedCafe?.id === cafeId) {
      setSelectedCafe(prev => prev ? { ...prev, ...updatedCafe } : null);
    }
    
    try {
      // Refetch the data to ensure consistency with the backend
      const { data } = await refetch();
      
      if (data) {
        // If refetch was successful, update with fresh data
        const cafeFromServer = data.find((c: Cafe) => c.id === cafeId);
        if (cafeFromServer) {
          setDisplayedCafes(prev => 
            prev.map(cafe => 
              cafe.id === cafeId ? { ...cafe, ...cafeFromServer } : cafe
            )
          );
          
          if (selectedCafe?.id === cafeId) {
            setSelectedCafe(prev => prev ? { ...prev, ...cafeFromServer } : null);
          }
        }
      }
    } catch (error) {
      console.error('Error updating votes:', error);
      // Optionally, you could revert the optimistic update here
      // or show an error message to the user
    }
  };

  // Handle closing the cafe details modal
  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    // Optional: Clear the selected cafe after a delay to allow for exit animations
    setTimeout(() => setSelectedCafe(null), 300);
  };

  if (isLoading) {
    return (
      <Container size="lg" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Loader size="xl" type="dots" /> 
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Text c="red" size="lg" fw={500} mb="md">
          Error loading cafes
        </Text>
        <Text mb="md">Please check your internet connection and try again.</Text>
        <Button onClick={() => refetch()}>Retry</Button>
      </Container>
    );
  }

  // Show no results message if search was performed but no cafes found
  if (hasSearchParams && displayedCafes.length === 0 && !isLoading) {
    return (
      <Container size="lg" py="xl">
        <Text size="lg" mb="md">
          No cafes found matching your search criteria.
        </Text>
        <Button component="a" href="/">
          Clear search
        </Button>
      </Container>
    );
  }

  // Note: We no longer need to calculate distances here as they are calculated in the batched service

  return (
    <>
      <Container size="lg" py="xl">
        {/* <Title order={1} mb="lg" className="tryst" ta="center">Nomadic</Title>
        <Text size="lg" mb="xl" className="nunitoItalic" ta="center" c="dimmed">
          Find your perfect workspace
        </Text> */}
        
        {/* Masonry Grid */}
        {displayedCafes.length > 0 ? (
          <>
            <MasonryGrid columns={3}>
              {displayedCafes.map((cafe) => (
                <CafeCard 
                  key={cafe.id}
                  id={cafe.id}
                  title={cafe.name}
                  image={cafe.image}
                  description={cafe.description}
                  hasWifi={cafe.wifi || false}
                  hasPower={cafe.powerOutletAvailable || false}
                  upvotes={cafe.upvotes || 0}
                  downvotes={cafe.downvotes || 0}
                  distance={cafe.distance}
                  onClick={() => handleCafeClick(cafe)}
                  onUpvote={(_, __, updatedCafe) => handleVoteUpdate(cafe.id, updatedCafe)}
                  onDownvote={(_, __, updatedCafe) => handleVoteUpdate(cafe.id, updatedCafe)}
                />
              ))}
            </MasonryGrid>
            
            {/* Infinite scroll loader */}
            <div 
              ref={loaderRef} 
              style={{ 
                height: '50px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginTop: '2rem'
              }}
            >
              {isLoadingMore && <Loader size="sm" />}
              {!hasMoreCafes && displayedCafes.length > batchSize && (
                <Text size="sm" color="dimmed">No more cafes to load</Text>
              )}
            </div>
          </>
        ) : (
          <Box style={{ textAlign: 'center', padding: '2rem' }}>
            <Text size="lg">No cafes found.</Text>
          </Box>
        )}
      </Container>

      {/* Cafe Details Modal */}
      <Modal
        opened={detailsModalOpen}
        onClose={handleCloseDetails}
        size="xl"
        padding={0}
        withCloseButton={false}
        centered
      >
        {selectedCafe && (
          <CafeDetails
            cafe={selectedCafe}
            onClose={handleCloseDetails}
            onVoteUpdate={(updatedCafe) => handleVoteUpdate(selectedCafe.id, updatedCafe)}
          />
        )}
      </Modal>
    </>
  );
}
