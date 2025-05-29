import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import downvoteService from '../services/downvoteService';
import authService from '../services/authService';
import type { Cafe } from '../data/cafes';
import '../styles/DownvoteButton.css';

interface DownvoteButtonProps {
  cafeId: number;
  downvotes?: number;
  onDownvote?: (id: number, newDownvotes: number, cafe: Cafe) => void;
}

const DownvoteButton: React.FC<DownvoteButtonProps> = ({ 
  cafeId, 
  downvotes = 0, 
  onDownvote 
}) => {
  const navigate = useNavigate();
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downvoteCount, setDownvoteCount] = useState(downvotes);
  
  // Check if cafe is downvoted on component mount
  useEffect(() => {
    const checkDownvoteStatus = async () => {
      if (cafeId) {
        try {
          const downvoted = await downvoteService.isCafeDownvoted(cafeId);
          setIsDownvoted(downvoted);
        } catch (error) {
          console.error('Error checking downvote status:', error);
        }
      }
    };
    
    checkDownvoteStatus();
  }, [cafeId]);
  
  // Update local downvote count when prop changes
  useEffect(() => {
    setDownvoteCount(downvotes);
    
    // Re-check downvote status when downvotes count changes
    // This ensures the button state stays in sync
    const refreshDownvoteStatus = async () => {
      if (cafeId) {
        try {
          const downvoted = await downvoteService.isCafeDownvoted(cafeId);
          setIsDownvoted(downvoted);
        } catch (error) {
          console.error('Error refreshing downvote status:', error);
        }
      }
    };
    
    refreshDownvoteStatus();
  }, [downvotes, cafeId]);

  const handleToggleDownvote = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent element click
    
    // Don't allow downvoting if already in progress or no cafeId
    if (isLoading || !cafeId) {
      console.log('Downvote aborted: loading =', isLoading, 'cafeId =', cafeId);
      return;
    }
    
    // Check if user is logged in
    const isLoggedIn = await authService.isLoggedIn();
    if (!isLoggedIn) {
      // Redirect to login page with return URL
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    
    console.log('Attempting to toggle downvote for cafe:', cafeId, 'Current downvote status:', isDownvoted);
    setIsLoading(true);
    
    try {
      // Call the toggleDownvote service function
      console.log('Calling downvoteService.toggleDownvote with cafeId:', cafeId);
      const result = await downvoteService.toggleDownvote(cafeId);
      console.log('Toggle downvote result:', result);
      
      if (result.success) {
        // Update local state based on the server response
        console.log('Downvote operation successful, new status:', result.downvoted ? 'downvoted' : 'not downvoted');
        setIsDownvoted(result.downvoted);
        setDownvoteCount(result.downvotes);
        
        // Notify parent component if callback provided
        if (onDownvote && result.cafe) {
          console.log('Calling parent onDownvote callback with new downvote count:', result.downvotes);
          onDownvote(cafeId, result.downvotes, result.cafe);
        }
      } else {
        // Handle unsuccessful downvote operation
        console.error('Failed to toggle downvote for cafe:', cafeId, 'Result:', result);
      }
    } catch (error) {
      console.error('Error toggling downvote for cafe:', cafeId, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      className={`downvote-button ${isDownvoted ? 'downvoted' : ''} ${isLoading ? 'loading' : ''}`}
      onClick={handleToggleDownvote}
      title={isDownvoted ? 'Remove downvote' : 'Downvote this cafe'}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      <img 
        src="/icons/downvote.svg" 
        alt={isDownvoted ? 'Downvoted' : 'Downvote'} 
        className={`downvote-icon ${isDownvoted ? 'active' : ''} ${isLoading ? 'loading' : ''}`} 
      />
      <span className="downvote-count">{downvoteCount}</span>
    </button>
  );
};

export default DownvoteButton;
