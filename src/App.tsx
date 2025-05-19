import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import MasonryGrid from "./components/MasonryGrid";
import CafeCard from "./components/CafeCard";
import { cafes } from "./data/cafes";

function App() {
  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // Search logic here
  };

  // Cafe data is now imported from './data/cafes'

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
            <CafeCard
              key={cafe.id}
              title={cafe.title}
              image={cafe.image}
              description={cafe.description}
              hasWifi={cafe.hasWifi}
              hasPower={cafe.hasPower}
              upvotes={cafe.upvotes}
            />
          ))}
        </MasonryGrid>
      </main>
    </div>
  );
}

export default App;
