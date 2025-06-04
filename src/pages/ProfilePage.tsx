import { useState, useEffect } from 'react';
import { Container, Title, Button, Avatar, Text } from '@mantine/core';
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
        <div className="bento-card profile-card">
          <div className="profile-header">
            <Avatar
              src={user?.avatar || '/cafe-finder-frontend-v2/images/default-avatar.svg'}
              className="profile-avatar"
              alt={user?.name || 'User'}
            />
            <div className="profile-info">
              <h2 className="profile-name">{user?.name || 'User'}</h2>
              <p className="profile-occupation">UX Designer</p>
              
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{reviewCount}</span>
                  <span className="stat-label">Reviews Written</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">8</span>
                  <span className="stat-label">Cafes Discovered</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="xp-container">
            <div className="xp-label">
              <span>Level 7: Cafe Aficionado</span>
              <span>75%</span>
            </div>
            <div className="xp-bar-container">
              <div className="xp-bar-progress" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
        
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
