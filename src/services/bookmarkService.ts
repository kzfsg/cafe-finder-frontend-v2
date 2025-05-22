import axios from 'axios';
import authService from './authService';
import cafeService from './cafeService';
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
      console.log('Fetching bookmarked cafes...');
      
      // Get user with populated bookmarkedCafes
      const response = await api.get(`/users/me?populate=bookmarkedCafes.Photos`);
      console.log('Bookmarked cafes response:', response.data);
      
      // Check if we have bookmarkedCafes in the response
      if (!response.data || !response.data.bookmarkedCafes) {
        console.warn('No bookmarkedCafes found in response');
        return [];
      }
      
      // Handle different possible response structures
      let bookmarkedCafesData = [];
      
      if (Array.isArray(response.data.bookmarkedCafes)) {
        // Direct array of cafes
        bookmarkedCafesData = response.data.bookmarkedCafes;
      } else if (response.data.bookmarkedCafes.data && Array.isArray(response.data.bookmarkedCafes.data)) {
        // Strapi v4 format with data property
        bookmarkedCafesData = response.data.bookmarkedCafes.data;
      }
      
      console.log('Extracted bookmarked cafes data:', bookmarkedCafesData);
      
      // If we have cafe IDs but not full objects, fetch the complete cafe data
      if (bookmarkedCafesData.length > 0 && typeof bookmarkedCafesData[0] === 'number') {
        console.log('Found cafe IDs, fetching complete cafe data...');
        const cafePromises = bookmarkedCafesData.map((cafeId: number) => 
          cafeService.getCafeById(cafeId)
        );
        const cafes = await Promise.all(cafePromises);
        return cafes.filter(Boolean) as Cafe[];
      }
      
      // Transform the cafe data if needed
      if (bookmarkedCafesData.length > 0 && typeof bookmarkedCafesData[0] === 'object') {
        // Check if we need to transform the data
        if (bookmarkedCafesData[0].attributes || !bookmarkedCafesData[0].title) {
          // Use the cafeService's transform function to convert to our app's format
          return bookmarkedCafesData.map((cafe: any) => {
            // If it's already in the right format, return as is
            if (cafe.title && cafe.image) return cafe;
            
            // Otherwise use the transformation function from cafeService
            return cafeService.transformCafeData(cafe);
          }).filter(Boolean);
        }
      }
      
      return bookmarkedCafesData || [];
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
