import { Avatar, Text } from '@mantine/core';
import type { User } from '../../context/AuthContext';
import '../../styles/ProfileComponents.css';

interface ProfileHeaderProps {
  user: User | null;
  reviewCount: number;
}

export default function ProfileHeader({ user, reviewCount }: ProfileHeaderProps) {
  return (
    <div className="bento-card profile-card">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <Avatar
            src={user?.avatar || '/cafe-finder-frontend-v2/images/default-avatar.svg'}
            className="profile-avatar"
            alt={user?.name || 'User'}
          />
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{user?.name || 'User'}</h2>
          <Text color="dimmed" className="profile-occupation">UX Designer</Text>
          
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{reviewCount}</span>
              <span className="stat-label">Reviews Written</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">8</span>
              <span className="stat-label">Cafes Discovered</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="xp-container">
        <div className="xp-label">
          <span>Level 7: Cafe Aficionado</span>
          <span>75%</span>
        </div>
        <div className="xp-bar-container">
          <div className="xp-bar-progress" style={{ width: '75%' }}></div>
        </div>
      </div>
    </div>
  );
}
