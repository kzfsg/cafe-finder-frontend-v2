import axios from 'axios';
import type { Cafe } from '../data/cafes';

// Base URL for Strapi API
const API_URL = 'http://localhost:1337';
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

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Get the current user's upvoted cafes as full cafe objects
const getUpvotedCafes = async (): Promise<Cafe[]> => {
  try {
    const response = await api.get('/api/users/me?populate=upvotedCafes');
    if (response.data && response.data.upvotedCafes && Array.isArray(response.data.upvotedCafes)) {
      // Return the full cafe objects directly from the API response
      return response.data.upvotedCafes;
    }
    return [];
  } catch (error) {
    console.error('Error fetching upvoted cafes:', error);
    return [];
  }
};

// Check if a cafe is upvoted by the current user
const isCafeUpvoted = async (cafeId: number): Promise<boolean> => {
  const upvotedCafes = await getUpvotedCafes();
  return upvotedCafes.some(cafe => cafe.id === cafeId);
};

// Upvote or remove upvote from a cafe
const upvoteCafe = async (cafeId: number): Promise<{ success: boolean; upvoted: boolean; upvotes: number; cafe: Cafe }> => {
  try {
    // Get initial user and cafe state
    const [userResponse, initialCafeResponse] = await Promise.all([
      api.get('/api/users/me'),
      api.get(`/api/cafes?filters[id][$eq]=${cafeId}&populate=*`)
    ]);
    
    const userId = userResponse.data?.id;
    // Handle both array and direct object responses
    const cafeData = Array.isArray(initialCafeResponse.data?.data) 
      ? initialCafeResponse.data.data[0] 
      : initialCafeResponse.data?.data || initialCafeResponse.data;
    
    if (!cafeData) {
      console.error('No cafe data found in response:', initialCafeResponse, cafeId);
      throw new Error('Cafe data not found in response');
    }
    
    const documentId = cafeData.documentId;
    const currentUpvotes = cafeData.upvotes || 0;
    
    if (!documentId) {
      console.error('Document ID not found in cafe data:', cafeData);
      throw new Error('Document ID not found for cafe');
    }
    
    console.log('Initial user data:', userResponse.data);
    console.log('Initial cafe data:', cafeData);
    
    // Toggle upvote
    const currentlyUpvoted = await isCafeUpvoted(cafeId);
    const newUpvotes = currentlyUpvoted ? Math.max(0, currentUpvotes - 1) : currentUpvotes + 1;
    
    // Update user's upvoted cafes
    const userEndpoint = `/api/users/${userId}`;
    const userData = {
      data: {
        upvotedCafes: currentlyUpvoted ? 
          { disconnect: [cafeId] } : 
          { connect: [cafeId] }
      }
    };
    
    // Update cafe's upvote count using documentId
    console.log(`Updating cafe ${documentId} with upvotes:`, newUpvotes);
    await api.put(`/api/cafes/${documentId}`, { 
      data: {
      upvotes: newUpvotes
    }
    });
    
    // Update user's upvoted cafes
    const toggleResponse = await api.put(userEndpoint, userData);
    console.log('Upvote toggle response:', toggleResponse.status, toggleResponse.data);
    
    // Get updated cafe state
    const updatedCafeResponse = await api.get(`/api/cafes/${documentId}`);
    console.log('Updated cafe data:', updatedCafeResponse.data);
    
    const updatedCafe = updatedCafeResponse.data;
    const upvotes = updatedCafe?.upvotes || newUpvotes; // Use newUpvotes as fallback
    
    // Get the full updated cafe object
    const updatedCafeObject = updatedCafe?.data || updatedCafe;
    
    return {
      success: true,
      upvoted: !currentlyUpvoted,
      upvotes: upvotes,
      cafe: updatedCafeObject
    };
    
  } catch (error: any) {
    console.error('Error in upvoteCafe:', {
      message: error?.message || 'Unknown error',
      response: error?.response?.data,
      status: error?.response?.status
    });
    throw error;
  }
};

const upvoteService = {
  getUpvotedCafes,
  isCafeUpvoted,
  upvoteCafe
};

export default upvoteService;
