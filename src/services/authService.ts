import axios from 'axios';

// Base URL for Strapi API - update this to match your Strapi backend URL
const API_URL = 'http://localhost:1337/api';

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
}

// Authentication service methods
const authService = {
  // Register a new user
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/local/register', data);
    if (response.data.jwt) {
      localStorage.setItem('jwt', response.data.jwt);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  // Login user
  login: async (data: LoginData) => {
    const response = await api.post('/auth/local', data);
    if (response.data.jwt) {
      localStorage.setItem('jwt', response.data.jwt);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
  },
  
  // Get current user profile
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
  
  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('jwt');
  },

  // Get user's profile picture
  getUserAvatar: (user: User) => {
    // If user has an avatar, return the URL, otherwise return default avatar
    // Note: Adjust this based on your Strapi media structure
    return user.avatar?.url || '/icons/default-avatar.svg';
  }
};

export default authService;
