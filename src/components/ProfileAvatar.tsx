import { useState, useEffect } from 'react';

interface ProfileAvatarProps {
  imageUrl?: string;
  username?: string;
  size?: number;
}

export default function ProfileAvatar({ 
  imageUrl, 
  username = 'User', 
  size = 36 
}: ProfileAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Reset states when imageUrl changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [imageUrl]);

  // Get the first letter of username for the default avatar
  const initial = username.charAt(0).toUpperCase();
  
  // Style objects for dynamic sizing
  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`
  };
  
  const fontSize = {
    fontSize: `${Math.floor(size / 2.25)}px`
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="profile-avatar" style={avatarStyle}>
      {imageUrl && !imageError ? (
        <img 
          src={imageUrl}
          alt={`${username}'s profile`}
          className={`profile-image ${imageLoaded ? 'loaded' : 'loading'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <div className="default-avatar">
          <span style={fontSize}>{initial}</span>
        </div>
      )}
    </div>
  );
}
