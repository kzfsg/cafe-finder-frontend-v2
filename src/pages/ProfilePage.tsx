import { useState, useEffect } from 'react';
import { Container, Title, Button, Paper, Group, Stack, Avatar, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSettings, FiUsers, FiAward } from 'react-icons/fi';
import CafeCard from '../components/CafeCard';
import reviewService from '../services/reviewService';
import bookmarkService from '../services/bookmarkService';
import type { Cafe } from '../data/cafes';
import type { Review } from '../services/reviewService';

// Extend the Review type to include the additional fields we're adding
type ExtendedReview = Review & {
  cafe_name: string;
  cafe_image?: string;
};
import '../styles/Dashboard.css';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [userReviews, setUserReviews] = useState<ExtendedReview[]>([]);
  const [bookmarkedCafes, setBookmarkedCafes] = useState<Cafe[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  
  // Fetch user data when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      // Fetch user reviews
      const fetchUserReviews = async () => {
        try {
          const reviews = await reviewService.getUserReviews(user.id) as ExtendedReview[];
          setUserReviews(reviews);
          setReviewCount(reviews.length);
        } catch (error) {
          console.error('Error fetching user reviews:', error);
        }
      };
      
      // Fetch bookmarked cafes
      const fetchBookmarkedCafes = async () => {
        try {
          const bookmarks = await bookmarkService.getBookmarkedCafes();
          setBookmarkedCafes(bookmarks);
        } catch (error) {
          console.error('Error fetching bookmarked cafes:', error);
        }
      };
      
      fetchUserReviews();
      fetchBookmarkedCafes();
    }
  }, [isAuthenticated, user]);
  
  // If user is not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <Container size="sm" style={{ padding: '2rem', textAlign: 'center' }}>
        <Title order={2} mb="md">Please log in to view your profile</Title>
        <Button component={Link} to="/login" variant="filled">
          Go to Login
        </Button>
      </Container>
    );
  }

  // Format date for review display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="dashboard-container">
      
      <div className="bento-grid">
        {/* User Profile Card */}
        <Paper withBorder p="md" radius="md" className="bento-card" style={{ height: '100%' }}>
          <Stack gap="md" style={{ height: '100%' }}>
            <Group wrap="nowrap" align="flex-start" gap="md">
              <Avatar 
                src={user?.avatar || '/images/default-avatar.svg'}
                size={100}
                radius={100}
                alt={user?.name || 'User'}
              />
              <Stack gap={4} style={{ flex: 1 }}>
                <Title order={3} size="h4">{user?.name || 'User'}</Title>
                <Text size="sm" color="dimmed">UX Designer</Text>
                
                <Group gap ="xl" mt="sm">
                  <div style={{ textAlign: 'center' }}>
                    <Text fw={700} size="lg">{reviewCount}</Text>
                    <Text size="xs" color="dimmed">Reviews</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Text fw={700} size="lg">8</Text>
                    <Text size="xs" color="dimmed">Cafes</Text>
                  </div>
                </Group>
              </Stack>
            </Group>
            
            <div style={{ marginTop: 'auto' }}>
              <Group position="apart" mb={4}>
                <Text size="sm" fw={500}>Level 7: Cafe Aficionado</Text>
                <Text size="sm" color="dimmed">75%</Text>
              </Group>
              <div style={{ height: 8, backgroundColor: '#f1f3f5', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '75%', height: '100%', backgroundColor: '#228be6' }} />
              </div>
            </div>
          </Stack>
        </Paper>
        
        {/* Bookmarked Cafes Card */}
        <div className="bento-card bookmarked-cafes">
          <h3 className="card-title">My Bookmarked Cafes</h3>
          
          {bookmarkedCafes.length > 0 ? (
            <div className="mini-masonry">
              {bookmarkedCafes.slice(0, 3).map((cafe) => (
                <div key={cafe.id} className="mini-cafe-card">
                  <CafeCard
                    id={cafe.id}
                    title={cafe.name}
                    image={cafe.imageUrls?.[0]}
                    images={cafe.imageUrls}
                    wifi={cafe.wifi}
                    powerOutletAvailable={cafe.powerOutletAvailable}
                  />
                </div>
              ))}
              
              {bookmarkedCafes.length > 3 && (
                <Button
                  component={Link}
                  to="/bookmarks"
                  variant="light"
                  color="orange"
                  fullWidth
                  mt="md"
                >
                  View All ({bookmarkedCafes.length})
                </Button>
              )}
            </div>
          ) : (
            <Text color="dimmed" ta='center' mt="xl">
              You haven't bookmarked any cafes yet.
            </Text>
          )}
        </div>
        
        {/* My Reviews Card */}
        <div className="bento-card reviews-card">
          <h3 className="card-title">My Recent Reviews</h3>
          
          {userReviews.length > 0 ? (
            <div className="reviews-list">
              {userReviews.slice(0, 3).map((review, index) => (
                <div key={index} className="review-item">
                  <div className="review-cafe">{review.cafe_name}</div>
                  <div className="review-content">{review.comment}</div>
                  <div className="review-rating">
                    {review.rating ? '👍' : '👎'}
                  </div>
                  {review.cafe_image && (
                    <img 
                      src={review.cafe_image} 
                      alt={review.cafe_name} 
                      className="review-cafe-image"
                      style={{ width: '100%', borderRadius: '8px', marginTop: '8px' }}
                    />
                  )}
                  <div className="review-date">{formatDate(review.created_at)}</div>
                </div>
              ))}
              
              {userReviews.length > 3 && (
                <Button
                  variant="subtle"
                  color="gray"
                  fullWidth
                  mt="md"
                >
                  View All Reviews
                </Button>
              )}
            </div>
          ) : (
            <Text color="dimmed" ta="center" mt="xl">
              You haven't written any reviews yet.
            </Text>
          )}
        </div>
        
        {/* Settings Card */}
        <div className="bento-card settings-card action-card">
          <FiSettings className="action-icon" />
          <span className="action-label">Settings</span>
        </div>
        
        {/* Community Card */}
        <div className="bento-card community-card action-card">
          <FiUsers className="action-icon" />
          <span className="action-label">Community</span>
        </div>
        
        {/* Leaderboard Card */}
        <div className="bento-card leaderboard-card action-card">
          <FiAward className="action-icon" />
          <span className="action-label">Leaderboard</span>
        </div>
      </div>
    </div>
  );
}
