import { supabase } from '../supabase-client';
import authService from './authService';
import type { Cafe } from '../data/cafes';
import cafeService from './cafeService';
import type { SupabaseCafe } from './cafeService';

// Define the shape of the response from Supabase for downvotes
// interface DownvoteResponse {
//   cafe_id: number;
//   [key: string]: any;
// }

// Table names for Supabase
const CAFES_TABLE = 'cafes';
const USER_DOWNVOTES_TABLE = 'user_downvotes';

/**
 * Get all cafes that the current user has downvoted
 */
const getDownvotedCafes = async (): Promise<Cafe[]> => {
  try {
    const session = await authService.getSession();
    if (!session) return [];
    
    // Get all downvote records for the current user
    const { data: downvotes, error } = await supabase
      .from(USER_DOWNVOTES_TABLE)
      .select('cafe_id')
      .eq('user_id', session.user.id);
    
    if (error) {
      console.error('Error fetching downvotes:', error);
      return [];
    }
    
    if (!downvotes?.length) return [];
    
    // Extract cafe IDs from downvote records
    const cafeIds = downvotes.map(downvote => downvote.cafe_id);
    
    // Fetch the full cafe data for each downvoted cafe 
    const { data: cafes, error: cafesError } = await supabase
      .from(CAFES_TABLE)
      .select('*')
      .in('id', cafeIds);
    
    if (cafesError) {
      console.error('Error fetching downvoted cafes:', cafesError);
      return [];
    }
    
    // Transform the raw cafe data to our application's Cafe format
    return Promise.all((cafes || []).map((cafe: SupabaseCafe) => cafeService.transformCafeData(cafe)));
  } catch (error) {
    console.error('Error in getDownvotedCafes:', error);
    return [];
  }
};

/**
 * Check if a cafe is downvoted by the current user
 */
const isCafeDownvoted = async (cafeId: number): Promise<boolean> => {
  try {
    const session = await authService.getSession();
    if (!session) return false;
    
    // Check if there's a downvote record for this cafe and user
    const { data } = await supabase
      .from(USER_DOWNVOTES_TABLE)
      .select('id')
      .eq('user_id', session.user.id)
      .eq('cafe_id', cafeId)
      .maybeSingle();
    
    // Return true if the data exists (user has downvoted this cafe)
    return !!data;
  } catch (error) {
    console.error('Error checking if cafe is downvoted:', error);
    return false;
  }
};

/**
 * Toggle downvote status for a cafe
 * If the cafe is already downvoted, remove the downvote
 * If the cafe is not downvoted, add a downvote
 */
