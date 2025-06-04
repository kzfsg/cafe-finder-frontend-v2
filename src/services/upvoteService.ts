import { supabase } from '../supabase-client';
import authService from './authService';
import type { Cafe } from '../data/cafes';
import cafeService from './cafeService';
import type { SupabaseCafe } from './cafeService';

// Table names for Supabase
const CAFES_TABLE = 'cafes';
const USER_UPVOTES_TABLE = 'user_upvotes';

/**
 * Get all cafes that the current user has upvoted
 */
const getUpvotedCafes = async (): Promise<Cafe[]> => {
  try {
    const session = await authService.getSession();
    if (!session) return [];
    
    // Get all upvote records for the current user
    const { data: upvotes, error } = await supabase
      .from(USER_UPVOTES_TABLE)
      .select('cafe_id')
      .eq('user_id', session.user.id);
    
    if (error) {
      console.error('Error fetching upvotes:', error);
      return [];
    }
    
    if (!upvotes?.length) return [];
    
    // Extract cafe IDs from upvote records
    const cafeIds = upvotes.map(upvote => upvote.cafe_id);
    
    // Fetch the full cafe data for each upvoted cafe 
    const { data: cafes, error: cafesError } = await supabase
      .from(CAFES_TABLE)
      .select('*')
      .in('id', cafeIds);
    
    if (cafesError) {
      console.error('Error fetching upvoted cafes:', cafesError);
      return [];
    }
    
    // Transform the raw cafe data to our application's Cafe format
    return Promise.all((cafes || []).map((cafe: SupabaseCafe) => cafeService.transformCafeData(cafe)));
  } catch (error) {
    console.error('Error in getUpvotedCafes:', error);
    return [];
  }
};

/**
 * Check if a cafe is upvoted by the current user
 */
const isCafeUpvoted = async (cafeId: number): Promise<boolean> => {
  try {
    const session = await authService.getSession();
    if (!session) return false;
    
    // Check if there's an upvote record for this cafe and user
    const { data } = await supabase
      .from(USER_UPVOTES_TABLE)
      .select('id')
      .eq('user_id', session.user.id)
      .eq('cafe_id', cafeId)
      .maybeSingle();
    
    // Return true if the data exists (user has upvoted this cafe)
    return !!data;
  } catch (error) {
    console.error('Error checking if cafe is upvoted:', error);
    return false;
  }
};

/**
 * Toggle upvote status for a cafe
 * If the cafe is already upvoted, remove the upvote
 * If the cafe is not upvoted, add an upvote
 */
