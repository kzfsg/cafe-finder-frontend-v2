import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FiUser, FiBookmark, FiLogOut, FiChevronDown } from 'react-icons/fi';
import '../styles/UserDropdown.css';

interface UserDropdownProps {
  username: string;
  avatarUrl?: string;
  onLogout: () => void;
}

interface DropdownItemProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  to?: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Animation variants
const wrapperVariants = {
  open: {
    opacity: 1,
    scaleY: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  closed: {
    opacity: 0,
    scaleY: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.1,
    },
  },
};

const iconVariants = {
  open: { rotate: 180 },
  closed: { rotate: 0 },
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
    },
  },
  closed: {
    opacity: 0,
    y: -15,
    transition: {
      when: "afterChildren",
    },
  },
};

const actionIconVariants = {
  open: { scale: 1, y: 0 },
  closed: { scale: 0, y: -7 },
};

// Dropdown item component
const DropdownItem = ({ icon, text, onClick, to, setOpen }: DropdownItemProps) => {
  const handleClick = () => {
    setOpen(false);
    if (onClick) onClick();
  };
  
  // Determine if this is a logout item to apply special styling
  const isLogout = text.toLowerCase() === 'log out';
  const itemClass = `dropdown-item ${isLogout ? 'logout' : ''}`;
  
  const content = (
    <motion.li
      variants={itemVariants}
      onClick={handleClick}
      className={itemClass}
    >
      <motion.span variants={actionIconVariants} className="dropdown-icon">
        {icon}
      </motion.span>
      <span>{text}</span>
    </motion.li>
  );
  
  return to ? <Link to={to} className={itemClass}>{content}</Link> : content;
};

export default function UserDropdown({ username, avatarUrl, onLogout }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="dropdown-container">
      <motion.button
        animate={open ? "open" : "closed"}
        onClick={() => setOpen(prev => !prev)}
        className="profile-button"
        aria-label="User profile"
      >
        <img 
          src={avatarUrl || "/icons/default-avatar.svg"} 
          alt={username} 
          className="profile-image"
        />
        <motion.span variants={iconVariants} className="dropdown-icon">
          <FiChevronDown />
        </motion.span>
      </motion.button>
      
      <motion.ul
        initial={"closed"}
        animate={open ? "open" : "closed"}
        variants={wrapperVariants}
        style={{ originY: "top" }}
        className="dropdown-menu"
      >
        <motion.div variants={itemVariants} className="dropdown-header">
          <span className="greeting-text">Hi, {username}</span>
        </motion.div>
        
        <DropdownItem 
          icon={<FiUser />} 
          text="Profile" 
          to="/profile" 
          setOpen={setOpen} 
        />
        
        <DropdownItem 
          icon={<FiBookmark />} 
          text="Saved Cafes" 
          to="/saved" 
          setOpen={setOpen} 
        />
        
        <DropdownItem 
          icon={<FiLogOut />} 
          text="Log Out" 
          onClick={onLogout} 
          setOpen={setOpen} 
        />
      </motion.ul>
    </div>
  );
}
