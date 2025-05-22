import axios, { AxiosError } from 'axios';
import type { Cafe, Review } from '../data/cafes';

// Base URL for Strapi API
const API_URL = 'http://localhost:1337';

// Log the API URL for debugging
console.log('Using API URL:', API_URL);

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    // Log detailed error information for debugging
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

// Transform Strapi cafe data to our application's Cafe format
// Export this so it can be used by other services
export const transformCafeData = (strapiCafe: any): Cafe => {
  try {
    console.log('Transforming cafe data:', strapiCafe);
    
    // Handle both single item and collection responses
    // First, check if we're dealing with a valid object
    if (!strapiCafe || typeof strapiCafe !== 'object') {
      console.error('Invalid cafe data:', strapiCafe);
      throw new Error('Invalid cafe data');
    }
    
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
    
    console.log('Extracted id:', id, 'and attributes:', attributes);
    
    // Extract photos/gallery images with careful error handling
    let gallery: string[] = [];
    try {
      // Handle different possible structures for photos
      let photos = [];
      
      if (Array.isArray(attributes.Photos)) {
        // Photos might be directly an array
        photos = attributes.Photos;
      } else if (attributes.Photos?.data && Array.isArray(attributes.Photos.data)) {
        // Standard Strapi v4 format with data property
        photos = attributes.Photos.data;
      } else if (attributes.Photos) {
        // Some other structure, try to handle it
        console.log('Unexpected Photos structure:', attributes.Photos);
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
        return photoUrl.startsWith('http') ? photoUrl : `${API_URL}${photoUrl}`;
      }).filter(Boolean); // Remove any null entries
      
      console.log('Processed gallery:', gallery);
    } catch (e) {
      console.warn('Error processing photos:', e);
      gallery = [];
    }
    
    // Get the main image (first photo or placeholder)
    const mainImage = gallery.length > 0 
      ? gallery[0] 
      : 'https://via.placeholder.com/500x300?text=No+Image';
    
    // Extract filter data for amenities with fallbacks
    interface FilterData {
      wifiSpeed?: number | string | null;
      powerOutletAvailable?: boolean;
      seatingCapacity?: string;
      noiseLevel?: string;
      [key: string]: any;
    }
    
    let filter: FilterData = {};
    try {
      if (Array.isArray(attributes.Filter) && attributes.Filter.length > 0) {
        filter = attributes.Filter[0] || {};
      } else if (attributes.Filter && typeof attributes.Filter === 'object') {
        filter = attributes.Filter;
      }
      console.log('Processed filter data:', filter);
    } catch (e) {
      console.warn('Error processing filter data:', e);
      filter = {};
    }
    
    // We're using the imported Review interface

    // Extract reviews with careful error handling
    const reviews: Array<Review> = [];
    try {
      if (attributes.reviews?.data) {
        attributes.reviews.data.forEach((review: any) => {
          if (!review || !review.attributes) return;
          
          let commentText = '';
          try {
            if (Array.isArray(review.attributes.Review)) {
              commentText = review.attributes.Review
                .map((block: any) => {
                  if (!block || !Array.isArray(block.children)) return '';
                  return block.children
                    .map((child: any) => child?.text || '')
                    .join('');
                })
                .join(' ');
            }
          } catch (e) {
            console.warn('Error parsing review text:', e);
          }
          
          // Convert string IDs to numbers for compatibility with Review interface
          const reviewId = typeof review.id === 'string' ? parseInt(review.id, 10) || Math.floor(Math.random() * 10000) : review.id || Math.floor(Math.random() * 10000);
          
          reviews.push({
            id: reviewId,
            userName: review.attributes.Headline || 'Anonymous',
            rating: review.attributes.Rating || 5,
            comment: commentText || 'No comment provided',
            date: review.attributes.Date || new Date().toISOString().split('T')[0]
          });
        });
      }
    } catch (e) {
      console.warn('Error processing reviews:', e);
    }

    // Extract description text with careful error handling
    let description = '';
    try {
      if (Array.isArray(attributes.Description)) {
        description = attributes.Description
          .map((block: any) => {
            if (!block || !Array.isArray(block.children)) return '';
            return block.children
              .map((child: any) => child?.text || '')
              .join('');
          })
          .join(' ');
      }
    } catch (e) {
      console.warn('Error parsing description:', e);
      description = attributes.Name || 'No description available';
    }

    // Construct and return the cafe object with fallbacks for all properties
    const cafeObject = {
      id: id || 0,
      title: attributes.Name || attributes.name || 'Unnamed Cafe',
      image: mainImage,
      description: description || attributes.description || 'No description available',
      hasWifi: Boolean(filter.wifiSpeed) || attributes.hasWifi || false,
      hasPower: Boolean(filter.powerOutletAvailable) || attributes.hasPower || false,
      upvotes: attributes.upvotes || Math.floor(Math.random() * 50) + 5, // Random upvotes for now
      location: {
        address: attributes.Location?.address || attributes.location?.address || 'Address not available',
        googleMapsUrl: attributes.location?.googleMapsUrl || `https://maps.google.com/?q=${attributes.Location?.latitude || 0},${attributes.Location?.longitude || 0}`
      },
      amenities: {
        openingHours: attributes.amenities?.openingHours || 'Not specified',
        seatingCapacity: filter.seatingCapacity || attributes.amenities?.seatingCapacity || 'Not specified',
        noiseLevel: filter.noiseLevel || attributes.amenities?.noiseLevel || 'Not specified'
      },
      gallery: gallery || attributes.gallery || [],
      reviews: reviews || attributes.reviews || []
    };
    
    console.log('Transformed cafe object:', cafeObject);
    return cafeObject;
  } catch (error) {
    console.error('Error transforming cafe data:', error);
    // Return a fallback cafe object if transformation fails
    return {
      id: 0,
      title: 'Error Loading Cafe',
      image: 'https://via.placeholder.com/500x300?text=Error+Loading+Cafe',
      description: 'There was an error loading this cafe. Please try again later.',
      hasWifi: false,
      hasPower: false,
      upvotes: 0,
      location: {
        address: 'Not available',
        googleMapsUrl: ''
      },
      amenities: {
        openingHours: 'Not specified',
        seatingCapacity: 'Not specified',
        noiseLevel: 'Not specified'
      },
      gallery: [],
      reviews: []
    };
  }
};

