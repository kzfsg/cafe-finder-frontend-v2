import { useState, useEffect } from 'react';
import upvoteService from '../services/upvoteService';
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
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
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
  }, [upvotes]);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent element click
    console.log('Upvote button clicked with cafeId:', cafeId);
    if (isUpvoting || !cafeId) {
      console.log('Upvote aborted: isUpvoting=', isUpvoting, 'cafeId=', cafeId);
      return;
    }
    
    setIsUpvoting(true);
    try {
      console.log('Calling upvoteService.upvoteCafe with cafeId:', cafeId);
      const result = await upvoteService.upvoteCafe(cafeId); // calls upvoteCafe
      console.log('Upvote result:', result);
      // Update local state
      setIsUpvoted(true);
      const newUpvotes = upvoteCount + 1;
      setUpvoteCount(newUpvotes);
      
      // Call parent callback if provided
      if (onUpvote) {
        onUpvote(cafeId, newUpvotes, {} as Cafe);
      }
    } catch (error) {
      console.error('Error toggling upvote:', error);
    } finally {
      setIsUpvoting(false);
    }
  };

  return (
    <button 
      className={`upvote-button ${isUpvoted ? 'upvoted' : ''} ${isUpvoting ? 'loading' : ''}`}
      onClick={handleUpvote}
      title={isUpvoted ? 'Remove upvote' : 'Upvote this cafe'}
      disabled={isUpvoting}
      aria-busy={isUpvoting}
    >
      <img 
        src="/icons/upvote.svg" 
        alt={isUpvoted ? 'Upvoted' : 'Upvote'} 
        className={`upvote-icon ${isUpvoted ? 'active' : ''} ${isUpvoting ? 'loading' : ''}`} 
      />
      <span className="upvote-count">{upvoteCount}</span>
    </button>
  );
};

export default UpvoteButton;
