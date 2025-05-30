import React, { useState, useEffect } from 'react';
import type { Cafe, Review } from '../data/cafes';
import '../styles/CafeDetails.css';
import UpvoteButton from './UpvoteButton';
import DownvoteButton from './DownvoteButton';
import reviewService, { type ReviewSubmission } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface CafeDetailsProps {
  cafe: Cafe;
  onClose: () => void;
  onVoteUpdate?: (updatedCafe: Cafe) => void;
}

const CafeDetails: React.FC<CafeDetailsProps> = ({ cafe, onClose, onVoteUpdate }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: true, // true for positive, false for negative
    comment: ''
  });
  const [cafeReviews, setCafeReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const { user } = useAuth();

  // Upvote functionality is now handled by the UpvoteButton component

  // Fetch cafe reviews on component mount
  useEffect(() => {
    const fetchReviews = async () => {
      const reviews = await reviewService.getCafeReviews(cafe.id);
      setCafeReviews(reviews);
      
      // Check if the current user has already reviewed this cafe
      if (user) {
        const existingReview = await reviewService.hasUserReviewedCafe(cafe.id, user.id);
        if (existingReview) {
          setUserReview(existingReview);
          setNewReview({
            rating: existingReview.rating,
            comment: existingReview.comment
          });
        }
      }
    };
    
    fetchReviews();
  }, [cafe.id, user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to leave a review');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reviewData: ReviewSubmission = {
        cafe_id: cafe.id,
        rating: newReview.rating,
        comment: newReview.comment
      };
      
      const result = await reviewService.addReview(reviewData, user);
      
      if (result) {
        // Update the reviews list
        if (userReview) {
          // Update existing review in the list
          setCafeReviews(prev => 
            prev.map(review => review.id === result.id ? result : review)
          );
        } else {
          // Add new review to the list
          setCafeReviews(prev => [result, ...prev]);
        }
        
        // Update user review reference
        setUserReview(result);
        
        // Reset form and hide it
        setNewReview({ rating: true, comment: '' });
        setShowReviewForm(false);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRating = (isPositive: boolean) => {
    return (
      <div className="rating">
        <span className={`rating-icon ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '👍' : '👎'}
        </span>
      </div>
    );
  };

  return (
    <div className="cafe-details-container">
      <button className="close-button" onClick={onClose}>×</button>
      
      {/* Main Header Section */}
      <header className="cafe-header">
        <h1 className="cafe-title">{cafe.title || cafe.name || 'Unnamed Cafe'}</h1>
        <div className="cafe-actions">
          <button className="maps-button" onClick={() => window.open(`https://maps.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cafe.location?.address || ''}, ${cafe.location?.city || ''}, ${cafe.location?.country || ''}`)}`, '_blank')}>
            <img src="/icons/map-pin.svg" alt="Location" className="button-icon" />
            View on Maps
          </button>
          <div className="vote-buttons">
            <UpvoteButton
              cafeId={cafe.id}
              upvotes={cafe.upvotes || 0}
              onUpvote={(_, newUpvoteCount, updatedCafe) => {
                // Update the cafe state if callback is provided
                if (onVoteUpdate && updatedCafe) {
                  // Just pass the updated cafe with the new vote count
                  onVoteUpdate({
                    ...updatedCafe,
                    id: cafe.id,  // Ensure ID is included
                    upvotes: newUpvoteCount  // Ensure upvote count is updated
                  });
                  console.log('Cafe upvoted to', newUpvoteCount);
                  
                  // Force refresh of the component by updating the upvotes in the local cafe object
                  cafe.upvotes = newUpvoteCount;
                }
              }}
            />
            <DownvoteButton
              cafeId={cafe.id}
              downvotes={cafe.downvotes || 0}
              onDownvote={(_, newDownvoteCount, updatedCafe) => {
                // Update the cafe state if callback is provided
                if (onVoteUpdate && updatedCafe) {
                  // Just pass the updated cafe with the new vote count
                  onVoteUpdate({
                    ...updatedCafe,
                    id: cafe.id,  // Ensure ID is included
                    downvotes: newDownvoteCount  // Ensure downvote count is updated
                  });
                  console.log('Cafe downvoted to', newDownvoteCount);
                  
                  // Force refresh of the component by updating the downvotes in the local cafe object
                  cafe.downvotes = newDownvoteCount;
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Description Section */}
      <section className="cafe-description-section">
        <p>{cafe.description}</p>
      </section>

      {/* Gallery Section */}
      <section className="cafe-gallery-section">
        <h2>Gallery</h2>
        <div className="gallery-main">
          <img 
            src={cafe.imageUrls && cafe.imageUrls.length > 0 ? cafe.imageUrls[activeImageIndex] : (cafe.image || '/images/no-image.svg')} 
            alt={`${cafe.title || cafe.name || 'Cafe'} - Photo ${activeImageIndex + 1}`} 
            className="gallery-main-image" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/no-image.svg';
            }}
          />
          
          {cafe.imageUrls && cafe.imageUrls.length > 1 && (
            <div className="gallery-navigation">
              <button 
                className="gallery-nav-button"
                onClick={() => setActiveImageIndex(prev => (prev === 0 ? (cafe.imageUrls?.length || 1) - 1 : prev - 1))}
                aria-label="Previous photo"
              >
                &#10094;
              </button>
              <button 
                className="gallery-nav-button"
                onClick={() => setActiveImageIndex(prev => (prev === (cafe.imageUrls?.length || 1) - 1 ? 0 : prev + 1))}
                aria-label="Next photo"
              >
                &#10095;
              </button>
            </div>
          )}
        </div>
        <div className="gallery-thumbnails">
          {cafe.imageUrls && cafe.imageUrls.length > 0 ? cafe.imageUrls.map((image, index) => (
            <img 
              key={index}
              src={image} 
              alt={`${cafe.title || cafe.name || 'Cafe'} - Thumbnail ${index + 1}`}
              className={`gallery-thumbnail ${index === activeImageIndex ? 'active' : ''}`}
              onClick={() => setActiveImageIndex(index)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/no-image.svg';
              }}
            />
          )) : (
            <div className="no-images">No images available</div>
          )}
        </div>
      </section>

      {/* Amenities Section */}
      <section className="cafe-amenities-section">
        <h2>Amenities</h2>
        <div className="amenities-grid">
          <div className="amenity-item">
            <img src="/icons/wifi.svg" alt="WiFi" className="amenity-icon" />
            <span>{cafe.wifi ? 'WiFi Available' : 'No WiFi'}</span>
          </div>
          <div className="amenity-item">
            <img src="/icons/power.svg" alt="Power" className="amenity-icon" />
            <span>{cafe.powerOutletAvailable ? 'Power Outlets' : 'No Power Outlets'}</span>
          </div>
          <div className="amenity-item">
            <img src="/icons/clock.svg" alt="Hours" className="amenity-icon" />
            <span>{cafe.amenities?.openingHours || 'Hours not available'}</span>
          </div>
          <div className="amenity-item">
            <img src="/icons/users.svg" alt="Capacity" className="amenity-icon" />
            <span>{cafe.amenities?.seatingCapacity || 'Capacity not available'}</span>
          </div>
          <div className="amenity-item">
            <img src="/icons/volume.svg" alt="Noise" className="amenity-icon" />
            <span>Noise Level: {cafe.amenities?.noiseLevel || 'Not specified'}</span>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="cafe-reviews-section">
        <div className="reviews-header">
          <h2>Reviews</h2>
          {user ? (
            <button 
              className="add-review-button"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              {userReview ? 'Edit Your Review' : 'Add Review'}
            </button>
          ) : (
            <p className="login-prompt">Please log in to leave a review</p>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && user && (
          <form className="review-form" onSubmit={handleSubmitReview}>
            <div className="rating-input">
              <label>Your Rating:</label>
              <div className="rating-buttons">
                <button 
                  type="button"
                  className={`rating-button ${newReview.rating ? 'active' : ''}`}
                  onClick={() => setNewReview({...newReview, rating: true})}
                >
                  👍 Positive
                </button>
                <button 
                  type="button"
                  className={`rating-button ${!newReview.rating ? 'active' : ''}`}
                  onClick={() => setNewReview({...newReview, rating: false})}
                >
                  👎 Negative
                </button>
              </div>
            </div>
            <div className="comment-input">
              <label htmlFor="review-comment">Your Review:</label>
              <textarea 
                id="review-comment"
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                placeholder="Share your experience at this cafe..."
                required
              />
            </div>
            <button 
              type="submit" 
              className="submit-review-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {cafeReviews.length > 0 ? cafeReviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  {review.user?.avatar_url ? (
                    <img src={review.user.avatar_url} alt={review.user.username} className="reviewer-image" />
                  ) : (
                    <div className="reviewer-initial">{review.user?.username.charAt(0) || '?'}</div>
                  )}
                  <div className="reviewer-details">
                    <span className="reviewer-name">{review.user?.username || 'Anonymous'}</span>
                    <span className="review-date">{formatDistanceToNow(new Date(review.created_at))} ago</span>
                  </div>
                </div>
                {renderRating(review.rating)}
              </div>
              <p className="review-comment">{review.comment}</p>
              {user && review.user_id === user.id && (
                <div className="review-actions">
                  <button 
                    className="edit-review-button"
                    onClick={() => {
                      setNewReview({
                        rating: review.rating,
                        comment: review.comment
                      });
                      setShowReviewForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-review-button"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete your review?')) {
                        const success = await reviewService.deleteReview(review.id, user.id);
                        if (success) {
                          setCafeReviews(prev => prev.filter(r => r.id !== review.id));
                          setUserReview(null);
                        }
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )) : (
            <p className="no-reviews">No reviews yet. Be the first to leave a review!</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default CafeDetails;