const toggleDownvote = async (cafeId: number): Promise<{
  success: boolean;
  downvoted: boolean;
  downvotes: number;
  cafe: Cafe | null;
  message?: string;
}> => {
  try {
    console.log('toggleDownvote called for cafeId:', cafeId);
    
    // Check if user is logged in
    const session = await authService.getSession();
    if (!session) {
      console.log('User not logged in, cannot toggle downvote');
      return { success: false, downvoted: false, downvotes: 0, cafe: null };
    }
    
    const userId = session.user.id;
    console.log('User ID:', userId);
    
    console.log('Checking if cafe is already downvoted...');
    const isAlreadyDownvoted = await isCafeDownvoted(cafeId);
    console.log('Is cafe already downvoted?', isAlreadyDownvoted);
    
    // Start a Supabase transaction
    if (isAlreadyDownvoted) {
      // REMOVE DOWNVOTE
      
      // 1. Delete the downvote record
      const { error: removeError } = await supabase
        .from(USER_DOWNVOTES_TABLE)
        .delete()
        .eq('user_id', userId)
        .eq('cafe_id', cafeId);
      
      if (removeError) {
        console.error('Error removing downvote:', removeError);
        return { success: false, downvoted: true, downvotes: 0, cafe: null };
      }
      
      // First get the current downvote count
      const { data: currentCafe } = await supabase
        .from(CAFES_TABLE)
        .select('downvotes')
        .eq('id', cafeId)
        .single();
      
      // Calculate new downvote count (ensure it doesn't go below 0)
      const newDownvotes = Math.max(0, (currentCafe?.downvotes || 0) - 1);
      
      // First perform the update
      const { error: updateError } = await supabase
        .from(CAFES_TABLE)
        .update({ downvotes: newDownvotes })
        .eq('id', cafeId);
      
      if (updateError) {
        console.error('Error updating cafe downvotes:', updateError);
        return { success: false, downvoted: true, downvotes: newDownvotes + 1, cafe: null };
      }
      
      // Then fetch the updated cafe data in a separate query
      const { data: updatedCafe, error: fetchError } = await supabase
        .from(CAFES_TABLE)
        .select('*')
        .eq('id', cafeId)
        .single();
      
      if (fetchError || !updatedCafe) {
        console.error('Error fetching updated cafe after removing downvote:', fetchError);
        // Return success with the new downvote count even if fetch fails
        return {
          success: true,
          downvoted: false,
          downvotes: newDownvotes,
          cafe: null,
          message: 'Downvote removed but could not fetch updated cafe details'
        };
      }
      
      // Skip full transformation to avoid potential issues
      console.log('Returning updated cafe data without full transformation');
      return {
        success: true,
        downvoted: false,
        downvotes: updatedCafe.downvotes || 0,
        cafe: {
          ...updatedCafe,
          // Include minimal required fields
          id: updatedCafe.id,
          name: updatedCafe.name,
          downvotes: updatedCafe.downvotes || 0,
          // Use existing image URLs if available or provide empty array
          imageUrls: updatedCafe.image_urls || []
        } as Cafe
      };
      
    } else {
      // ADD DOWNVOTE
      
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
          downvoted: false, 
          downvotes: 0, 
          cafe: null,
          message: 'User profile not found. Please complete your profile first.'
        };
      }
      
      // 1. Insert a new downvote record
      const { error: insertError } = await supabase
        .from(USER_DOWNVOTES_TABLE)
        .insert({
          user_id: userId,
          cafe_id: cafeId,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error adding downvote:', insertError);
        return { 
          success: false, 
          downvoted: false, 
          downvotes: 0, 
          cafe: null,
          message: 'Failed to add downvote. Please try again.'
        };
      }
      
      // First get the current downvote count
      const { data: currentCafe } = await supabase
        .from(CAFES_TABLE)
        .select('downvotes')
        .eq('id', cafeId)
        .single();
      
      // Calculate new downvote count
      const newDownvotes = (currentCafe?.downvotes || 0) + 1;
      
      // First perform the update
      const { error: updateError } = await supabase
        .from(CAFES_TABLE)
        .update({ downvotes: newDownvotes })
        .eq('id', cafeId);
      
      if (updateError) {
        console.error('Error updating cafe downvotes:', updateError);
        return { success: false, downvoted: true, downvotes: newDownvotes - 1, cafe: null };
      }
      
      // Then fetch the updated cafe data in a separate query
      const { data: updatedCafe, error: fetchError } = await supabase
        .from(CAFES_TABLE)
        .select('*')
        .eq('id', cafeId)
        .single();
      
      if (fetchError || !updatedCafe) {
        console.error('Error fetching updated cafe:', fetchError);
        // Return success with the new downvote count even if fetch fails
        return {
          success: true,
          downvoted: true,
          downvotes: newDownvotes,
          cafe: null,
          message: 'Downvote successful but could not fetch updated cafe details'
        };
      }
      return {
        success: true,
        downvoted: true,
        downvotes: updatedCafe.downvotes || 0,
        cafe: {
          ...updatedCafe,
          // Include minimal required fields
          id: updatedCafe.id,
          name: updatedCafe.name,
          downvotes: updatedCafe.downvotes || 0,
          // Use existing image URLs if available or provide empty array
          imageUrls: updatedCafe.image_urls || []
        } as Cafe
      };
    }
  } catch (error) {
    console.error('Error toggling downvote:', error);
    return { success: false, downvoted: false, downvotes: 0, cafe: null };
  }
};

// Export the service functions
const downvoteService = {
  getDownvotedCafes,
  isCafeDownvoted,
  toggleDownvote
};

export default downvoteService;
