import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BookmarkPage from './pages/BookmarkPage';
import CafeDetails from './components/CafeDetails';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { Cafe } from './data/cafes';
import './App.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

import type { FilterOptions } from './components/FilterDropdown';

// Main App component with providers
function App() {
  const handleSearch = (query: string, filters: FilterOptions = {}) => {
    console.log('Search query in App:', query);
    console.log('Search filters in App:', filters);
    
    // Create URLSearchParams object to handle query parameters
    const params = new URLSearchParams();
    
    // Add search query if it exists
    if (query) {
      params.set('q', query);
    }
    
    // Add filters to the URL parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== '' && value !== false) {
        params.set(key, String(value));
      }
    });
    
    // Update the URL with the search parameters
    window.history.pushState({}, '', `?${params.toString()}`);
    
    // Dispatch a popstate event to trigger a re-render with the new URL
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications position="top-right" />
        <Router>
          <AuthProvider>
            <div className="app">
              <Navbar onSearch={handleSearch} />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route 
                    path="/cafes/:id" 
                    element={
                      <CafeDetails 
                        cafe={null as unknown as Cafe} 
                        onClose={() => window.history.back()} 
                      />
                    } 
                  />
                  <Route 
                    path="/bookmarks" 
                    element={
                      <ProtectedRoute>
                        <BookmarkPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
            </div>
          </AuthProvider>
        </Router>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
