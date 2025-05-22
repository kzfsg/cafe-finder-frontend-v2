import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import CafeCard from "./components/CafeCard";
import MasonryGrid from "./components/MasonryGrid";
import CafeDetails from "./components/CafeDetails";
import Login from "./components/auth/Login";
import SignUp from "./components/auth/SignUp";
import Bookmarks from "./components/Bookmarks";
import type { Cafe } from "./data/cafes";
import { AuthProvider, useAuth } from "./context/AuthContext";
import cafeService from "./services/cafeService";
import "./App.css";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchCafes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch cafes - cafeService will handle fallback to static data if API fails
        console.log('Fetching cafes...');
        const data = await cafeService.getAllCafes();
        
        if (data && data.length > 0) {
          console.log('Successfully fetched cafes:', data.length);
          setCafes(data);
        } else {
          setError('No cafes found. Please try again later.');
        }
      } catch (err: any) {
        console.error('Error in fetch operation:', err);
        setError('Failed to load cafes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCafes();
  }, []);

  useEffect(() => {
    const searchCafes = async () => {
      if (!searchQuery) {
        // If search query is empty, fetch all cafes
        const data = await cafeService.getAllCafes();
        setCafes(data);
        return;
      }
      
      try {
        setLoading(true);
        const results = await cafeService.searchCafes(searchQuery);
        setCafes(results);
      } catch (err) {
        console.error('Error searching cafes:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce search to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      searchCafes();
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
    }, 300); // Match the animation duration
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Home page component with cafe listings
  const HomePage = () => (
    <>
      <div className="search-container">
        <h1 className="main-title">
          <img src="/favicon.svg" alt="Nomadic logo" className="title-icon" />
          <span className="title-text tryst">nomadic</span>
        </h1>
        <p className="subtitle">Find the perfect cafe for your remote work day</p>
      </div>
      
      {loading && cafes.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading cafes...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button 
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                // Retry fetching cafes
                const data = await cafeService.getAllCafes();
                if (data && data.length > 0) {
                  setCafes(data);
                } else {
                  setError('No cafes found. Please try again later.');
                }
              } catch (err) {
                setError('Failed to load cafes. Please try again later.');
              } finally {
                setLoading(false);
              }
            }} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      ) : cafes.length === 0 ? (
        <div className="empty-state">
          <p>No cafes found. Try adjusting your search.</p>
        </div>
      ) : (
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
      )}

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
