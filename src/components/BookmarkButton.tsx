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
    // Only check bookmark status if user is logged in
    if (authService.isLoggedIn()) {
      checkBookmarkStatus();
    } else {
      setIsLoading(false);
    }
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
    
    if (!authService.isLoggedIn()) {
      // Redirect to login if not logged in
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      setIsLoading(true);
      const result = await bookmarkService.toggleBookmark(cafeId);
      setIsBookmarked(result.bookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''} ${className}`}
      onClick={handleBookmarkClick}
      disabled={isLoading}
      title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
    >
      <img 
        src={isBookmarked ? '/icons/bookmark-filled.svg' : '/icons/bookmark.svg'} 
        alt={isBookmarked ? 'Bookmarked' : 'Bookmark'} 
        className="bookmark-icon"
      />
    </button>
  );
};

export default BookmarkButton;
