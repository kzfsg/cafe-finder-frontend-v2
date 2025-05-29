import { Link } from 'react-router-dom';

interface UserDropdownProps {
  username: string;
  avatarUrl?: string;
  onLogout: () => void;
}

export default function UserDropdown({ username, avatarUrl, onLogout }: UserDropdownProps) {
  return (
    <div className="user-menu-container">
      <button className="icon-button profile-button" aria-label="User profile">
        <img 
          src={avatarUrl || "/icons/default-avatar.svg"} 
          alt={username} 
          className="profile-image"
        />
      </button>
      <div className="user-dropdown">
        <span className="user-greeting">Hi, {username}</span>
        <Link to="/profile" className="dropdown-item">Profile</Link>
        <Link to="/saved" className="dropdown-item">Saved Cafes</Link>
        <button onClick={onLogout} className="dropdown-item logout">
          Log Out
        </button>
      </div>
    </div>
  );
}
