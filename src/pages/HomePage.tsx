import { useState } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Loader, 
  Box,
  SimpleGrid,
  Modal
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import cafeService from '../services/cafeService';
import CafeCard from '../components/CafeCard';
import CafeDetails from '../components/CafeDetails';
import type { Cafe } from '../data/cafes';

export default function HomePage() {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Fetch cafes using React Query
  const { data: cafes = [], isLoading, error } = useQuery<Cafe[]>({
    queryKey: ['cafes'],
    queryFn: () => cafeService.getAllCafes(),
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
        <Text>Please check your internet connection and try again.</Text>
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
                image={cafe.imageUrls?.[0] || ''}
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
