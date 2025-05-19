interface CafeCardProps {
  title: string;
  image: string;
  description: string;
  hasWifi?: boolean;
  hasPower?: boolean;
  upvotes?: number;
}

export default function CafeCard({ title, image, description, hasWifi = false, hasPower = false, upvotes = 0 }: CafeCardProps) {
  return (
    <div className="cafe-card">
      <img src={image} alt={title} className="cafe-image" />
      <div className="cafe-content">
        <div className="cafe-header">
          <h3 className="cafe-title">{title}</h3>
          <div className="cafe-meta">
            <div className="cafe-amenities">
              {hasWifi && (
                <div className="amenity wifi" title="WiFi Available">
                  <img src="/icons/wifi.svg" alt="WiFi" />
                </div>
              )}
              {hasPower && (
                <div className="amenity power" title="Power Outlets Available">
                  <img src="/icons/power.svg" alt="Power Outlets" />
                </div>
              )}
            </div>
            <div className="upvotes-container" title="Upvotes">
              <img src="/icons/upvote.svg" alt="Upvote" className="upvote-icon" />
              <span className="upvotes-count">{upvotes}</span>
            </div>
          </div>
        </div>
        <p className="cafe-description">{description}</p>
      </div>
    </div>
  );
}
