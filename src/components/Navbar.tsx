// No need to import React with modern JSX transform
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import ProfileAvatar from './ProfileAvatar';
import { useAuth } from '../context/AuthContext';
import './../App.css';

interface NavbarProps {
  onSearch: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar"> 
      <div className="navbar-left">
        <Link to="/" className="logo-link">
          <div className="logo">
            <img src="/favicon.svg" alt="Nomadic logo" className="logo-icon" />
            <span className="logo-text tryst">nomadic</span>
          </div>
        </Link>
      </div>
      
      <div className="navbar-center">
        <SearchBar onSearch={onSearch} />
      </div>
      
      <div className="navbar-right">
        <Link to="/bookmarks" className="icon-button saved-button" aria-label="Bookmarked cafes">
          <img src="/icons/bookmark.svg" alt="Bookmarked cafes" className="custom-icon" />
        </Link>
        
        {user ? (
          <div className="user-menu-container">
            <button className="icon-button profile-button" aria-label="User profile">
              <img 
                src={user.avatar?.url || "/icons/default-avatar.svg"} 
                alt={user.username} 
                className="profile-image"
              />
            </button>
            <div className="user-dropdown">
              <span className="user-greeting">Hi, {user.username}</span>
              <Link to="/profile" className="dropdown-item">Profile</Link>
              <Link to="/saved" className="dropdown-item">Saved Cafes</Link>
              <button onClick={handleLogout} className="dropdown-item logout">Log Out</button>
            </div>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="auth-nav-button login-button">Log In</Link>
            <Link to="/signup" className="auth-nav-button signup-button">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
