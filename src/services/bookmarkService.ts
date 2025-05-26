import { supabase } from '../supabase-client';
import authService from './authService';
import type { Cafe } from '../data/cafes';

// Table name for bookmarks in Supabase
const BOOKMARKS_TABLE = 'bookmarks';

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
      // Check if user is logged in
      const session = await authService.getSession();
      if (!session) {
        console.log('User not logged in, returning empty bookmarks');
        return [];
      }
      
      console.log('Fetching bookmarked cafes...');
      
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
      // Check if user is logged in
      const session = await authService.getSession();
      if (!session) {
        return false;
      }
      
      console.log(`Checking if cafe ${cafeId} is bookmarked...`);
      
      // Check if the bookmark exists
      const { data, error, count } = await supabase
        .from(BOOKMARKS_TABLE)
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id)
        .eq('cafe_id', cafeId);
      
      if (error) {
        return handleSupabaseError(error, 'isBookmarked');
      }
      
      const isBookmarked = count ? count > 0 : (data && data.length > 0);
      console.log(`Cafe ${cafeId} is ${isBookmarked ? '' : 'not '}bookmarked`);
      return isBookmarked;
    } catch (error) {
      console.error(`Error checking if cafe ${cafeId} is bookmarked:`, error);
      return false;
    }
  },
  
  /**
   * Toggle bookmark status for a cafe
   */
  toggleBookmark: async (cafeId: number): Promise<BookmarkResponse> => {
    try {
      // Check if user is logged in
      const session = await authService.getSession();
      if (!session) {
        return {
          bookmarked: false,
          message: 'You must be logged in to bookmark cafes'
        };
      }
      
      // First check if the cafe is already bookmarked
      const isCurrentlyBookmarked = await bookmarkService.isBookmarked(cafeId);
      console.log(`Cafe ${cafeId} is currently ${isCurrentlyBookmarked ? '' : 'not '}bookmarked`);
      
      const userId = session.user.id;
      
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        console.log(`Removing bookmark for cafe ${cafeId}...`);
        const { error } = await supabase
          .from(BOOKMARKS_TABLE)
          .delete()
          .eq('user_id', userId)
          .eq('cafe_id', cafeId);
        
        if (error) {
          return handleSupabaseError(error, 'toggleBookmark-remove');
        }
        
        return {
          bookmarked: false,
          message: 'Cafe removed from bookmarks'
        };
      } else {
        // Add bookmark
        console.log(`Adding bookmark for cafe ${cafeId}...`);
        const { error } = await supabase
          .from(BOOKMARKS_TABLE)
          .insert({
            user_id: userId,
            cafe_id: cafeId,
            created_at: new Date().toISOString()
          });
        
        if (error) {
          return handleSupabaseError(error, 'toggleBookmark-add');
        }
        
        return {
          bookmarked: true,
          message: 'Cafe added to bookmarks'
        };
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
