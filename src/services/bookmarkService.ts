import axios from 'axios';
import authService from './authService';
import type { Cafe } from '../data/cafes';
import { transformCafeData } from './cafeService';

// Base URL for Strapi API - exactly matching cafeService
const API_URL = 'http://localhost:1337';
const API_ENDPOINT = `${API_URL}/api`;

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_ENDPOINT,
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

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  (error) => {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    return Promise.reject(error);
  }
);

interface BookmarkResponse {
  bookmarked: boolean;
  message: string;
}

const bookmarkService = {
  /**
   * Get all bookmarked cafes for the current user
   */
  getBookmarkedCafes: async (): Promise<Cafe[]> => {
    // Make sure user is logged in
    if (!authService.isLoggedIn()) {
      console.log('User not logged in, returning empty bookmarks');
      return [];
    }
    
    try {
      console.log('Fetching bookmarked cafes with deep population...');
      
      // Get user with fully populated bookmarked cafes
      const response = await api.get('/users/me?populate[bookmarkedCafes][populate]=*');
      console.log('Bookmarked cafes response received');
      
      // Extract bookmarked cafes from response
      let bookmarkedCafes = [];
      
      // Handle different possible response structures
      if (response.data?.bookmarkedCafes) {
        bookmarkedCafes = response.data.bookmarkedCafes;
      } else if (response.data?.data?.attributes?.bookmarkedCafes?.data) {
        bookmarkedCafes = response.data.data.attributes.bookmarkedCafes.data;
      } else {
        console.warn('No bookmarked cafes found in the response');
        return [];
      }
      
      // Transform each cafe to our application format and ensure documentId is included
      return bookmarkedCafes.map((cafe: any) => {
        const transformedCafe = transformCafeData(cafe);
        // Ensure documentId is preserved if it exists in the original data
        if (cafe.documentId) {
          transformedCafe.documentId = cafe.documentId;
        } else if (cafe.attributes?.documentId) {
          transformedCafe.documentId = cafe.attributes.documentId;
        }
        return transformedCafe;
      });
    } catch (error: any) {
      console.error('Error fetching bookmarked cafes:', error);
      console.error('Error details:', error.response?.data || error.message);
      return [];
    }
  },
  
  /**
   * Check if a cafe is bookmarked by the current user
   */
  isBookmarked: async (documentId: string): Promise<boolean> => {
    if (!authService.isLoggedIn()) {
      return false;
    }
    
    try {
      console.log(`Checking if cafe ${documentId} is bookmarked...`);
      // Get user with bookmarked cafes
      const response = await api.get('/users/me?populate=bookmarkedCafes');
      
      // Extract bookmarked cafes from response
      let bookmarkedCafes = [];
      
      // Handle different possible response structures
      if (response.data?.bookmarkedCafes) {
        bookmarkedCafes = response.data.bookmarkedCafes;
      } else if (response.data?.data?.attributes?.bookmarkedCafes?.data) {
        bookmarkedCafes = response.data.data.attributes.bookmarkedCafes.data;
      } else {
        return false;
      }
      
      // Check if the cafe documentId is in the list of bookmarked cafes
      const isBookmarked = bookmarkedCafes.some((cafe: any) => cafe.documentId === documentId);
      console.log(`Cafe ${documentId} is bookmarked: ${isBookmarked}`);
      return isBookmarked;
    } catch (error: any) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  },
  
  /**
   * Toggle bookmark status for a cafe
   */
  toggleBookmark: async (documentId: string): Promise<BookmarkResponse> => {
    if (!authService.isLoggedIn()) {
      return { bookmarked: false, message: 'You must be logged in to bookmark cafes' };
    }

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        return { bookmarked: false, message: 'User ID not found' };
      }
      const userId = currentUser.id;
      
      // First, get the current user's bookmarked cafes
      const currentBookmarks = await bookmarkService.getBookmarkedCafes();
      const isCurrentlyBookmarked = currentBookmarks.some(cafe => cafe.documentId === documentId);
      
      // Determine the action based on current bookmark status
      if (isCurrentlyBookmarked) {
        // Remove bookmark - use the Strapi API endpoint with proper format for Strapi v4
        await api.patch(`/users/${userId}`, {
          data: {
            bookmarkedCafes: {
              disconnect: [{ documentId }]
            }
          }
        });
        console.log(`Removed cafe ${documentId} from bookmarks`);
        return { bookmarked: false, message: 'Cafe removed from bookmarks' };
      } else {
        // Find the cafe object in currentBookmarks to get the full reference
        const cafe = currentBookmarks.find(c => c.documentId === documentId);
        if (!cafe) {
          console.error('Cafe not found in current bookmarks:', documentId);
          return { bookmarked: false, message: 'Cafe not found' };
        }
        
        // Add bookmark - use the Strapi API endpoint with proper format for Strapi v4
        await api.patch(`/users/${userId}`, {
          data: {
            bookmarkedCafes: {
              connect: [{ documentId }]
            }
          }
        });
        console.log(`Added cafe ${documentId} to bookmarks, current bookmarks:`, currentBookmarks);
        return { bookmarked: true, message: 'Cafe added to bookmarks' };
      }
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      console.error('Error details:', error.response?.data || error.message);
      return { bookmarked: false, message: 'Error updating bookmarks' };
    }
  }
};

export default bookmarkService;
