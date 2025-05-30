// No need to import React with modern JSX transform
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import UserDropdown from './UserDropdown';
import { useAuth } from '../context/AuthContext';
import './../App.css';

import type { FilterOptions } from './FilterDropdown';

interface NavbarProps {
  onSearch: (query: string, filters?: FilterOptions) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: '#333333',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}> 
      <div className="navbar-left">
        <Link to="/" className="logo-link">
          <div className="logo">
            <img src="/cafe-finder-frontend-v2/favicon.svg" alt="Nomadic logo" className="logo-icon" />
            <span className="logo-text tryst" style={{ color: 'white' }}>nomadic</span>
          </div>
        </Link>
      </div>
      
      <div className="navbar-center">
        <SearchBar onSearch={onSearch} />
      </div>
      
      <div className="navbar-right">
        <Link to="/bookmarks" className="icon-button saved-button" aria-label="Bookmarked cafes" style={{ color: 'white' }}>
          <img src="/cafe-finder-frontend-v2/icons/bookmark.svg" alt="Bookmarked cafes" className="custom-icon" style={{ filter: 'brightness(0) invert(1)' }} />
        </Link>
        
        {user ? (
          <UserDropdown 
            username={user.username}
            avatarUrl={user.avatar?.url}
            onLogout={handleLogout}
          />
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
