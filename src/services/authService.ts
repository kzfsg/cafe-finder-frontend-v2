import axios from 'axios';

// Base URL for Strapi API
// Try with and without the /api suffix depending on your Strapi configuration
const API_URL = 'http://localhost:1337';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interface for user registration data
export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Interface for login data
export interface LoginData {
  identifier: string; // Strapi uses 'identifier' for username/email
  password: string;
}

// Interface for user data returned from API
export interface User {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  avatar?: {
    url: string;
  };
  bookmarkedCafes?: any[];
  [key: string]: any; // For other properties that might be returned
}

// Authentication service methods
const authService = {
  // Register a new user
  register: async (data: RegisterData) => {
    try {
      // Using /api prefix for Strapi v4
      const response = await api.post('/api/auth/local/register', data);
      if (response.data.jwt) {
        localStorage.setItem('jwt', response.data.jwt);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  login: async (data: LoginData) => {
    try {
      // Try with the /api prefix for Strapi v4
      const response = await api.post('/api/auth/local', data);
      if (response.data.jwt) {
        localStorage.setItem('jwt', response.data.jwt);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
  },
  
  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },
  
  // Check if user is logged in
  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('jwt');
  },

  // Get user's profile picture
  getUserAvatar: (user: User): string => {
    // If user has an avatar, return the URL, otherwise return default avatar
    return user?.avatar?.url || '/icons/default-avatar.svg';
  },
  
  // Get the current user with fresh data from the API
  refreshUserData: async (): Promise<User | null> => {
    if (!authService.isLoggedIn()) {
      return null;
    }
    
    try {
      const response = await api.get('/users/me?populate=bookmarkedCafes');
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }
};

export default authService;
