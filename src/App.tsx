import { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import MasonryGrid from "./components/MasonryGrid";
import CafeCard from "./components/CafeCard";
import CafeDetails from "./components/CafeDetails";
import Login from "./components/auth/Login";
import SignUp from "./components/auth/SignUp";
import Bookmarks from "./components/Bookmarks";
import { cafes, type Cafe } from "./data/cafes";
import authService from "./services/authService";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const closeTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Check if user is logged in when component mounts
    const loggedIn = authService.isLoggedIn();
    setIsLoggedIn(loggedIn);
  }, []);

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // Search logic here
  };

  const handleCafeClick = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const handleCloseDetails = () => {
    // Start the closing animation
    setIsClosing(true);
    
    // Clear any existing timeout
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    
    // Set a timeout to actually remove the component after animation completes
    closeTimeoutRef.current = window.setTimeout(() => {
      setSelectedCafe(null);
      setIsClosing(false);
      document.body.style.overflow = 'auto'; // Re-enable scrolling
      closeTimeoutRef.current = null;
    }, 250); // Match the animation duration (0.25s = 250ms)
  };

  // Home page component with cafe listings
  const HomePage = () => (
    <>
      <h1 className="tryst">nomadic</h1>
      <p className="nunitoItalic">work-friendly cafes.</p>
      
      <MasonryGrid>
        {cafes.map(cafe => (
          <CafeCard
            key={cafe.id}
            id={cafe.id}
            title={cafe.title}
            image={cafe.image}
            images={cafe.gallery || []}
            description={cafe.description}
            hasWifi={cafe.hasWifi}
            hasPower={cafe.hasPower}
            upvotes={cafe.upvotes}
            onClick={() => handleCafeClick(cafe)}
          />
        ))}
      </MasonryGrid>

      {selectedCafe && (
        <div 
          className="cafe-details-overlay"
          onClick={handleCloseDetails}
        >
          <div 
            className={`cafe-details-wrapper ${isClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CafeDetails cafe={selectedCafe} onClose={handleCloseDetails} />
          </div>
        </div>
      )}
    </>
  );

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <header className="app-header">
            <Navbar onSearch={handleSearch} />
          </header>
          <main className="app-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/bookmarks" element={
                <ProtectedRoute>
                  <Bookmarks />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
