import { FiSettings, FiUsers, FiAward } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import '../../styles/ProfileComponents.css';

interface ActionCardProps {
  type: 'settings' | 'community' | 'achievements';
}

export default function ActionCard({ type }: ActionCardProps) {
  const cardConfig = {
    settings: {
      icon: <FiSettings className="action-icon" />,
      label: 'Settings',
      to: '/settings',
      className: 'settings-card'
    },
    community: {
      icon: <FiUsers className="action-icon" />,
      label: 'Community',
      to: '/community',
      className: 'community-card'
    },
    achievements: {
      icon: <FiAward className="action-icon" />,
      label: 'Achievements',
      to: '/achievements',
      className: 'achievements-card'
    }
  };

  const { icon, label, to, className } = cardConfig[type];

  return (
    <Link to={to} className={`bento-card action-card ${className}`}>
      {icon}
      <span className="action-label">{label}</span>
    </Link>
  );
}
