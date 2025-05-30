interface ProfileAvatarProps {
  imageUrl?: string;
  size?: number;
}

export default function ProfileAvatar({ 
  imageUrl, 
  size = 36 
}: ProfileAvatarProps) {
  // Style object for dynamic sizing
  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`
  };

  return (
    <div className="profile-avatar" style={avatarStyle}>
      {imageUrl ? (
        <img 
          src={imageUrl}
          alt="User profile"
          className="profile-image"
        />
      ) : (
        <img 
          src="/cafe-finder-frontend-v2/icons/default-avatar.svg"
          alt="Default profile"
          className="profile-image"
        />
      )}
    </div>
  );
}
