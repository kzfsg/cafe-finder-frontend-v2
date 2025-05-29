import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Loader, 
  Box,
  SimpleGrid,
  Modal,
  Button
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import cafeService from '../services/cafeService';
import searchService from '../services/searchService';
import CafeCard from '../components/CafeCard';
import CafeDetails from '../components/CafeDetails';
import type { Cafe } from '../data/cafes';
import type { FilterOptions } from '../components/FilterDropdown';
import { calculateDistance, getCurrentLocation } from '../utils/geolocation';

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  
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

  // Fetch cafes using React Query - use search if parameters exist, otherwise get all
  const { data: cafes = [], isLoading, error, refetch } = useQuery<Cafe[]>({
    queryKey: ['cafes', query, filters],
    queryFn: async () => {
      try {
        if (hasSearchParams) {
          return await searchService.searchCafes(query, filters);
        } else {
          return await cafeService.getAllCafes();
        }
      } catch (error) {
        throw error;
      }
    },
  });

  // Handle opening the cafe details modal
  const handleCafeClick = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setDetailsModalOpen(true);
  };
  
  // Handle upvote/downvote updates to keep state in sync between card and details view
  const handleVoteUpdate = (cafeId: number, updatedCafe: Cafe) => {
    console.log('Vote update received for cafe:', cafeId);
    
    // Update the cafe in the list with the new data
    const updatedCafes = cafes.map(cafe => 
      cafe.id === cafeId ? { ...cafe, ...updatedCafe } : cafe
    );
    
    // If this is the currently selected cafe, update it too
    if (selectedCafe && selectedCafe.id === cafeId) {
      setSelectedCafe({ ...selectedCafe, ...updatedCafe });
    }
    
    // Trigger a refetch to ensure data consistency with the backend
    // This is important to keep vote counts and status in sync
    setTimeout(() => refetch(), 300);
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
  if (hasSearchParams && cafes.length === 0) {
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

  // Calculate distances for all cafes if we have user location
  const cafesWithDistance = cafes.map(cafe => {
    // Calculate distance if we have user location and cafe location
    if (cafe.location?.latitude && cafe.location?.longitude) {
      // Use filters.nearMe if available, otherwise use userLocation
      const userCoords = filters.nearMe || userLocation;
      
      if (userCoords) {
        const distance = calculateDistance(
          userCoords.latitude,
          userCoords.longitude,
          cafe.location.latitude,
          cafe.location.longitude
        );
        return { ...cafe, distance };
      }
    }
    return cafe;
  });
  
  // Sort cafes by distance (closest first)
  const sortedCafes = [...cafesWithDistance].sort((a, b) => {
    // If both have distance, sort by distance
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    // If only one has distance, prioritize the one with distance
    if (a.distance !== undefined) return -1;
    if (b.distance !== undefined) return 1;
    // If neither has distance, maintain original order
    return 0;
  });

  return (
    <>
      <Container size="lg" py="xl">
        {/* <Title order={1} mb="lg" className="tryst" ta="center">Nomadic</Title>
        <Text size="lg" mb="xl" className="nunitoItalic" ta="center" c="dimmed">
          Find your perfect workspace
        </Text> */}
        
        {/* Cafe Grid */}
        {cafesWithDistance.length > 0 ? (
          <SimpleGrid
            cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
            spacing="lg"
            style={{ marginTop: '2rem' }}
          >
            {sortedCafes.map((cafe) => (
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
          </SimpleGrid>
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
