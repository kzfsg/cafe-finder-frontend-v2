import axios from 'axios';
import authService from './authService';
import type { Cafe } from '../data/cafes';

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

// Simple interface for bookmark response
interface BookmarkResponse {
  bookmarked: boolean;
  message: string;
}

/**
 * Helper function to ensure image URLs are complete by adding the API_URL prefix when needed
 */
const ensureFullImageUrl = (url: string): string => {
  if (!url) return '/images/no-image.svg';
  
  // If the URL already starts with http:// or https://, return it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Make sure URL starts with a slash for consistency
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  
  // Append to API_URL exactly like cafeService does
  return `${API_URL}${normalizedUrl}`;
};

/**
 * Transform Strapi cafe data to our application's Cafe format
 * This follows the same approach as cafeService.transformCafeData
 */
const transformCafeData = (strapiCafe: any): Cafe => {
  try {
    console.log('Transforming cafe data:', strapiCafe);
    
    // Extract id and attributes, handling different possible structures
    let id, attributes;
    
    if (strapiCafe.id !== undefined && strapiCafe.attributes) {
      // Standard Strapi v4 format
      id = strapiCafe.id;
      attributes = strapiCafe.attributes;
    } else if (strapiCafe.id !== undefined && !strapiCafe.attributes) {
      // Data might be flattened
      id = strapiCafe.id;
      attributes = strapiCafe;
    } else {
      console.error('Could not extract id and attributes from:', strapiCafe);
      throw new Error('Invalid cafe data structure');
    }
    
    // Extract photos/gallery images
    let gallery: string[] = [];
    let mainImage = '/images/no-image.svg';
    
    try {
      // Handle different possible structures for photos
      let photos = [];
      
      if (Array.isArray(attributes.Photos)) {
        photos = attributes.Photos;
      } else if (attributes.Photos?.data && Array.isArray(attributes.Photos.data)) {
        photos = attributes.Photos.data;
      } else if (attributes.photos && Array.isArray(attributes.photos)) {
        photos = attributes.photos;
      } else if (attributes.Photos) {
        photos = [attributes.Photos];
      }
      
      // Process each photo to get the URL
      gallery = photos.map((photo: any) => {
        if (!photo) return null;
        
        // Try different paths to find the URL
        let photoUrl = null;
        if (photo.attributes?.url) {
          photoUrl = photo.attributes.url;
        } else if (photo.url) {
          photoUrl = photo.url;
        } else if (typeof photo === 'string') {
          photoUrl = photo;
        }
        
        if (!photoUrl) return null;
        
        // Handle both absolute and relative URLs
        return ensureFullImageUrl(photoUrl);
      }).filter(Boolean); // Remove any null entries
      
      // Get the main image (first photo or placeholder)
      mainImage = gallery.length > 0 ? gallery[0] : '/images/no-image.svg';
      console.log('Processed gallery images:', gallery);
      console.log('Main image:', mainImage);
    } catch (e) {
      console.warn('Error processing photos:', e);
    }
    
    // Process description
    let description = '';
    try {
      const descData = attributes.Description || attributes.description;
      if (typeof descData === 'string') {
        description = descData;
      } else if (descData && typeof descData === 'object') {
        // Handle rich text format
        description = 'Description available in cafe details';
      } else {
        description = 'No description available';
      }
    } catch (e) {
      description = 'Error loading description';
    }
    
    // Return a properly formatted cafe object
    return {
      id: id,
      title: attributes.Name || attributes.name || 'Unnamed Cafe',
      description: description,
      image: mainImage,
      gallery: gallery,
      hasWifi: Boolean(attributes.HasWifi || attributes.hasWifi || false),
      hasPower: Boolean(attributes.HasPower || attributes.hasPower || false),
      upvotes: Number(attributes.Upvotes || attributes.upvotes || 0),
      location: {
        address: attributes.Location?.address || attributes.location?.address || 'Address not available',
        googleMapsUrl: `https://maps.google.com/?q=${attributes.Location?.latitude || attributes.location?.latitude || 0},${attributes.Location?.longitude || attributes.location?.longitude || 0}`
      },
      amenities: {
        openingHours: 'Not specified',
        seatingCapacity: 'Not specified',
        noiseLevel: 'Not specified'
      },
      reviews: []
    };
  } catch (error) {
    console.error('Error transforming cafe data:', error);
    return {
      id: strapiCafe.id || 0,
      title: 'Error Loading Cafe',
      description: 'There was an error loading this cafe',
      image: '/images/no-image.svg',
      gallery: [],
      hasWifi: false,
      hasPower: false,
      upvotes: 0,
      location: {
        address: 'Unknown',
        googleMapsUrl: 'https://maps.google.com'
      },
      amenities: {
        openingHours: 'Not specified',
        seatingCapacity: 'Not specified',
        noiseLevel: 'Not specified'
      },
      reviews: []
    };
  }
};

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
      console.log('Fetching bookmarked cafes...');
      
      // Get user with populated bookmarked cafes
      const response = await api.get('/users/me?populate=bookmarkedCafes');
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
      
      // Transform each cafe to our application format
      const transformedCafes = bookmarkedCafes.map(transformCafeData);
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
        await api.put(`/users/${userId}`, {
          data: {
            bookmarkedCafes: {
              disconnect: [{ id: cafeId }]
            }
          }
        });
        console.log(`Removed cafe ${cafeId} from bookmarks`);
        return { bookmarked: false, message: 'Cafe removed from bookmarks' };
      } else {
        // Add bookmark - use the Strapi API endpoint with proper format for Strapi v4
        await api.put(`/users/${userId}`, {
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
