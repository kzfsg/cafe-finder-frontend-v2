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
        
        {/* Distance indicator */}
        {distance !== undefined && (
          <div className="cafe-distance-badge">
            <img src="/icons/location.svg" alt="Distance" className="distance-icon" />
            <span>{distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}</span>
          </div>
        )}
        
        <div className="card-vote-buttons">
          {/* Upvote button */}
          <UpvoteButton 
            cafeId={id} 
            upvotes={upvotes} 
            onUpvote={onUpvote}
          />
          
          {/* Downvote button */}
          <DownvoteButton 
            cafeId={id} 
            downvotes={downvotes} 
            onDownvote={onDownvote}
          />
        </div>
        
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
          <h3 className="cafe-title">{displayTitle}</h3>
          <div className="cafe-meta">
            <div className={`amenity wifi ${hasWifi || wifi ? 'available' : 'unavailable'}`}>
              <img 
                src="/icons/wifi.svg" 
                alt="WiFi" 
                className="amenity-icon" 
              />
            </div>
            <div className={`amenity power ${hasPower || powerOutletAvailable ? 'available' : 'unavailable'}`}>
              <img 
                src="/icons/power.svg" 
                alt="Power Outlets" 
                className="amenity-icon" 
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
