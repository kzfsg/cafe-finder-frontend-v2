import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import MasonryGrid from "./components/MasonryGrid";
import CafeCard from "./components/CafeCard";
import CafeDetails from "./components/CafeDetails";
import { cafes, type Cafe } from "./data/cafes";

function App() {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // Search logic here
  };

  const handleCafeClick = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const handleCloseDetails = () => {
    setSelectedCafe(null);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <Navbar onSearch={handleSearch} />
      </header>
      <main className="app-content">
        <h1 className="tryst">nomadic</h1>
        <p className="nunitoItalic">work-friendly cafes.</p>
        
        <MasonryGrid>
          {cafes.map(cafe => (
            <div key={cafe.id} onClick={() => handleCafeClick(cafe)} style={{ cursor: 'pointer' }}>
              <CafeCard
                title={cafe.title}
                image={cafe.image}
                description={cafe.description}
                hasWifi={cafe.hasWifi}
                hasPower={cafe.hasPower}
                upvotes={cafe.upvotes}
              />
            </div>
          ))}
        </MasonryGrid>

        {selectedCafe && (
          <div 
            className="cafe-details-overlay"
            onClick={handleCloseDetails}
          >
            <div 
              className="cafe-details-wrapper" 
              onClick={(e) => e.stopPropagation()}
            >
              <CafeDetails cafe={selectedCafe} onClose={handleCloseDetails} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
