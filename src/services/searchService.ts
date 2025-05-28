import { supabase } from '../supabase-client';
import type { Cafe } from '../data/cafes';
import { transformCafeData } from './cafeService';

// Supabase table name
const CAFES_TABLE = 'cafes';

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

// Define the FilterOptions type
export interface FilterOptions {
  location?: string;
  wifi?: boolean;
  powerOutlet?: boolean;
  seatingCapacity?: number | null;
  noiseLevel?: string | null;
  priceRange?: string | null;
  upvotes?: number | null;
  downvotes?: number | null;
}

const searchService = {
  // Search cafes by query and filters
  searchCafes: async (query: string, filters?: FilterOptions): Promise<Cafe[]> => {
    try {
      console.log(`Searching cafes for query: ${query}`, filters);
      
      // Start with a base query
      let queryBuilder = supabase
        .from(CAFES_TABLE)
        .select('*');
      
      // Apply text search if query is provided
      if (query && query.trim() !== '') {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
      }
      
      // Apply filters if provided
      if (filters) {
        // Location filter
        if (filters.location && filters.location.trim() !== '') {
          queryBuilder = queryBuilder.ilike('location', `%${filters.location}%`);
        }
        
        // WiFi filter
        if (filters.wifi === true) {
          queryBuilder = queryBuilder.eq('wifi_available', true);
        }
        
        // Power outlet filter
        if (filters.powerOutlet === true) {
          queryBuilder = queryBuilder.eq('power_outlets', true);
        }
        
        // Seating capacity filter
        if (filters.seatingCapacity && filters.seatingCapacity > 0) {
          queryBuilder = queryBuilder.gte('seating_capacity', filters.seatingCapacity);
        }
        
        // Noise level filter
        if (filters.noiseLevel) {
          queryBuilder = queryBuilder.eq('noise_level', filters.noiseLevel);
        }
        
        // Price range filter
        if (filters.priceRange) {
          const priceValue = parseInt(filters.priceRange);
          if (filters.priceRange === '20') {
            // For $20 and above
            queryBuilder = queryBuilder.gte('price_range', 20);
          } else {
            // For other price ranges ($5, $10, $15)
            queryBuilder = queryBuilder.lte('price_range', priceValue);
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
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise<{data: null, error: Error}>((resolve) => {
        setTimeout(() => {
          console.warn('Search query timed out after 10 seconds');
          resolve({
            data: null,
            error: new Error(`Search query timeout for '${query}'`)
          });
        }, 10000); // 10 second timeout
      });
      
      // Race the query against the timeout
      const { data: cafesData, error } = await Promise.race([
        queryBuilder,
        timeoutPromise
      ]);
      
      if (error) {
        console.error(`Search error for query '${query}':`, error);
        return handleSupabaseError(error, `searchCafes-${query}`);
      }
      
      if (!cafesData || cafesData.length === 0) {
        console.log('No matching cafes found for query:', query);
        return [];
      }
      
      // Transform each cafe to our application format
      return await Promise.all(cafesData.map(cafe => transformCafeData(cafe)));
    } catch (error) {
      console.error('Error searching cafes:', error);
      return [];
    }
  },
};

export default searchService;
