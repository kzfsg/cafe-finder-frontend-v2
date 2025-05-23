import axios, { AxiosError } from 'axios';

// Base URL for Strapi API
const API_URL = 'http://localhost:1337';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies with requests
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
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

// Get the current user's upvoted cafes
export const getUpvotedCafes = async (): Promise<Array<{ documentId: number | string }>> => {
  try {
    const response = await api.get('/api/users/me?populate=upvotedCafes');
    if (response.data?.upvotedCafes) {
      return response.data.upvotedCafes;
    }
    return [];
  } catch (error) {
    console.error('Error fetching upvoted cafes:', error);
    return [];
  }
};

// Check if a cafe is upvoted by the current user
export const isCafeUpvoted = async (cafeId: string | number): Promise<boolean> => {
  const upvotedCafes = await getUpvotedCafes();
  // Handle both string and number IDs by converting to string for comparison
  return upvotedCafes.some(cafe => String(cafe.documentId) === String(cafeId));
};

// Upvote or remove upvote from a cafe
export const upvoteCafe = async (documentId: string): Promise<{ success: boolean; upvoted: boolean; upvotes: number }> => {
  try {
    // Get initial user and cafe state
    const [userResponse, initialCafeResponse] = await Promise.all([
      api.get('/api/users/me'),
      api.get(`/api/cafes/${documentId}`)
    ]);
    
    const userId = userResponse.data?.id;
    const cafeData = initialCafeResponse.data?.data || initialCafeResponse.data;
    
    if (!cafeData) {
      console.error('No cafe data found in response:', initialCafeResponse, documentId);
      throw new Error('Cafe not found');
    }
    
    // Check if the user has already upvoted this cafe
    const upvotedCafes = await getUpvotedCafes();
    const currentlyUpvoted = upvotedCafes.some(cafe => cafe.documentId === documentId);
    
    // Toggle the upvote status
    const newUpvotes = currentlyUpvoted 
      ? (cafeData.attributes?.upvotes || 0) - 1
      : (cafeData.attributes?.upvotes || 0) + 1;
    
    // Update the cafe's upvote count
    const updatedCafeResponse = await api.put(`/api/cafes/${documentId}`, {
      data: {
        upvotes: newUpvotes
      }
    });
    
    // Update the user's upvoted cafes
    if (currentlyUpvoted) {
      await api.put(`/api/users/${userId}`, {
        upvotedCafes: upvotedCafes.filter(cafe => cafe.documentId !== documentId)
      });
    } else {
      await api.put(`/api/users/${userId}`, {
        upvotedCafes: [...upvotedCafes, { documentId }]
      });
    }
    
    console.log('Updated cafe data:', updatedCafeResponse.data);
    
    const updatedCafe = updatedCafeResponse.data?.data || updatedCafeResponse.data;
    const upvotes = updatedCafe?.upvotes || newUpvotes;
    
    return {
      success: true,
      upvoted: !currentlyUpvoted,
      upvotes: upvotes
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
