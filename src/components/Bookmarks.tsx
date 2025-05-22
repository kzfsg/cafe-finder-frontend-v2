import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bookmarkService from '../services/bookmarkService';
import authService from '../services/authService';
import CafeCard from './CafeCard';
import MasonryGrid from './MasonryGrid';
import type { Cafe } from '../data/cafes';

const Bookmarks = () => {
  const [bookmarkedCafes, setBookmarkedCafes] = useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    if (!authService.isLoggedIn()) {
      navigate('/login', { state: { from: '/bookmarks' } });
      return;
    }

    fetchBookmarkedCafes();
  }, [navigate]);

  const fetchBookmarkedCafes = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching bookmarked cafes from Bookmarks component...');
      const cafes = await bookmarkService.getBookmarkedCafes();
      
      // Debug the data received from the bookmarkService
      console.log('Received bookmarked cafes:', cafes);
      
      if (cafes && cafes.length > 0) {
        // Log the first cafe's image data to check its structure
        console.log('First cafe image data:', {
          id: cafes[0].id,
          title: cafes[0].title,
          image: cafes[0].image,
          gallery: cafes[0].gallery,
          hasImage: Boolean(cafes[0].image),
          galleryLength: cafes[0].gallery ? cafes[0].gallery.length : 0
        });
      }
      
      setBookmarkedCafes(cafes);
    } catch (error) {
      console.error('Error fetching bookmarked cafes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCafeClick = (cafe: Cafe) => {
    navigate(`/cafe/${cafe.id}`);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your bookmarked cafes...</p>
      </div>
    );
  }

  return (
    <div className="bookmarks-container">
      <h1 className="page-title">My Bookmarked Cafes</h1>
      
      {bookmarkedCafes.length === 0 ? (
        <div className="empty-state">
          <img src="/icons/bookmark.svg" alt="Bookmark" className="empty-state-icon" />
          <h2>No bookmarked cafes yet</h2>
          <p>Explore cafes and bookmark your favorites to see them here.</p>
          <button 
            className="primary-button"
            onClick={() => navigate('/')}
          >
            Explore Cafes
          </button>
        </div>
      ) : (
        <MasonryGrid>
          {bookmarkedCafes.map(cafe => (
            <CafeCard
              key={cafe.id}
              id={cafe.id}
              title={cafe.title}
              image={cafe.image}
              images={cafe.gallery || []}
              description={cafe.description}
              hasWifi={cafe.hasWifi}
              hasPower={cafe.hasPower}
              upvotes={cafe.upvotes}
              onClick={() => handleCafeClick(cafe)}
            />
          ))}
        </MasonryGrid>
      )}
    </div>
  );
};

export default Bookmarks;
