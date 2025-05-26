import { useState, useEffect } from 'react';
import bookmarkService from '../services/bookmarkService';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

interface BookmarkButtonProps {
  cafeId: number;
  className?: string;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ cafeId, className = '' }) => {
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and then check bookmark status
    const checkAuth = async () => {
      const isLoggedIn = await authService.isLoggedIn();
      if (isLoggedIn) {
        checkBookmarkStatus();
      } else {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [cafeId]);

  const checkBookmarkStatus = async () => {
    try {
      setIsLoading(true);
      const bookmarked = await bookmarkService.isBookmarked(cafeId);
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    
    // Check if user is logged in
    const isLoggedIn = await authService.isLoggedIn();
    if (!isLoggedIn) {
      // Redirect to login if not logged in
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Attempting to toggle bookmark for cafe ${cafeId}...`);
      
      // Toggle the bookmark
      const result = await bookmarkService.toggleBookmark(cafeId);
      console.log('Toggle result:', result);
      
      // Update the UI state
      setIsBookmarked(result.bookmarked);
      
      // Show a visual feedback (could add a toast notification here)
      console.log(result.message);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine the appropriate styles and icons based on state
  const buttonClasses = [
    'bookmark-button',
    isBookmarked ? 'bookmarked' : '',
    isLoading ? 'loading' : '',
    className
  ].filter(Boolean).join(' ');
  
  const iconSrc = isBookmarked ? '/icons/bookmark-filled.svg' : '/icons/bookmark.svg';
  const iconAlt = isBookmarked ? 'Bookmarked' : 'Bookmark';
  const buttonTitle = isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks';
  
  return (
    <button 
      className={buttonClasses}
      onClick={handleBookmarkClick}
      disabled={isLoading}
      title={buttonTitle}
      style={{ 
        // Inline styles for better visibility during debugging
        backgroundColor: isBookmarked ? 'rgba(255, 87, 34, 0.2)' : 'rgba(255, 255, 255, 0.8)' 
      }}
    >
      {isLoading ? (
        <div className="button-spinner"></div>
      ) : (
        <img 
          src={iconSrc} 
          alt={iconAlt} 
          className="bookmark-icon"
          onError={(e) => {
            console.error(`Failed to load bookmark icon: ${iconSrc}`);
            // Fallback to text if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
    </button>
  );
};

export default BookmarkButton;
