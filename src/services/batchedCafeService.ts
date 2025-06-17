import { supabase } from '../supabase-client';
import { calculateDistance } from '../utils/geolocation';
import type { Cafe } from '../data/cafes';
import { transformCafeData } from './cafeService';
import type { FilterOptions } from '../components/FilterDropdown';

// Extended location interface to match Supabase structure
interface DBCafeLocation {
  latitude: number;
  longitude: number;
  city: string;
  address: string;
  country: string;
  [key: string]: any;
}

// Define interface for database cafe record
interface DBCafe {
  id: number;
  name: string;
  description?: string | Record<string, any> | null;
  location: DBCafeLocation;
  images?: string[] | null;
  wifi?: boolean;
  powerOutletAvailable?: boolean;
  seatingCapacity?: number | null;
  noiseLevel?: string | null;
  priceRange?: string | number | null;
  upvotes?: number;
  downvotes?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Supabase table name
const CAFES_TABLE = 'cafes';

// Default batch size for loading cafes
const DEFAULT_BATCH_SIZE = 9;

// Cache for storing cafe data to avoid redundant fetches
interface CafeCache {
  allCafeIds: number[];
  loadedCafes: Map<number, Cafe>;
  lastFetchTime: number;
  userLocation: { latitude: number; longitude: number } | null;
}

// Initialize cache
const cafeCache: CafeCache = {
  allCafeIds: [],
  loadedCafes: new Map(),
  lastFetchTime: 0,
  userLocation: null
};

// Cache expiration time (15 minutes in milliseconds)
const CACHE_EXPIRATION = 15 * 60 * 1000;

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase error (${context}):`, error.message);
  if (error.details) {
    console.error('Details:', error.details);
  }
  if (error.hint) {
    console.error('Hint:', error.hint);
  }
  return Promise.reject(error);
};

/**
 * Check if the cache is valid
 */
const isCacheValid = (): boolean => {
  const now = Date.now();
  return (
    cafeCache.allCafeIds.length > 0 &&
    now - cafeCache.lastFetchTime < CACHE_EXPIRATION
  );
};

/**
 * Clear the cache
 */
const clearCache = (): void => {
  cafeCache.allCafeIds = [];
  cafeCache.loadedCafes.clear();
  cafeCache.lastFetchTime = 0;
};

/**
 * Get all cafe IDs and their locations for distance calculation
 */
const getAllCafeIdsWithLocation = async (
  userLocation: { latitude: number; longitude: number },
  filters?: FilterOptions
): Promise<{ id: number; distance: number }[]> => {
  try {
    console.log('Fetching all cafe IDs with locations...');
    
    // Start with a base query
    let queryBuilder = supabase
      .from(CAFES_TABLE)
      .select('*');  // Select all fields to support text search and filtering
    
    // Apply filters if provided
    if (filters) {
      // Location filter (text-based)
      if (filters.location && filters.location.trim() !== '' && !filters.nearMe) {
        console.log('Applying location filter by name:', filters.location);
        queryBuilder = queryBuilder.ilike('location->>city', `%${filters.location}%`);
      }
      // WiFi filter
      if (filters.wifi === true) {
        queryBuilder = queryBuilder.eq('wifi', true);
      }
      
      // Power outlet filter
      if (filters.powerOutlet === true) {
        queryBuilder = queryBuilder.eq('powerOutletAvailable', true);
      }
      
      // Seating capacity filter
      if (filters.seatingCapacity && filters.seatingCapacity > 0) {
        queryBuilder = queryBuilder.gte('seatingCapacity', filters.seatingCapacity);
      }
      
      // Noise level filter
      if (filters.noiseLevel) {
        queryBuilder = queryBuilder.eq('noiseLevel', filters.noiseLevel);
      }
      
      // Price range filter
      if (filters.priceRange) {
        const priceValue = parseInt(filters.priceRange);
        if (filters.priceRange === '20') {
          // For $20 and above
          queryBuilder = queryBuilder.gte('priceRange', 20);
        } else {
          // For other price ranges ($5, $10, $15)
          queryBuilder = queryBuilder.lte('priceRange', priceValue);
        }
      }
      
      // Upvotes filter
      if (filters.upvotes && filters.upvotes > 0) {
        queryBuilder = queryBuilder.gte('upvotes', filters.upvotes);
      }
      
      // Downvotes filter (max number of downvotes)
      if (filters.downvotes && filters.downvotes > 0) {
        queryBuilder = queryBuilder.lte('downvotes', filters.downvotes);
      }
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      return handleSupabaseError(error, 'getAllCafeIdsWithLocation');
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Calculate distance for each cafe, filter by radius if specified, and sort by distance
    const cafesWithDistance = data
      .map((cafe: DBCafe) => {
        // Skip cafes without location data
        if (!cafe.location?.latitude || !cafe.location?.longitude) {
          return null;
        }
        
        // Calculate distance between user and cafe
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          cafe.location.latitude,
          cafe.location.longitude
        );
        
        return { id: cafe.id, distance };
      })
      // Filter out null entries (cafes without location data)
      .filter((cafe): cafe is { id: number; distance: number } => cafe !== null)
      // Filter by radius if specified in filters
      .filter(cafe => {
        if (!filters?.nearMe?.radiusKm) return true;
        return cafe.distance <= filters.nearMe.radiusKm;
      })
      .sort((a, b) => a.distance - b.distance);
    
    return cafesWithDistance;
  } catch (error) {
    console.error('Error fetching cafe IDs with locations:', error);
    throw error;
  }
};

/**
 * Get cafe details by IDs
 */
const getCafeDetailsByIds = async (ids: number[]): Promise<Cafe[]> => {
  try {
    if (ids.length === 0) {
      return [];
    }
    
    console.log(`Fetching details for ${ids.length} cafes...`);
    
    const { data, error } = await supabase
      .from(CAFES_TABLE)
      .select('*')
      .in('id', ids);
    
    if (error) {
      return handleSupabaseError(error, 'getCafeDetailsByIds');
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transform each cafe to our application format
    const transformedCafes = await Promise.all(
      data.map((cafe: DBCafe) => transformCafeData(cafe))
    );
    
    return transformedCafes;
  } catch (error) {
    console.error('Error fetching cafe details by IDs:', error);
    throw error;
  }
};

const batchedCafeService = {
  /**
   * Initialize the cafe loading system with user location
   */
  initializeWithLocation: async (
    userLocation: { latitude: number; longitude: number },
    filters?: FilterOptions
  ): Promise<void> => {
    try {
      // Update cache with user location
      cafeCache.userLocation = userLocation;
      
      // Get all cafe IDs sorted by distance
      const cafesWithDistance = await getAllCafeIdsWithLocation(userLocation, filters);
      
      // Store sorted cafe IDs in cache
      cafeCache.allCafeIds = cafesWithDistance.map(cafe => cafe.id);
      cafeCache.lastFetchTime = Date.now();
      
      console.log(`Initialized with ${cafeCache.allCafeIds.length} cafe IDs sorted by distance`);
    } catch (error) {
      console.error('Error initializing batched cafe service:', error);
      throw error;
    }
  },
  
  /**
   * Load the initial batch of cafes
   */
  loadInitialBatch: async (
    userLocation: { latitude: number; longitude: number },
    batchSize = DEFAULT_BATCH_SIZE,
    filters?: FilterOptions
  ): Promise<Cafe[]> => {
    try {
      // Initialize if cache is not valid or user location has changed
      if (
        !isCacheValid() ||
        !cafeCache.userLocation ||
        cafeCache.userLocation.latitude !== userLocation.latitude ||
        cafeCache.userLocation.longitude !== userLocation.longitude
      ) {
        await batchedCafeService.initializeWithLocation(userLocation, filters);
      }
      
      // Get the first batch of cafe IDs
      const firstBatchIds = cafeCache.allCafeIds.slice(0, batchSize);
      
      // Filter out IDs that are already in the cache
      const idsToFetch = firstBatchIds.filter(id => !cafeCache.loadedCafes.has(id));
      
      // Fetch cafe details for IDs not in cache
      if (idsToFetch.length > 0) {
        const newCafes = await getCafeDetailsByIds(idsToFetch);
        
        // Add distances to cafes
        const cafesWithDistance = newCafes.map(cafe => {
          if (cafe.location?.latitude && cafe.location?.longitude && userLocation) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              cafe.location.latitude,
              cafe.location.longitude
            );
            return { ...cafe, distance };
          }
          return cafe;
        });
        
        // Add new cafes to cache
        cafesWithDistance.forEach(cafe => {
          cafeCache.loadedCafes.set(cafe.id, cafe);
        });
      }
      
      // Return cafes from cache in the correct order
      return firstBatchIds
        .map(id => cafeCache.loadedCafes.get(id))
        .filter((cafe): cafe is Cafe => cafe !== undefined);
    } catch (error) {
      console.error('Error loading initial batch of cafes:', error);
      throw error;
    }
  },
  
  /**
   * Load the next batch of cafes
   */
  loadNextBatch: async (
    userLocation: { latitude: number; longitude: number },
    currentCount: number,
    batchSize = DEFAULT_BATCH_SIZE,
    filters?: FilterOptions
  ): Promise<Cafe[]> => {
    try {
      // Initialize if cache is not valid
      if (!isCacheValid()) {
        await batchedCafeService.initializeWithLocation(userLocation, filters);
      }
      
      // Get the next batch of cafe IDs
      const nextBatchIds = cafeCache.allCafeIds.slice(
        currentCount,
        currentCount + batchSize
      );
      
      // If there are no more cafes to load
      if (nextBatchIds.length === 0) {
        return [];
      }
      
      // Filter out IDs that are already in the cache
      const idsToFetch = nextBatchIds.filter(id => !cafeCache.loadedCafes.has(id));
      
      // Fetch cafe details for IDs not in cache
      if (idsToFetch.length > 0) {
        const newCafes = await getCafeDetailsByIds(idsToFetch);
        
        // Add distances to cafes
        const cafesWithDistance = newCafes.map(cafe => {
          if (cafe.location?.latitude && cafe.location?.longitude && userLocation) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              cafe.location.latitude,
              cafe.location.longitude
            );
            return { ...cafe, distance };
          }
          return cafe;
        });
        
        // Add new cafes to cache
        cafesWithDistance.forEach(cafe => {
          cafeCache.loadedCafes.set(cafe.id, cafe);
        });
      }
      
      // Return cafes from cache in the correct order
      return nextBatchIds
        .map(id => cafeCache.loadedCafes.get(id))
        .filter((cafe): cafe is Cafe => cafe !== undefined);
    } catch (error) {
      console.error('Error loading next batch of cafes:', error);
      throw error;
    }
  },
  
  /**
   * Clear the cache to force a refresh
   */
  clearCache
};

export default batchedCafeService;
