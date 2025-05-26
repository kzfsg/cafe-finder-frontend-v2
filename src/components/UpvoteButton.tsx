import { useState, useEffect } from 'react';
import upvoteService from '../services/upvoteService';
import type { Cafe } from '../data/cafes';

interface UpvoteButtonProps {
  cafeId: string;
  initialUpvotes?: number;
  onUpvoteChange?: (id: string, newUpvotes: number, cafe: Cafe) => void;
}

const UpvoteButton: React.FC<UpvoteButtonProps> = ({ 
  cafeId, 
  initialUpvotes = 0, 
  onUpvoteChange 
}) => {
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  
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
    setUpvotes(initialUpvotes);
  }, [initialUpvotes]);

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
      if (result) {
        setIsUpvoted(result.upvoted);
        setUpvotes(result.upvotes);
        if (onUpvoteChange) {
          onUpvoteChange(cafeId, result.upvotes, result.cafe);
        }
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
        alt="Upvote" 
        className={`upvote-icon ${isUpvoted ? 'active' : ''} ${isUpvoting ? 'loading' : ''}`} 
      />
      <span className="upvotes-count">{upvotes}</span>
    </button>
  );
};

export default UpvoteButton;
