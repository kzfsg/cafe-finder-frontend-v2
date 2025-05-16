interface CafeCardProps {
  title: string;
  image: string;
  description: string;
}

export default function CafeCard({ title, image, description }: CafeCardProps) {
  return (
    <div className="cafe-card">
      <img src={image} alt={title} className="cafe-image" />
      <div className="cafe-content">
        <h3 className="cafe-title">{title}</h3>
        <p className="cafe-description">{description}</p>
      </div>
    </div>
  );
}
