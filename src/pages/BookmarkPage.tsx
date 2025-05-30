import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Text, 
  Loader, 
  Modal,
  Button,
  Center,
  Stack,
  rem
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconBookmark, IconArrowLeft } from '@tabler/icons-react';
import bookmarkService from '../services/bookmarkService';
import CafeCard from '../components/CafeCard';
import CafeDetails from '../components/CafeDetails';
import MasonryGrid from '../components/MasonryGrid';
import type { Cafe } from '../data/cafes';
import authService from '../services/authService';


export default function BookmarkPage() {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [displayedCafes, setDisplayedCafes] = useState<Cafe[]>([]);
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
  
  // Update displayed cafes when bookmarkedCafes changes
  useEffect(() => {
    setDisplayedCafes(bookmarkedCafes);
  }, [bookmarkedCafes]);

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

  // Handle upvote/downvote updates
  const handleVoteUpdate = (cafeId: number, updatedCafe: Cafe) => {
    console.log('Vote update received for cafe in BookmarkPage:', cafeId, updatedCafe);
    
    // Update the displayed cafes - carefully preserve all original properties
    setDisplayedCafes(prevCafes => 
      prevCafes.map(cafe => {
        if (cafe.id === cafeId) {
          // Create a merged object that prioritizes keeping original properties
          // but updates the vote counts
          return {
            ...cafe,                     // Keep all original properties first
            upvotes: updatedCafe.upvotes || cafe.upvotes || 0,
            downvotes: updatedCafe.downvotes || cafe.downvotes || 0
          };
        }
        return cafe;
      })
    );
    
    // Update the selected cafe if it's the one being voted on
    if (selectedCafe?.id === cafeId) {
      setSelectedCafe(prev => {
        if (!prev) return null;
        // Same careful merging for the selected cafe
        return {
          ...prev,                      // Keep all original properties
          upvotes: updatedCafe.upvotes || prev.upvotes || 0,
          downvotes: updatedCafe.downvotes || prev.downvotes || 0
        };
      });
    }
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
      <Container size="100%" py="xl" px="xs">
        <Title order={1} mb="xl" px="md">My Bookmarked Cafes</Title>
        
        {displayedCafes.length === 0 ? (
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
          <MasonryGrid columns={4}>
            {displayedCafes.map((cafe) => (
              <CafeCard 
                key={cafe.id}
                id={cafe.id}
                title={cafe.title || cafe.Name || 'Unnamed Cafe'}
                description={cafe.description || 'No description available'}
                image={cafe.imageUrls?.[0] || ''}
                images={cafe.imageUrls || []}
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
            onVoteUpdate={(updatedCafe) => {
              if (selectedCafe) {
                // Create a complete updated cafe object that preserves all original properties
                const completeUpdatedCafe = {
                  ...selectedCafe,  // Keep all original properties
                  upvotes: updatedCafe.upvotes || selectedCafe.upvotes || 0,
                  downvotes: updatedCafe.downvotes || selectedCafe.downvotes || 0
                };
                handleVoteUpdate(selectedCafe.id, completeUpdatedCafe);
              }
            }}
          />
        )}
      </Modal>
    </>
  );
}
