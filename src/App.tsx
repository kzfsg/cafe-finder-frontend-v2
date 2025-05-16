import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";

function App() {
  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // Search logic here
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <Navbar onSearch={handleSearch} />
      </header>
      <main className="app-content">
        <h1 className="tryst">nomadic</h1>
        <p className="nunitoItalic">cafes</p>
      </main>
    </div>
  );
}

export default App;