const toggleUpvote = async (cafeId: number): Promise<{
  success: boolean;
  upvoted: boolean;
  upvotes: number;
  cafe: Cafe | null;
  message?: string;
}> => {
  try {
    console.log('toggleUpvote called for cafeId:', cafeId);
    
    // Check if user is logged in
    const session = await authService.getSession();
    if (!session) {
      console.log('User not logged in, cannot toggle upvote');
      return { success: false, upvoted: false, upvotes: 0, cafe: null };
    }
    
    const userId = session.user.id;
    console.log('User ID:', userId);
    
    console.log('Checking if cafe is already upvoted...');
    const isAlreadyUpvoted = await isCafeUpvoted(cafeId);
    console.log('Is cafe already upvoted?', isAlreadyUpvoted);
    
    // Start a Supabase transaction
    if (isAlreadyUpvoted) {
      // REMOVE UPVOTE
      
      // 1. Delete the upvote record
      const { error: removeError } = await supabase
        .from(USER_UPVOTES_TABLE)
        .delete()
        .eq('user_id', userId)
        .eq('cafe_id', cafeId);
      
      if (removeError) {
        console.error('Error removing upvote:', removeError);
        return { success: false, upvoted: true, upvotes: 0, cafe: null };
      }
      
      // First get the current upvote count
      const { data: currentCafe } = await supabase
        .from(CAFES_TABLE)
        .select('upvotes')
        .eq('id', cafeId)
        .single();
      
      // Calculate new upvote count (ensure it doesn't go below 0)
      const newUpvotes = Math.max(0, (currentCafe?.upvotes || 0) - 1);
      
      // First perform the update
      const { error: updateError } = await supabase
        .from(CAFES_TABLE)
        .update({ upvotes: newUpvotes })
        .eq('id', cafeId);
      
      if (updateError) {
        console.error('Error updating cafe upvotes:', updateError);
        return { success: false, upvoted: true, upvotes: newUpvotes + 1, cafe: null };
      }
      
      // Then fetch the updated cafe data in a separate query
      const { data: updatedCafe, error: fetchError } = await supabase
        .from(CAFES_TABLE)
        .select('*')
        .eq('id', cafeId)
        .single();
      
      if (fetchError || !updatedCafe) {
        console.error('Error fetching updated cafe after removing upvote:', fetchError);
        // Return success with the new upvote count even if fetch fails
        return {
          success: true,
          upvoted: false,
          upvotes: newUpvotes,
          cafe: null,
          message: 'Upvote removed but could not fetch updated cafe details'
        };
      }
      
      // Skip full transformation to avoid potential issues
      console.log('Returning updated cafe data without full transformation');
      return {
        success: true,
        upvoted: false,
        upvotes: updatedCafe.upvotes || 0,
        cafe: {
          ...updatedCafe,
          // Include minimal required fields
          id: updatedCafe.id,
          name: updatedCafe.name,
          upvotes: updatedCafe.upvotes || 0,
          // Use existing image URLs if available or provide empty array
          imageUrls: updatedCafe.image_urls || []
        } as Cafe
      };
      
    } else {
      // ADD UPVOTE
      
      // 0. First check if user exists in the profiles table
      const { data: userProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (profileCheckError || !userProfile) {
        console.error('User profile not found:', userId, profileCheckError);
        return { 
          success: false, 
          upvoted: false, 
          upvotes: 0, 
          cafe: null,
          message: 'User profile not found. Please complete your profile first.'
        };
      }
      
      // 1. Insert a new upvote record
      const { error: insertError } = await supabase
        .from(USER_UPVOTES_TABLE)
        .insert({
          user_id: userId,
          cafe_id: cafeId,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error adding upvote:', insertError);
        return { 
          success: false, 
          upvoted: false, 
          upvotes: 0, 
          cafe: null,
          message: 'Failed to add upvote. Please try again.'
        };
      }
      
      // First get the current upvote count
      const { data: currentCafe } = await supabase
        .from(CAFES_TABLE)
        .select('upvotes')
        .eq('id', cafeId)
        .single();
      
      // Calculate new upvote count
      const newUpvotes = (currentCafe?.upvotes || 0) + 1;
      
      // First perform the update
      const { error: updateError } = await supabase
        .from(CAFES_TABLE)
        .update({ upvotes: newUpvotes })
        .eq('id', cafeId);
      
      if (updateError) {
        console.error('Error updating cafe upvotes:', updateError);
        return { success: false, upvoted: true, upvotes: newUpvotes - 1, cafe: null };
      }
      
      // Then fetch the updated cafe data in a separate query
      const { data: updatedCafe, error: fetchError } = await supabase
        .from(CAFES_TABLE)
        .select('*')
        .eq('id', cafeId)
        .single();
      
      if (fetchError || !updatedCafe) {
        console.error('Error fetching updated cafe:', fetchError);
        // Return success with the new upvote count even if fetch fails
        return {
          success: true,
          upvoted: true,
          upvotes: newUpvotes,
          cafe: null,
          message: 'Upvote successful but could not fetch updated cafe details'
        };
      }
      return {
        success: true,
        upvoted: true,
        upvotes: updatedCafe.upvotes || 0,
        cafe: {
          ...updatedCafe,
          // Include minimal required fields
          id: updatedCafe.id,
          name: updatedCafe.name,
          upvotes: updatedCafe.upvotes || 0,
          // Use existing image URLs if available or provide empty array
          imageUrls: updatedCafe.image_urls || []
        } as Cafe
      };
    }
  } catch (error) {
    console.error('Error toggling upvote:', error);
    return { success: false, upvoted: false, upvotes: 0, cafe: null };
  }
};

// Export the service functions
const upvoteService = {
  getUpvotedCafes,
  isCafeUpvoted,
  toggleUpvote
};

export default upvoteService;
