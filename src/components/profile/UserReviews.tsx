import { Button, Text } from '@mantine/core';
import { type Review } from '../../services/reviewService';
import '../../styles/ProfileComponents.css';

interface ExtendedReview extends Review {
  cafe_name: string;
  cafe_image?: string;
}

interface UserReviewsProps {
  userReviews: ExtendedReview[];
}

export default function UserReviews({ userReviews }: UserReviewsProps) {
  // Format date for review display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bento-card reviews-card">
      <h3 className="card-title">My Recent Reviews</h3>
      
      {userReviews.length > 0 ? (
        <div className="reviews-list">
          {userReviews.slice(0, 3).map((review, index) => (
            <div key={index} className="review-item">
              <div className="review-cafe">{review.cafe_name}</div>
              <div className="review-content">{review.comment}</div>
              <div className="review-rating">
                {review.rating ? '👍' : '👎'}
              </div>
              {review.cafe_image && (
                <img 
                  src={review.cafe_image} 
                  alt={review.cafe_name} 
                  className="review-cafe-image"
                  style={{ width: '100%', borderRadius: '8px', marginTop: '8px' }}
                />
              )}
              <div className="review-date">{formatDate(review.created_at)}</div>
            </div>
          ))}
          
          {userReviews.length > 3 && (
            <Button
              variant="subtle"
              color="gray"
              fullWidth
              mt="md"
            >
              View All Reviews
            </Button>
          )}
        </div>
      ) : (
        <Text color="dimmed" ta="center" mt="xl">
          You haven't written any reviews yet.
        </Text>
      )}
    </div>
  );
}
