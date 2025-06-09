import { useState, useEffect } from 'react';
import { Container, Title, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import reviewService from '../services/reviewService';
import bookmarkService from '../services/bookmarkService';
import type { Cafe } from '../data/cafes';
import type { Review } from '../services/reviewService';
import ProfileHeader from '../components/profile/ProfileHeader';
import BookmarkedCafes from '../components/profile/BookmarkedCafes';
import UserReviews from '../components/profile/UserReviews';
import ActionCard from '../components/profile/ActionCard';

// Extend the Review type to include the additional fields we're adding
type ExtendedReview = Review & {
  cafe_name: string;
  cafe_image?: string;
};

import '../styles/Dashboard.css';
import '../styles/ProfileComponents.css';

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

  return (
    <div className="dashboard-container">
      <div className="bento-grid">
        {/* User Profile Card */}
        <ProfileHeader 
          user={user} 
          reviewCount={reviewCount} 
        />
        
        {/* Bookmarked Cafes Card */}
        <BookmarkedCafes bookmarkedCafes={bookmarkedCafes} />
        
        {/* My Reviews Card */}
        <UserReviews userReviews={userReviews} />
        
        {/* Action Cards */}
        <ActionCard type="settings" />
        <ActionCard type="community" />
        <ActionCard type="achievements" />
      </div>
    </div>
  );
}
