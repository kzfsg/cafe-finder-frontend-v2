import { useState, useEffect, useRef } from 'react';
import BookmarkButton from './BookmarkButton';
import UpvoteButton from './UpvoteButton';
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
  onUpvote?: (id: number, newUpvotes: number, cafe: Cafe) => void;
  onClick?: () => void;
}

export default function CafeCard({ id = 0, title, name, image, images = [], description, hasWifi = false, hasPower = false, wifi = false, powerOutletAvailable = false, upvotes = 0, onUpvote, onClick }: CafeCardProps) {
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
        
        {/* Upvote button */}
        <UpvoteButton cafeId={id} upvotes={upvotes} />
        
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
            <UpvoteButton 
              cafeId={id} 
              upvotes={upvotes} 
              onUpvote={onUpvote as ((id: number, newUpvotes: number, cafe: Cafe) => void)}
            />
          </div>
        </div>
        <p className="cafe-description">
          {typeof description === 'string' 
            ? description.length > 120 
              ? `${description.substring(0, 120)}...` 
              : description
            : 'No description available'}
        </p>
      </div>
    </div>
  );
}
