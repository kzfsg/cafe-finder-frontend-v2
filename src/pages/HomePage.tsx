import { useState } from 'react';
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
import type { FilterOptions } from '../services/searchService';

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

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
    downvotes
  };

  // Determine if we should use search or get all cafes
  const hasSearchParams = query || Object.values(filters).some(value => 
    value !== '' && value !== false && value !== null
  );

  // Fetch cafes using React Query - use search if parameters exist, otherwise get all
  const { data: cafes = [], isLoading, error, refetch } = useQuery<Cafe[]>({
    queryKey: ['cafes', query, filters],
    queryFn: () => hasSearchParams 
      ? searchService.searchCafes(query, filters)
      : cafeService.getAllCafes(),
  });

  // Handle opening the cafe details modal
  const handleCafeClick = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setDetailsModalOpen(true);
  };

  // Handle closing the cafe details modal
  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    // Optional: Clear the selected cafe after a delay to allow for exit animations
    setTimeout(() => setSelectedCafe(null), 300);
  };

  if (isLoading) { //loading animation
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

  return (
    <>
      <Container size="lg" py="xl">
        <Title order={1} mb="xl">Find Your Perfect Cafe</Title>
        
        {/* Cafe Grid */}
        {cafes.length > 0 ? (
          <SimpleGrid
            cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
            spacing="lg"
            verticalSpacing="lg"
          >
            {cafes.map((cafe) => (
              <CafeCard 
                key={cafe.id}
                id={cafe.id}
                title={cafe.title || cafe.name || 'Unnamed Cafe'}
                description={cafe.description || 'No description available'}
                image={cafe.imageUrls?.[0] || ''} // main image
                images={cafe.imageUrls || []}
                hasWifi={cafe.wifi || false}
                hasPower={cafe.powerOutletAvailable || false}
                upvotes={cafe.upvotes || 0}
                onClick={() => handleCafeClick(cafe)}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Box py="xl" style={{ textAlign: 'center' }}>
            <Text size="lg" mb="md">No cafes found</Text>
            <Text c="dimmed">
              There are no cafes available at the moment.
            </Text>
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
          />
        )}
      </Modal>
    </>
  );
}
