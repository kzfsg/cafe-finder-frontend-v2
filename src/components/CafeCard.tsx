import { useState, useRef, useEffect } from 'react';

interface CafeCardProps {
  title: string;
  image: string;
  images?: string[];
  description: string;
  hasWifi?: boolean;
  hasPower?: boolean;
  upvotes?: number;
  onClick?: () => void;
}

export default function CafeCard({ title, image, images = [], description, hasWifi = false, hasPower = false, upvotes = 0, onClick }: CafeCardProps) {
  // Combine the main image with additional images if provided
  const allImages = images.length > 0 ? [image, ...images] : [image];
  
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
            src={img} 
            alt={`${title} - image ${index + 1}`} 
            className={`cafe-image ${index === currentImageIndex ? 'active' : ''}`}
            loading="lazy"
          />
        ))}
        
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
            <div className="upvotes-container" title="Upvotes">
              <img src="/icons/upvote.svg" alt="Upvote" className="upvote-icon" />
              <span className="upvotes-count">{upvotes}</span>
            </div>
          </div>
        </div>
        <p className="cafe-description">{description}</p>
      </div>
    </div>
  );
}
