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
      console.group('🔍 searchService.searchCafes');
      console.log('Search parameters:', { query, filters });
      
      // Start with a base query
      let queryBuilder = supabase
        .from(CAFES_TABLE)
        .select('*');
      
      console.log('Initial query builder created');
      
      // Apply text search if query is provided
      if (query && query.trim() !== '') {
        const searchPattern = `%${query}%`;
        console.log(`Applying text search for query: ${query}`, { searchPattern });
        queryBuilder = queryBuilder.or(`name.ilike.${searchPattern},description.ilike.${searchPattern},location.ilike.${searchPattern}`);
      } else {
        console.log('No text search query provided');
      }
      
      // Apply filters if provided
      console.log('Applying filters:', filters);
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
      
      // Log the final query builder state
      console.log('Final query builder:', queryBuilder);
      
      // Create a timeout promise to prevent hanging
      console.log('Creating query with 10s timeout');
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
      console.log('Executing query...');
      const { data: cafesData, error } = await Promise.race([
        queryBuilder,
        timeoutPromise
      ]);
      
      console.log('Query completed', { hasData: !!cafesData, error });
      
      if (error) {
        console.error(`❌ Search error for query '${query}':`, error);
        console.groupEnd();
        return handleSupabaseError(error, `searchCafes-${query}`);
      }
      
      if (!cafesData || cafesData.length === 0) {
        console.log(`🔍 No matching cafes found for query: ${query}`);
        console.groupEnd();
        return [];
      }
      
      console.log(`✅ Found ${cafesData.length} cafes matching search criteria`);
      
      // Transform each cafe to our application format
      console.log('Transforming cafe data...');
      const transformedCafes = await Promise.all(cafesData.map(cafe => transformCafeData(cafe)));
      
      console.log('✅ Search completed successfully');
      console.groupEnd();
      return transformedCafes;
    } catch (error) {
      console.error('❌ Error in searchCafes:', error);
      console.groupEnd();
      return [];
    }
  },
};

export default searchService;
