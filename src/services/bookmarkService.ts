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
        console.log('Found bookmarkedCafes directly in response.data');
      } else if (response.data?.data?.attributes?.bookmarkedCafes?.data) {
        bookmarkedCafes = response.data.data.attributes.bookmarkedCafes.data;
        console.log('Found bookmarkedCafes in response.data.data.attributes.bookmarkedCafes.data');
      } else {
        console.warn('No bookmarkedCafes found in response');
        console.log('Response structure:', response.data);
        return [];
      }
      
      console.log('Extracted bookmarked cafes:', bookmarkedCafes);
      
      // Transform each cafe to our application format using the imported function
      const transformedCafes = bookmarkedCafes.map((cafe: Cafe) => transformCafeData(cafe));
      console.log(`Transformed ${transformedCafes.length} bookmarked cafes`);
      
      return transformedCafes;
    } catch (error: any) {
      console.error('Error fetching bookmarked cafes:', error);
      console.error('Error details:', error.response?.data || error.message);
      return [];
    }
  },
  
  /**
   * Check if a cafe is bookmarked by the current user
   */
  isBookmarked: async (cafeId: number): Promise<boolean> => {
    if (!authService.isLoggedIn()) {
      return false;
    }
    
    try {
      console.log(`Checking if cafe ${cafeId} is bookmarked...`);
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
      
      // Check if the cafe ID is in the list of bookmarked cafes
      const isBookmarked = bookmarkedCafes.some((cafe: any) => cafe.id === cafeId);
      console.log(`Cafe ${cafeId} is bookmarked: ${isBookmarked}`);
      return isBookmarked;
    } catch (error: any) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  },
  
  /**
   * Toggle bookmark status for a cafe
   */
  toggleBookmark: async (cafeId: number): Promise<BookmarkResponse> => {
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
      const isCurrentlyBookmarked = currentBookmarks.some(cafe => cafe.id === cafeId);
      
      // Determine the action based on current bookmark status
      if (isCurrentlyBookmarked) {
        // Remove bookmark - use the Strapi API endpoint with proper format for Strapi v4
        await api.patch(`/users/${userId}`, {
          data: {
            bookmarkedCafes: {
              disconnect: [{ id: cafeId }]
            }
          }
        });
        console.log(`Removed cafe ${cafeId} from bookmarks`);
        return { bookmarked: false, message: 'Cafe removed from bookmarks' };
      } else {
        // Find the cafe object in currentBookmarks to get the full reference
        const cafe = currentBookmarks.find(c => c.id === cafeId);
        if (!cafe) {
          console.error('Cafe not found in current bookmarks:', cafeId);
          return { bookmarked: false, message: 'Cafe not found' };
        }
        
        // Add bookmark - use the Strapi API endpoint with proper format for Strapi v4
        await api.patch(`/users/${userId}`, {
          data: {
            bookmarkedCafes: {
              connect: [{ id: cafeId }]
            }
          }
        });
        console.log(`Added cafe ${cafeId} to bookmarks, current bookmarks:`, currentBookmarks);
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
