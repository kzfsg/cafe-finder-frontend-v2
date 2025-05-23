import { useState, useEffect, useRef } from 'react';
import BookmarkButton from './BookmarkButton';
import cafeService from '../services/cafeService';

interface CafeCardProps {
  id?: number;
  title: string;
  image: string;
  images?: string[];
  description: string;
  hasWifi?: boolean;
  hasPower?: boolean;
  upvotes?: number;
  onUpvote?: (id: number, newUpvotes: number) => void;
  onClick?: () => void;
}

export default function CafeCard({ id = 0, title, image, images = [], description, hasWifi = false, hasPower = false, upvotes = 0, onUpvote, onClick }: CafeCardProps) {
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes);
  
  // Check if cafe is upvoted on component mount
  useEffect(() => {
    const checkUpvoteStatus = async () => {
      if (id) {
        try {
          const upvoted = await cafeService.isCafeUpvoted(id);
          setIsUpvoted(upvoted);
        } catch (error) {
          console.error('Error checking upvote status:', error);
        }
      }
    };
    
    checkUpvoteStatus();
  }, [id]);
  
  // Update local upvote count when prop changes
  useEffect(() => {
    setCurrentUpvotes(upvotes);
  }, [upvotes]);
  // Default image placeholder (using local SVG instead of external service)
  const defaultImage = '/images/no-image.svg';
  
  // Ensure image is valid, use default if not
  const safeMainImage = image || defaultImage;
  
  // Filter out any undefined or null images
  const safeImages = images.filter(img => img);
  
  // Combine the main image with additional images if provided
  const allImages = safeImages.length > 0 ? [safeMainImage, ...safeImages] : [safeMainImage];
  
  // Use only unique images
  const uniqueImages = [...new Set(allImages)];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef<number | null>(null);
  
  // Start auto-scrolling when hovering
  useEffect(() => {
    if (isHovering && uniqueImages.length > 1) {
      intervalRef.current = window.setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % uniqueImages.length);
      }, 1200); // Change image every 1.2 seconds
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isHovering, uniqueImages.length]);
  
  return (
    <div 
      className="cafe-card" 
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setCurrentImageIndex(0); // Reset to first image when mouse leaves
      }}
      onClick={onClick}
    >
      <div className="cafe-gallery">
        {uniqueImages.map((img, index) => (
          <img 
            key={index}
            src={img || defaultImage} 
            alt={`${title} - image ${index + 1}`} 
            className={`cafe-image ${index === currentImageIndex ? 'active' : ''}`}
            loading="lazy"
            onError={(e) => {
              // If image fails to load, replace with default
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />
        ))}
        
        {/* Bookmark button */}
        <BookmarkButton cafeId={id} />
        
        {uniqueImages.length > 1 && (
          <div className="gallery-indicators">
            {uniqueImages.map((_, index) => (
              <span 
                key={index} 
                className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="cafe-content">
        <div className="cafe-header">
          <h3 className="cafe-title">{title}</h3>
          <div className="cafe-meta">
            <div className="cafe-amenities">
              {hasWifi && (
                <div className="amenity wifi" title="WiFi Available">
                  <img src="/icons/wifi.svg" alt="WiFi" />
                </div>
              )}
              {hasPower && (
                <div className="amenity power" title="Power Outlets Available">
                  <img src="/icons/power.svg" alt="Power Outlets" />
                </div>
              )}
            </div>
            <button 
              className={`upvote-button ${isUpvoted ? 'upvoted' : ''} ${isUpvoting ? 'loading' : ''}`}
              onClick={async (e) => {
                e.stopPropagation(); // Prevent card click
                if (isUpvoting || !id) return;
                
                setIsUpvoting(true);
                try {
                  const result = await cafeService.upvoteCafe(id);
                  if (result) {
                    setIsUpvoted(result.upvoted);
                    setCurrentUpvotes(result.upvotes);
                    if (onUpvote) {
                      onUpvote(id, result.upvotes);
                    }
                  }
                } catch (error) {
                  console.error('Error toggling upvote:', error);
                } finally {
                  setIsUpvoting(false);
                }
              }}
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
          </div>
        </div>
        <p className="cafe-description">
          {typeof description === 'string' 
            ? description 
            : description && typeof description === 'object' 
              ? 'No description available' // Fallback for object descriptions
              : 'No description available'}
        </p>
      </div>
    </div>
  );
}
