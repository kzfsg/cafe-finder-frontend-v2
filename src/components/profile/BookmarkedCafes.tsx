import { Button, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import CafeCard from '../CafeCard';
import { type Cafe } from '../../data/cafes.ts';
import '../../styles/ProfileComponents.css';

interface BookmarkedCafesProps {
  bookmarkedCafes: Cafe[];
}

export default function BookmarkedCafes({ bookmarkedCafes }: BookmarkedCafesProps) {
  return (
    <div className="bento-card bookmarked-cafes">
      <h3 className="card-title">My Bookmarked Cafes</h3>
      
      {bookmarkedCafes.length > 0 ? (
        <div className="mini-masonry">
          {bookmarkedCafes.slice(0, 3).map((cafe) => (
            <div key={cafe.id} className="mini-cafe-card">
              <CafeCard
                id={cafe.id}
                title={cafe.name}
                image={cafe.imageUrls?.[0]}
                images={cafe.imageUrls}
                wifi={cafe.wifi}
                powerOutletAvailable={cafe.powerOutletAvailable}
              />
            </div>
          ))}
          
          {bookmarkedCafes.length > 3 && (
            <Button
              component={Link}
              to="/bookmarks"
              variant="light"
              color="orange"
              fullWidth
              mt="md"
            >
              View All ({bookmarkedCafes.length})
            </Button>
          )}
        </div>
      ) : (
        <Text color="dimmed" ta='center' mt="xl">
          You haven't bookmarked any cafes yet.
        </Text>
      )}
    </div>
  );
}
