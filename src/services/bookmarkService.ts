import { supabase } from '../supabase-client';
import authService from './authService';
import type { Cafe } from '../data/cafes';

// Table name for bookmarks in Supabase
const BOOKMARKS_TABLE = 'bookmarks';

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
  console.error(`Error (${context}):`, error.message);
  return Promise.reject(error);
};

interface BookmarkResponse {
  bookmarked: boolean;
  message: string;
}

// Ensure image URLs are properly formatted
const ensureFullImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '/images/placeholder.svg';
  
  // If it's already a full URL or a local path starting with '/'
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // Otherwise, assume it's a relative path and add the base URL
  return `/images/${imageUrl}`;
};

const bookmarkService = {
  /**
   * Get all bookmarked cafes for the current user
   */
  getBookmarkedCafes: async (): Promise<Cafe[]> => {
    try {
      console.log('Getting bookmarked cafes for current user');
      const session = await authService.getSession();
      if (!session) {
        console.log('No session found, user not logged in');
        return [];
      }
      
      console.log(`Fetching bookmarks for user ${session.user.id}`);
      
      // First check if the bookmarks table exists by querying it
      const { data: tableCheck, error: tableError } = await supabase
        .from(BOOKMARKS_TABLE)
        .select('id')
        .limit(1);
        
      if (tableError) {
        console.error('Error accessing bookmarks table:', tableError);
        console.log('This may indicate the bookmarks table does not exist or has incorrect permissions');
        return [];
      }
      
      // Get the user's bookmarks with joined cafe data
      const { data: bookmarks, error } = await supabase
        .from(BOOKMARKS_TABLE)
        .select(`
          cafe_id,
          cafes:cafe_id (*)
        `)
        .eq('user_id', session.user.id);
      
      if (error) {
        console.error('Error fetching bookmarked cafes:', error);
        return [];
      }
      
      if (!bookmarks || bookmarks.length === 0) {
        console.log('No bookmarked cafes found');
        return [];
      }
      
      console.log(`Found ${bookmarks.length} bookmarked cafes`);
      
      // Transform each cafe to our application format
      const cafes = bookmarks
        .filter(bookmark => bookmark.cafes)
        .map(bookmark => {
          // Type the cafe object properly to avoid TypeScript errors
          const cafe: Record<string, any> = bookmark.cafes || {};
          if (!cafe || Object.keys(cafe).length === 0) {
            console.log(`Skipping bookmark with cafe_id ${bookmark.cafe_id} - no cafe data found`);
            return null;
          }
          
          console.log(`Processing bookmarked cafe: ${cafe.name || 'Unknown'} (ID: ${cafe.id || 'Unknown'})`);

        
        try {
          // Format the cafe data to match our application's Cafe type
          // Ensure all required fields have fallback values to prevent errors
          const transformedCafe: Cafe = {
            id: Number(cafe.id) || 0,
            created_at: cafe.created_at || new Date().toISOString(),
            name: String(cafe.name || 'Unknown Cafe'),
            description: String(cafe.description || 'No description available'),
            location: {
              city: String(cafe.location?.city || cafe.city || 'Unknown'),
              address: String(cafe.location?.address || cafe.address || 'Unknown'),
              country: String(cafe.location?.country || cafe.country || 'Unknown'),
              latitude: Number(cafe.location?.latitude || cafe.latitude || 0),
              longitude: Number(cafe.location?.longitude || cafe.longitude || 0)
            },
            wifi: Boolean(cafe.wifi),
            powerOutletAvailable: Boolean(cafe.power_outlet_available || cafe.powerOutletAvailable),
            upvotes: Number(cafe.upvotes || 0),
            downvotes: Number(cafe.downvotes || 0),
            imageUrls: Array.isArray(cafe.imageUrls) && cafe.imageUrls.length > 0 
              ? cafe.imageUrls.map((url) => ensureFullImageUrl(url))
              : cafe.image 
                ? [ensureFullImageUrl(cafe.image)] 
                : ['/images/no-image.svg'],
            // Add backward compatibility fields
            Name: String(cafe.name || 'Unknown Cafe'),
            title: String(cafe.name || 'Unknown Cafe'),
            image: cafe.image ? ensureFullImageUrl(cafe.image) : '/images/no-image.svg',
            Description: [{ type: 'paragraph', children: [{ text: String(cafe.description || '') }] }],
            hasWifi: Boolean(cafe.wifi),
            hasPower: Boolean(cafe.power_outlet_available || cafe.powerOutletAvailable),
            Location: {
              city: String(cafe.location?.city || cafe.city || 'Unknown'),
              address: String(cafe.location?.address || cafe.address || 'Unknown'),
              country: String(cafe.location?.country || cafe.country || 'Unknown'),
              latitude: Number(cafe.location?.latitude || cafe.latitude || 0),
              longitude: Number(cafe.location?.longitude || cafe.longitude || 0)
            }
          };
          
          return transformedCafe;
        } catch (error) {
          console.error(`Error transforming cafe data for ID ${cafe.id}:`, error);
          // Return a minimal valid cafe object with required fields
          return {
            id: Number(cafe.id) || 0,
            created_at: new Date().toISOString(),
            name: 'Error Loading Cafe',
            description: 'There was an error loading this cafe\'s details',
            location: { city: 'Unknown', address: 'Unknown', country: 'Unknown', latitude: 0, longitude: 0 },
            wifi: false,
            powerOutletAvailable: false,
            upvotes: 0,
            downvotes: 0,
            imageUrls: ['/images/no-image.svg'],
            // Add backward compatibility fields
            Name: 'Error Loading Cafe',
            title: 'Error Loading Cafe',
            image: '/images/no-image.svg',
            Description: [{ type: 'paragraph', children: [{ text: 'There was an error loading this cafe\'s details' }] }],
            hasWifi: false,
            hasPower: false,
            Location: { city: 'Unknown', address: 'Unknown', country: 'Unknown', latitude: 0, longitude: 0 }
          };
        }
      }).filter(Boolean) as Cafe[];
    } catch (error) {
      console.error('Error in getBookmarkedCafes:', error);
      return [];
    }
  },
  
  /**
   * Check if a cafe is bookmarked by the current user
   */
  isBookmarked: async (cafeId: number): Promise<boolean> => {
    try {
      console.log(`Checking if cafe ${cafeId} is bookmarked`);
      const session = await authService.getSession();
      if (!session) {
        console.log('No session found, user not logged in');
        return false;
      }
      
      // Ensure cafeId is a number
      const numericCafeId = Number(cafeId);
      if (isNaN(numericCafeId)) {
        console.error('Invalid cafeId:', cafeId);
        return false;
      }
      
      console.log(`Querying bookmarks for user ${session.user.id} and cafe ${numericCafeId}`);
      
      // Use maybeSingle instead of single to avoid errors when no rows are found
      const { data, error } = await supabase
        .from(BOOKMARKS_TABLE)
        .select('id')
        .eq('user_id', session.user.id)
        .eq('cafe_id', numericCafeId)
        .maybeSingle();
        
      if (error) {
        console.error('Error checking bookmark status:', error);
        return false;
      }
      
      const isBookmarked = !!data;
      console.log(`Cafe ${cafeId} bookmark status:`, isBookmarked);
      return isBookmarked;
    } catch (error) {
      console.error('Error in isBookmarked:', error);
      return false;
    }
  },
  
  /**
   * Toggle bookmark status for a cafe
   */
  toggleBookmark: async (cafeId: number): Promise<BookmarkResponse> => {
    try {
      console.log(`Toggling bookmark for cafe ${cafeId}`);
      const session = await authService.getSession();
      if (!session) {
        console.log('No session found, user not logged in');
        return { bookmarked: false, message: 'User not authenticated' };
      }
      
      // Ensure cafeId is a number
      const numericCafeId = Number(cafeId);
      if (isNaN(numericCafeId)) {
        console.error('Invalid cafeId:', cafeId);
        return { bookmarked: false, message: 'Invalid cafe ID' };
      }
      
      console.log(`Checking if cafe ${numericCafeId} is already bookmarked by user ${session.user.id}`);
      
      // First check if the bookmark already exists
      const { data: existingBookmark, error: checkError } = await supabase
        .from(BOOKMARKS_TABLE)
        .select('id')
        .eq('user_id', session.user.id)
        .eq('cafe_id', numericCafeId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking bookmark status:', checkError);
        return { bookmarked: false, message: 'Failed to check bookmark status' };
      }
      
      if (existingBookmark) {
        console.log(`Removing bookmark for cafe ${numericCafeId}`);
        // Bookmark exists, so remove it
        const { error: deleteError } = await supabase
          .from(BOOKMARKS_TABLE)
          .delete()
          .eq('user_id', session.user.id)
          .eq('cafe_id', numericCafeId);
          
        if (deleteError) {
          console.error('Error removing bookmark:', deleteError);
          return { bookmarked: true, message: 'Failed to remove bookmark' };
        }
        
        console.log(`Successfully removed bookmark for cafe ${numericCafeId}`);
        return { bookmarked: false, message: 'Bookmark removed' };
      } else {
        console.log(`Adding bookmark for cafe ${numericCafeId}`);
        // Bookmark doesn't exist, so add it
        const { error: insertError } = await supabase
          .from(BOOKMARKS_TABLE)
          .insert({
            user_id: session.user.id,
            cafe_id: numericCafeId,
            created_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error('Error adding bookmark:', insertError);
          return { bookmarked: false, message: `Failed to add bookmark: ${insertError.message}` };
        }
        
        console.log(`Successfully added bookmark for cafe ${numericCafeId}`);
        return { bookmarked: true, message: 'Bookmark added' };
      }
    } catch (error: any) {
      console.error(`Error toggling bookmark for cafe ${cafeId}:`, error);
      
      // Return current state to avoid UI inconsistency
      const currentState = await bookmarkService.isBookmarked(cafeId);
      return {
        bookmarked: currentState,
        message: `Error: ${error.message || 'Unknown error'}`
      };
    }
  }
};

export default bookmarkService;
