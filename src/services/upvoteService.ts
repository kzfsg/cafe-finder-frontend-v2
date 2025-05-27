import { supabase } from '../supabase-client';
import authService from './authService';
import type { Cafe } from '../data/cafes';

// Table names for Supabase
const CAFES_TABLE = 'cafes';
const USER_UPVOTES_TABLE = 'user_upvotes';

// Helper function to handle errors
const handleError = (error: any, context: string) => {
  console.error(`Error (${context}):`, error.message);
  return Promise.reject(error);
};

// Get the current user's upvoted cafes as full cafe objects
const getUpvotedCafes = async (): Promise<Cafe[]> => {
  try {
    const session = await authService.getSession();
    if (!session) return [];
    
    const { data: upvotes, error } = await supabase
      .from(USER_UPVOTES_TABLE)
      .select('cafe_id')
      .eq('user_id', session.user.id);
    
    if (error) return handleError(error, 'getUpvotedCafes');
    if (!upvotes?.length) return [];
    
    const cafeIds = upvotes.map(upvote => upvote.cafe_id);
    
    const { data: cafes, error: cafesError } = await supabase
      .from(CAFES_TABLE)
      .select('*')
      .in('id', cafeIds);
    
    if (cafesError) return handleError(cafesError, 'getUpvotedCafes-cafes');
    
    return cafes || [];
  } catch (error) {
    console.error('Error in getUpvotedCafes:', error);
    return [];
  }
};

// Check if a cafe is upvoted by the current user
const isCafeUpvoted = async (cafeId: number): Promise<boolean> => {
  try {
    const session = await authService.getSession();
    if (!session) return false;
    
    const { data, error } = await supabase
      .from(USER_UPVOTES_TABLE)
      .select('*')
      .eq('user_id', session.user.id)
      .eq('cafe_id', cafeId)
      .single();
    
    if (error && error.code !== 'PGRST116') return false;
    
    return !!data;
  } catch (error) {
    console.error('Error in isCafeUpvoted:', error);
    return false;
  }
};

// Upvote a cafe
const upvoteCafe = async (cafeId: number): Promise<{ success: boolean; upvoted: boolean; upvotes: number; cafe: Cafe | null }> => {
  try {
    const session = await authService.getSession();
    if (!session) {
      return { success: false, upvoted: false, upvotes: 0, cafe: null };
    }
    
    const isAlreadyUpvoted = await isCafeUpvoted(cafeId);
    const userId = session.user.id;
    
    if (isAlreadyUpvoted) {
      // Remove upvote
      const { error: removeError } = await supabase
        .from(USER_UPVOTES_TABLE)
        .delete()
        .eq('user_id', userId)
        .eq('cafe_id', cafeId);
      
      if (removeError) {
        return { success: false, upvoted: true, upvotes: 0, cafe: null };
      }
      
      const { data: cafeData, error: updateError } = await supabase.rpc('decrement_upvotes', {
        cafe_id: cafeId
      });
      
      if (updateError) {
        return { success: false, upvoted: true, upvotes: 0, cafe: null };
      }
      
      return { 
        success: true, 
        upvoted: false, 
        upvotes: cafeData?.upvotes || 0, 
        cafe: cafeData || null 
      };
    } else {
      // Add upvote
      const { error: insertError } = await supabase
        .from(USER_UPVOTES_TABLE)
        .insert([
          { 
            user_id: userId, 
            cafe_id: cafeId,
            created_at: new Date().toISOString()
          }
        ]);
      
      if (insertError) {
        return { success: false, upvoted: false, upvotes: 0, cafe: null };
      }
      
      const { data: cafeData, error: updateError } = await supabase.rpc('increment_upvotes', {
        cafe_id: cafeId
      });
      
      if (updateError) {
        return { success: false, upvoted: false, upvotes: 0, cafe: null };
      }
      
      return { 
        success: true, 
        upvoted: true, 
        upvotes: cafeData?.upvotes || 0, 
        cafe: cafeData || null 
      };
    }
  } catch (error) {
    console.error('Error in upvoteCafe:', error);
    return { success: false, upvoted: false, upvotes: 0, cafe: null };
  }
};

const upvoteService = {
  getUpvotedCafes,
  isCafeUpvoted,
  upvoteCafe
};

export default upvoteService;
