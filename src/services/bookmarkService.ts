import axios from 'axios';
import authService from './authService';
import type { Cafe } from '../data/cafes';

// Base URL for Strapi API
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

interface BookmarkResponse {
  bookmarked: boolean;
  message: string;
}

const bookmarkService = {
  // Get all bookmarked cafes for the current user
  getBookmarkedCafes: async (): Promise<Cafe[]> => {
    // Make sure user is logged in
    if (!authService.isLoggedIn()) {
      return [];
    }
    
    try {
      // Get user with populated bookmarkedCafes
      const response = await api.get(`/users/me?populate=bookmarkedCafes`);
      return response.data.bookmarkedCafes || [];
    } catch (error) {
      console.error('Error fetching bookmarked cafes:', error);
      return [];
    }
  },
  
  // Check if a cafe is bookmarked by the current user
  isBookmarked: async (cafeId: number): Promise<boolean> => {
    try {
      const bookmarkedCafes = await bookmarkService.getBookmarkedCafes();
      return bookmarkedCafes.some((cafe: Cafe) => cafe.id === cafeId);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  },
  
  // Toggle bookmark status for a cafe
  toggleBookmark: async (cafeId: number): Promise<BookmarkResponse> => {
    if (!authService.isLoggedIn()) {
      throw new Error('You must be logged in to bookmark cafes');
    }
    
    try {
      const isCurrentlyBookmarked = await bookmarkService.isBookmarked(cafeId);
      
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        await api.delete(`/cafes/${cafeId}/bookmark`);
        return { bookmarked: false, message: 'Cafe removed from bookmarks' };
      } else {
        // Add bookmark
        await api.post(`/cafes/${cafeId}/bookmark`);
        return { bookmarked: true, message: 'Cafe added to bookmarks' };
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  }
};

export default bookmarkService;
