import { useState, useEffect } from 'react';
import upvoteService from '../services/upvoteService';

interface UpvoteButtonProps {
  documentId: string;
  initialUpvotes: number;
  onUpvote?: (documentId: string, newUpvotes: number) => void;
  className?: string;
}

const UpvoteButton = ({ 
  documentId, 
  initialUpvotes, 
  onUpvote,
  className = '' 
}: UpvoteButtonProps) => {
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(initialUpvotes);

  // Check if cafe is upvoted on component mount
  useEffect(() => {
    const checkUpvoteStatus = async () => {
      if (documentId) {
        try {
          const upvoted = await upvoteService.isCafeUpvoted(documentId);
          setIsUpvoted(upvoted);
        } catch (error) {
          console.error('Error checking upvote status:', error);
        }
      }
    };
    
    checkUpvoteStatus();
  }, [documentId]);
  
  // Update local upvote count when prop changes
  useEffect(() => {
    setCurrentUpvotes(initialUpvotes);
  }, [initialUpvotes]);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (isUpvoting || !documentId) return;
    
    setIsUpvoting(true);
    try {
      const result = await upvoteService.upvoteCafe(documentId);
      if (result) {
        setIsUpvoted(result.upvoted);
        setCurrentUpvotes(result.upvotes);
        if (onUpvote) {
          onUpvote(documentId, result.upvotes);
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
      className={`upvote-button ${isUpvoted ? 'upvoted' : ''} ${isUpvoting ? 'loading' : ''} ${className}`}
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
      <span className="upvotes-count">{currentUpvotes}</span>
    </button>
  );
};

export default UpvoteButton;
