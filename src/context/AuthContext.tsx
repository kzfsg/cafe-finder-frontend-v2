import React, { createContext, useState, useEffect, useContext } from 'react';
import authService, { type User } from '../services/authService';

export type { User };
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<{user: User | null, message?: string}>;
  updateProfile: (updates: Partial<User>) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth state on component mount
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Get current session
        const currentSession = await authService.getSession();
        setSession(currentSession);
        setIsAuthenticated(!!currentSession);
        
        // Get user data if we have a session
        if (currentSession) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Subscribe to auth changes - avoid deadlock by using setTimeout
    const { data: { subscription } } = authService.onAuthStateChange(
      (_event, newSession) => {
        // Update session state synchronously
        setSession(newSession);
        setIsAuthenticated(!!newSession);
        
        // Use setTimeout to break the chain and avoid deadlock
        setTimeout(async () => {
          if (newSession) {
            try {
              // Session exists, get user data
              const userData = await authService.getCurrentUser();
              setUser(userData);
            } catch (error) {
              console.error('Error fetching user data after auth change:', error);
              setUser(null);
            }
          } else {
            // No session, clear user data
            setUser(null);
          }
        }, 0);
      }
    );
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const { user: userData } = await authService.login({ identifier: email, password });
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    try {
      const result = await authService.register({ username, email, password });
      return { 
        user: result.user,
        message: result.message
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (updates: Partial<User>): Promise<User | null> => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      if (updatedUser) {
        setUser(updatedUser);
      }
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      isAuthenticated, 
      loading,
      login, 
      logout, 
      register,
      updateProfile
    }}>
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
