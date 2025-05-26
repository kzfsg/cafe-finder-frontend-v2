import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import bookmarkService from '../services/bookmarkService';
import authService from '../services/authService';
import CafeCard from './CafeCard';
import MasonryGrid from './MasonryGrid';
import CafeDetails from './CafeDetails';
import type { Cafe } from '../data/cafes';

const Bookmarks = () => {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [bookmarkedCafes, setBookmarkedCafes] = useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
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
      setError(null);
      console.log('Fetching bookmarked cafes...');
      
      const cafes = await bookmarkService.getBookmarkedCafes();
      
      if (cafes && cafes.length > 0) {
        console.log('Successfully fetched bookmarked cafes:', cafes.length);
        setBookmarkedCafes(cafes);
      } else {
        setError('No bookmarked cafes found.');
      }
    } catch (err: any) {
      console.error('Error fetching bookmarked cafes:', err);
      setError('Failed to load bookmarked cafes. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCafeClick = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseDetails = () => {
    setIsClosing(true);
    
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    
    closeTimeoutRef.current = window.setTimeout(() => {
      setSelectedCafe(null);
      setIsClosing(false);
      document.body.style.overflow = 'auto';
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {isLoading && bookmarkedCafes.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your bookmarked cafes...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button 
            onClick={async () => {
              setIsLoading(true);
              setError(null);
              try {
                const cafes = await bookmarkService.getBookmarkedCafes();
                if (cafes && cafes.length > 0) {
                  setBookmarkedCafes(cafes);
                } else {
                  setError('No bookmarked cafes found.');
                }
              } catch (err) {
                setError('Failed to load bookmarked cafes. Please try again later.');
              } finally {
                setIsLoading(false);
              }
            }} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      ) : bookmarkedCafes.length === 0 ? (
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
        <div className="bookmarks-container">
          <h1 className="page-title">My Bookmarked Cafes</h1>
          <MasonryGrid>
            {bookmarkedCafes.map(cafe => (
              <CafeCard
                key={cafe.id}
                id={cafe.id}
                documentId={cafe.documentId || ''}
                title={cafe.title || cafe.Name}
                image={cafe.image || ''}
                images={cafe.gallery || []}
                description={typeof cafe.description === 'string' ? cafe.description : 
                  (cafe.Description ? 
                    // Extract text from Description array if it exists
                    cafe.Description.map(block => 
                      block.children?.map((child: any) => child.text || '').join('') || ''
                    ).join(' ') : 
                    'No description available'
                  )
                }
                hasWifi={cafe.hasWifi || false}
                hasPower={cafe.hasPower || false}
                upvotes={cafe.upvotes || 0}
                onClick={() => handleCafeClick(cafe)}
              />
            ))}
          </MasonryGrid>
        </div>
      )}

      {selectedCafe && (
        <div 
          className="cafe-details-overlay"
          onClick={handleCloseDetails}
        >
          <div 
            className={`cafe-details-wrapper ${isClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CafeDetails cafe={selectedCafe} onClose={handleCloseDetails} />
          </div>
        </div>
      )}
    </>
  );
};

export default Bookmarks;
