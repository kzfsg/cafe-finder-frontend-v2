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
      const session = await authService.getSession();
      if (!session) {
        return [];
      }
      
      // Get the user's bookmarks with joined cafe data
      const { data: bookmarks, error } = await supabase
        .from(BOOKMARKS_TABLE)
        .select(`
          cafe_id,
          cafes (*)
        `)
        .eq('user_id', session.user.id);
      
      if (error) {
        return handleSupabaseError(error, 'getBookmarkedCafes');
      }
      
      if (!bookmarks || bookmarks.length === 0) {
        console.log('No bookmarked cafes found');
        return [];
      }
      
      console.log('Found bookmarked cafes:', bookmarks.length);
      
      // Transform each cafe to our application format
      return bookmarks.map(bookmark => {
        // Type the cafe object properly to avoid TypeScript errors
        const cafe: Record<string, any> = bookmark.cafes || {};
        if (Object.keys(cafe).length === 0) return null;
        
        try {
          // Format the cafe data to match our application's Cafe type
          return {
            id: Number(cafe.id) || 0,
            Name: String(cafe.name || 'Unknown Cafe'),
            title: String(cafe.name || 'Unknown Cafe'),
            Description: [{ type: 'paragraph', children: [{ text: String(cafe.description || '') }] }],
            description: String(cafe.description || ''),
            image: ensureFullImageUrl(cafe.image),
            Location: {
              address: String(cafe.address || ''),
              city: String(cafe.city || ''),
              country: String(cafe.country || '')
            },
            hasWifi: Boolean(cafe.wifi),
            hasPower: Boolean(cafe.power),
            createdAt: String(cafe.created_at || new Date().toISOString()),
            updatedAt: String(cafe.updated_at || new Date().toISOString())
          } as Cafe;
        } catch (err) {
          console.error('Error transforming cafe data:', err);
          return null;
        }
      }).filter(Boolean) as Cafe[];
    } catch (error: any) {
      console.error('Error fetching bookmarked cafes:', error);
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
      
      // Check if user profile exists in profiles table
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();
      
      if (profileError || !userProfile) {
        console.error('User profile not found:', session.user.id, profileError);
        return { bookmarked: false, message: 'User profile not found. Please complete your profile first.' };
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
