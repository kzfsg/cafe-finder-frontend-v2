import { supabase } from '../supabase-client';
import { calculateDistance } from '../utils/geolocation';
import type { Cafe } from '../data/cafes';
import { transformCafeData } from './cafeService';
import type { FilterOptions } from '../components/FilterDropdown';

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

// Using FilterOptions from the FilterDropdown component
// This includes the nearMe property for location-based search

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
        // Location filter (text-based)
        if (filters.location && filters.location.trim() !== '' && !filters.nearMe) {
          console.log('Applying location filter by name:', filters.location);
          queryBuilder = queryBuilder.ilike('location->>city', `%${filters.location}%`);
        }
        
        // Note: nearMe filtering will be applied after fetching results
        
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
      let transformedCafes = await Promise.all(cafesData.map((cafe: any) => transformCafeData(cafe)));
      
      // Apply location-based filtering if nearMe is specified
      if (filters?.nearMe) {
        const { latitude, longitude, radiusKm } = filters.nearMe;
        console.group('📍 Location-Based Filtering');
        console.log(`🔍 Filtering cafes within ${radiusKm}km of (${latitude}, ${longitude})`);
        
        // Log user's current location
        console.log('📍 Current location:', { latitude, longitude });
        
        transformedCafes = transformedCafes.filter((cafe: Cafe) => {
          // Skip cafes without location data
          if (!cafe.location?.latitude || !cafe.location?.longitude) {
            console.log(`❌ Skipping cafe "${cafe.name}" - missing location data`);
            return false;
          }
          
          // Log cafe's location
          console.log(`🏪 Cafe: ${cafe.name}`);
          console.log(`   Location: (${cafe.location.latitude}, ${cafe.location.longitude})`);
          
          // Calculate distance between user and cafe
          const distance = calculateDistance(
            latitude,
            longitude,
            cafe.location.latitude,
            cafe.location.longitude
          );
          
          const isWithinRadius = distance <= radiusKm;
          
          // Log detailed distance information
          console.log(`   Distance: ${distance.toFixed(2)}km`);
          console.log(`   Within ${radiusKm}km radius: ${isWithinRadius ? '✅ Yes' : '❌ No'}`);
          
          return isWithinRadius;
        });
        
        console.log(`\n📊 Results:`);
        console.log(`   Total cafes: ${transformedCafes.length} within ${radiusKm}km`);
        console.groupEnd();
      }
      
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
