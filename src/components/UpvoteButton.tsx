import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import upvoteService from '../services/upvoteService';
import authService from '../services/authService';
import type { Cafe } from '../data/cafes';
import '../styles/UpvoteButton.css';

interface UpvoteButtonProps {
  cafeId: number;
  upvotes?: number;
  onUpvote?: (id: number, newUpvotes: number, cafe: Cafe) => void;
}

const UpvoteButton: React.FC<UpvoteButtonProps> = ({ 
  cafeId, 
  upvotes = 0, 
  onUpvote 
}) => {
  const navigate = useNavigate();
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(upvotes);
  
  // Check if cafe is upvoted on component mount
  useEffect(() => {
    const checkUpvoteStatus = async () => {
      if (cafeId) {
        try {
          const upvoted = await upvoteService.isCafeUpvoted(cafeId);
          setIsUpvoted(upvoted);
        } catch (error) {
          console.error('Error checking upvote status:', error);
        }
      }
    };
    
    checkUpvoteStatus();
  }, [cafeId]);
  
  // Update local upvote count when prop changes
  useEffect(() => {
    setUpvoteCount(upvotes);
    
    // Re-check upvote status when upvotes count changes
    // This ensures the button state stays in sync
    const refreshUpvoteStatus = async () => {
      if (cafeId) {
        try {
          const upvoted = await upvoteService.isCafeUpvoted(cafeId);
          setIsUpvoted(upvoted);
        } catch (error) {
          console.error('Error refreshing upvote status:', error);
        }
      }
    };
    
    refreshUpvoteStatus();
  }, [upvotes, cafeId]);

  const handleToggleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent element click
    
    // Don't allow upvoting if already in progress or no cafeId
    if (isLoading || !cafeId) {
      console.log('Upvote aborted: loading =', isLoading, 'cafeId =', cafeId);
      return;
    }
    
    // Check if user is logged in
    const isLoggedIn = await authService.isLoggedIn();
    if (!isLoggedIn) {
      // Redirect to login page with return URL
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    
    console.log('Attempting to toggle upvote for cafe:', cafeId, 'Current upvote status:', isUpvoted);
    setIsLoading(true);
    
    try {
      // Call the toggleUpvote service function
      console.log('Calling upvoteService.toggleUpvote with cafeId:', cafeId);
      const result = await upvoteService.toggleUpvote(cafeId);
      console.log('Toggle upvote result:', result);
      
      if (result.success) {
        // Update local state based on the server response
        console.log('Upvote operation successful, new status:', result.upvoted ? 'upvoted' : 'not upvoted');
        setIsUpvoted(result.upvoted);
        setUpvoteCount(result.upvotes);
        
        // Notify parent component if callback provided
        if (onUpvote && result.cafe) {
          console.log('Calling parent onUpvote callback with new upvote count:', result.upvotes);
          onUpvote(cafeId, result.upvotes, result.cafe);
        }
      } else {
        // Handle unsuccessful upvote operation
        console.error('Failed to toggle upvote for cafe:', cafeId, 'Result:', result);
      }
    } catch (error) {
      console.error('Error toggling upvote for cafe:', cafeId, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      className={`upvote-button ${isUpvoted ? 'upvoted' : ''} ${isLoading ? 'loading' : ''}`}
      onClick={handleToggleUpvote}
      title={isUpvoted ? 'Remove upvote' : 'Upvote this cafe'}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      <img 
        src="/icons/upvote.svg" 
        alt={isUpvoted ? 'Upvoted' : 'Upvote'} 
        className={`upvote-icon ${isUpvoted ? 'active' : ''} ${isLoading ? 'loading' : ''}`} 
      />
      <span className="upvote-count">{upvoteCount}</span>
    </button>
  );
};

export default UpvoteButton;