const cafeService = {
  // Make the transform function available
  transformCafeData,
  
  // Get all cafes
  getAllCafes: async (): Promise<Cafe[]> => {
    try {
      console.log('Fetching all cafes...');
      
      // First try to fetch from the API
      try {
        const response = await api.get('/api/cafes?populate=*');
        console.log('API Response:', response.data);
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          const strapiCafes = response.data.data;
          if (strapiCafes.length > 0) {
            return strapiCafes.map(transformCafeData).filter(Boolean);
          }
        }
        
        console.warn('API returned no valid cafes, falling back to static data');
        throw new Error('No cafes found in API response');
      } catch (apiError) {
        // If API fails, fall back to static data
        console.warn('Falling back to static data due to API error');
        const staticData = require('../data/staticCafes.json');
        return staticData;
      }
    } catch (error: any) {
      console.error('Error in getAllCafes:', error);
      // Last resort fallback - return empty array
      return [];
    }
  },

  // Get cafe by ID
  getCafeById: async (id: number): Promise<Cafe | null> => {
    try {
      console.log(`Fetching cafe with ID ${id}...`);
      const response = await api.get(`/api/cafes/${id}?populate=*`);
      console.log('Cafe details response:', response.data);
      
      if (!response.data || !response.data.data) {
        console.error('Invalid API response structure for cafe details:', response.data);
        return null;
      }
      
      return transformCafeData(response.data.data);
    } catch (error: any) {
      console.error(`Error fetching cafe with ID ${id}:`, error);
      console.error('Error details:', error.response?.data || error.message);
      return null;
    }
  },

  // Search cafes by query
  searchCafes: async (query: string): Promise<Cafe[]> => {
    try {
      // Using Strapi's filter to search by name
      const response = await api.get(`/api/cafes?populate=*&filters[Name][$containsi]=${query}`);
      const strapiCafes = response.data.data;
      return strapiCafes.map(transformCafeData);
    } catch (error) {
      console.error('Error searching cafes:', error);
      return [];
    }
  }
};

export default cafeService;
