import { useState, useEffect, useRef } from 'react';
import BookmarkButton from './BookmarkButton';
import UpvoteButton from './UpvoteButton';
import DownvoteButton from './DownvoteButton';
import type { Cafe } from '../data/cafes';

interface CafeCardProps {
  id?: number;
  documentId?: string;
  title?: string;
  name?: string; // New Supabase field
  image?: string;
  images?: string[];
  description?: string;
  hasWifi?: boolean;
  hasPower?: boolean;
  wifi?: boolean; // New Supabase field
  powerOutletAvailable?: boolean; // New Supabase field
  upvotes?: number;
  downvotes?: number;
  distance?: number; // Distance from user in kilometers
  onUpvote?: (id: number, newUpvotes: number, cafe: Cafe) => void;
  onDownvote?: (id: number, newDownvotes: number, cafe: Cafe) => void;
  onClick?: () => void;
}

export default function CafeCard({ id = 0, title, name, image, images = [], hasWifi = false, hasPower = false, wifi = false, powerOutletAvailable = false, upvotes = 0, downvotes = 0, distance, onUpvote, onDownvote, onClick }: CafeCardProps) {
  // Use name as title if title is not provided (for Supabase compatibility)
  const displayTitle = title || name || 'Unnamed Cafe';
  // No need for upvote state management here - moved to UpvoteButton component
  // Default image placeholder (using local SVG instead of external service)
  const defaultImage = '/cafe-finder-frontend-v2/images/no-image.svg';
  
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
      <div className="cafe-gallery" style={{ position: 'relative' }}>
        {uniqueImages.map((img, index) => (
          <img 
            key={index}
            src={img || defaultImage} 
            alt={`${displayTitle} - image ${index + 1}`} 
            className={`cafe-image ${index === currentImageIndex ? 'active' : ''}`}
            loading="lazy"
            onError={(e) => {
              // If image fails to load, replace with default
              (e.target as HTMLImageElement).src = defaultImage;
            }}
            style={{ 
              display: index === currentImageIndex ? 'block' : 'none',
              width: '100%',
              height: 'auto',
              position: 'relative',
              objectFit: 'contain'
            }}
          />
        ))}
        
        {/* Top bar with distance and actions */}
        <div className="cafe-top-bar">
          {/* Distance indicator */}
          {distance !== undefined && (
            <div className="cafe-distance-badge">
              <img src="/cafe-finder-frontend-v2/icons/location.svg" alt="Distance" className="distance-icon" />
              <span>{distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}</span>
            </div>
          )}
          
          {/* Vote buttons */}
          <div className="card-vote-buttons">
            <UpvoteButton 
              cafeId={id} 
              upvotes={upvotes} 
              onUpvote={onUpvote}
            />
            <DownvoteButton 
              cafeId={id} 
              downvotes={downvotes} 
              onDownvote={onDownvote}
            />
          </div>
        </div>
        
        {/* Bottom overlay with title */}
        <div className="cafe-overlay">
          <h3 className="cafe-title">{displayTitle}</h3>
        </div>
        
        {/* Bookmark and Amenities Container */}
        <div className="bookmark-amenities-container">
          {/* Bookmark button */}
          <BookmarkButton cafeId={id} />
          
          {/* Amenities - Only show if at least one amenity exists */}
          {(hasWifi || wifi || hasPower || powerOutletAvailable) && (
            <div className="cafe-meta">
              {(hasWifi || wifi) && (
                <div className="amenity wifi available">
                  <img 
                    src="/cafe-finder-frontend-v2/icons/wifi.svg"
                    alt="WiFi Available" 
                    className="amenity-icon" 
                    title="WiFi Available"
                  />
                </div>
              )}
              {(hasPower || powerOutletAvailable) && (
                <div className="amenity power available">
                  <img 
                    src="/cafe-finder-frontend-v2/icons/power.svg"
                    alt="Power Outlets Available" 
                    className="amenity-icon"
                    title="Power Outlets Available"
                  />
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Gallery indicators */}
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
    </div>
  );
}
