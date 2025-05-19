// No need to import React with modern JSX transform
import SearchBar from './SearchBar';
import ProfileAvatar from './ProfileAvatar';
import './../App.css';

interface NavbarProps {
  onSearch: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  return (
    <nav className="navbar"> 
      <div className="navbar-left">
        <div className="logo">
          <span className="logo-text tryst">nomadic</span>
        </div>
      </div>
      
      <div className="navbar-center">
        <SearchBar onSearch={onSearch} />
      </div>
      
      <div className="navbar-right">
        <button className="icon-button saved-button" aria-label="Saved cafes">
          <img src="/icons/bookmark.svg" alt="Saved cafes" className="custom-icon" />
        </button>
        
        <button className="icon-button profile-button" aria-label="User profile">
          <img src="/icons/default-avatar.svg" alt="User profile" />
        </button>
      </div>
    </nav>
  );
}
