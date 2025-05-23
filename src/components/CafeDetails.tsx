import React, { useState } from 'react';
import type { Cafe } from '../data/cafes';
import '../styles/CafeDetails.css';
import UpvoteButton from './UpvoteButton';

interface CafeDetailsProps {
  cafe: Cafe;
  onClose: () => void;
}

const CafeDetails: React.FC<CafeDetailsProps> = ({ cafe, onClose }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });

  // Upvote functionality is now handled by the UpvoteButton component

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    // This would be connected to an API in a real app
    console.log('New review submitted:', newReview);
    // Reset form and hide it
    setNewReview({ rating: 5, comment: '' });
    setShowReviewForm(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="cafe-details-container">
      <button className="close-button" onClick={onClose}>×</button>
      
      {/* Main Header Section */}
      <header className="cafe-header">
        <h1 className="cafe-title">{cafe.title}</h1>
        <div className="cafe-actions">
          <button className="maps-button" onClick={() => window.open(cafe.location?.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(cafe.title || 'Cafe')}`, '_blank')}>
            <img src="/icons/map-pin.svg" alt="Location" className="button-icon" />
            View on Maps
          </button>
          <UpvoteButton
            cafeId={cafe.id || 0}
            initialUpvotes={cafe.upvotes || 0}
            onUpvoteChange={(_, newUpvoteCount, updatedCafe) => {
              // You could update the cafe state here if needed
              console.log('Cafe upvoted to', newUpvoteCount, updatedCafe);
            }}
          />
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
            src={cafe.gallery && cafe.gallery.length > 0 ? cafe.gallery[activeImageIndex] : (cafe.image || '/images/no-image.svg')} 
            alt={`${cafe.title} - Photo ${activeImageIndex + 1}`} 
            className="gallery-main-image" 
          />
          
          {cafe.gallery && cafe.gallery.length > 1 && (
            <div className="gallery-navigation">
              <button 
                className="gallery-nav-button"
                onClick={() => setActiveImageIndex(prev => (prev === 0 ? (cafe.gallery?.length || 1) - 1 : prev - 1))}
                aria-label="Previous photo"
              >
                &#10094;
              </button>
              <button 
                className="gallery-nav-button"
                onClick={() => setActiveImageIndex(prev => (prev === (cafe.gallery?.length || 1) - 1 ? 0 : prev + 1))}
                aria-label="Next photo"
              >
                &#10095;
              </button>
            </div>
          )}
        </div>
        <div className="gallery-thumbnails">
          {cafe.gallery && cafe.gallery.length > 0 ? cafe.gallery.map((image, index) => (
            <img 
              key={index}
              src={image} 
              alt={`Thumbnail ${index + 1}`}
              className={`gallery-thumbnail ${index === activeImageIndex ? 'active' : ''}`}
              onClick={() => setActiveImageIndex(index)}
            />
          )) : (
            <img src={cafe.image} alt={cafe.title} className="gallery-thumbnail active" />
          )}
        </div>
      </section>

      {/* Amenities Section */}
      <section className="cafe-amenities-section">
        <h2>Amenities</h2>
        <div className="amenities-grid">
          <div className="amenity-item">
            <img src="/icons/wifi.svg" alt="WiFi" className="amenity-icon" />
            <span>{cafe.hasWifi ? 'WiFi Available' : 'No WiFi'}</span>
          </div>
          <div className="amenity-item">
            <img src="/icons/power.svg" alt="Power" className="amenity-icon" />
            <span>{cafe.hasPower ? 'Power Outlets' : 'No Power Outlets'}</span>
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
          <button 
            className="add-review-button"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {showReviewForm ? 'Cancel' : 'Add Review'}
          </button>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form className="review-form" onSubmit={handleSubmitReview}>
            <div className="rating-input">
              <label>Your Rating:</label>
              <div className="stars-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    className={star <= newReview.rating ? 'star filled' : 'star'}
                    onClick={() => setNewReview({...newReview, rating: star})}
                  >
                    ★
                  </span>
                ))}
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
            <button type="submit" className="submit-review-button">Submit Review</button>
          </form>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {cafe.reviews && cafe.reviews.length > 0 ? cafe.reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  {review.userImage ? (
                    <img src={review.userImage} alt={review.userName} className="reviewer-image" />
                  ) : (
                    <div className="reviewer-initial">{review.userName.charAt(0)}</div>
                  )}
                  <div className="reviewer-details">
                    <span className="reviewer-name">{review.userName}</span>
                    <span className="review-date">{review.date}</span>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>
              <p className="review-comment">{review.comment}</p>
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
