import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Text, 
  Loader, 
  Box,
  SimpleGrid,
  Modal,
  Button,
  Center,
  Image,
  Stack,
  rem
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconBookmark, IconArrowLeft } from '@tabler/icons-react';
import bookmarkService from '../services/bookmarkService';
import CafeCard from '../components/CafeCard';
import CafeDetails from '../components/CafeDetails';
import type { Cafe } from '../data/cafes';
import authService from '../services/authService';


export default function BookmarkPage() {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch bookmarked cafes using React Query
  const { 
    data: bookmarkedCafes = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery<Cafe[]>({
    queryKey: ['bookmarks'],
    queryFn: () => bookmarkService.getBookmarkedCafes(),
    enabled: false // We'll manually trigger the query after auth check
  });

  // Check authentication and fetch bookmarks
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const isLoggedIn = await authService.isLoggedIn();
        if (!isLoggedIn) {
          navigate('/login', { state: { from: '/bookmarks' } });
          return;
        }
        await refetch();
      } catch (err) {
        console.error('Authentication check failed:', err);
      }
    };

    checkAuthAndFetch();
  }, [navigate, refetch]);

  // Handle opening the cafe details modal
  const handleCafeClick = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setDetailsModalOpen(true);
  };

  // Handle closing the cafe details modal
  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    // Clear the selected cafe after a delay to allow for exit animations
    setTimeout(() => setSelectedCafe(null), 300);
  };

  if (isLoading && bookmarkedCafes.length === 0) {
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
          Error loading bookmarked cafes
        </Text>
        <Button 
          onClick={() => refetch()}
          leftSection={<IconArrowLeft size={16} />}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Container size="lg" py="xl">
        <Title order={1} mb="xl">My Bookmarked Cafes</Title>
        
        {bookmarkedCafes.length === 0 ? (
          <Center style={{ minHeight: '50vh' }}>
            <Stack align="center" gap="md">
              <IconBookmark size={64} stroke={1.5} style={{ opacity: 0.5 }} />
              <Title order={3}>No bookmarked cafes yet</Title>
              <Text c="dimmed" ta="center" maw={rem(400)}>
                Explore cafes and bookmark your favorites to see them here.
              </Text>
              <Button 
                onClick={() => navigate('/')}
                leftSection={<IconArrowLeft size={16} />}
                mt="md"
              >
                Explore Cafes
              </Button>
            </Stack>
          </Center>
        ) : (
          <SimpleGrid
            cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
            spacing="lg"
            verticalSpacing="lg"
          >
            {bookmarkedCafes.map((cafe) => (
              <CafeCard 
                key={cafe.id}
                id={cafe.id}
                title={cafe.title || cafe.Name || 'Unnamed Cafe'}
                description={cafe.description || 'No description available'}
                image={cafe.imageUrls?.[0] || ''}
                images={cafe.imageUrls || []}  // Use imageUrls for gallery
                hasWifi={cafe.wifi || false}
                hasPower={cafe.powerOutletAvailable || false}
                upvotes={cafe.upvotes || 0}
                onClick={() => handleCafeClick(cafe)}
              />
            ))}
          </SimpleGrid>
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
          <CafeDetails cafe={selectedCafe} onClose={handleCloseDetails} />
        )}
      </Modal>
    </>
  );
}
