import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authService, { type User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Memoized function to check auth state
  const checkAuth = useCallback(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(!!currentUser);
  }, []);

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    checkAuth();
    
    // Listen for storage events (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jwt' || e.key === 'user') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth]);

  const login = (userData: User) => {
    if (!userData || !userData.id || !userData.email) {
      console.error('Invalid user data provided to login:', userData);
      return;
    }
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.refreshUserData();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // If refresh fails, clear auth state
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
