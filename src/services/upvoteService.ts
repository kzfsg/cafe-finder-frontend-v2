import { supabase } from '../supabase-client';
import authService from './authService';
import type { Cafe } from '../data/cafes';

// Table names for Supabase
const CAFES_TABLE = 'cafes';
const USER_UPVOTES_TABLE = 'user_upvotes';

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

// Get the current user's upvoted cafes as full cafe objects
const getUpvotedCafes = async (): Promise<Cafe[]> => {
  try {
    // Check if user is logged in
    const session = await authService.getSession();
    if (!session) {
      console.log('User not logged in, returning empty upvoted cafes');
      return [];
    }
    
    // Get the user's upvoted cafe IDs from the user_upvotes table
    const { data: upvotes, error } = await supabase
      .from(USER_UPVOTES_TABLE)
      .select('cafe_id')
      .eq('user_id', session.user.id);
    
    if (error) {
      return handleSupabaseError(error, 'getUpvotedCafes');
    }
    
    if (!upvotes || upvotes.length === 0) {
      console.log('No upvoted cafes found');
      return [];
    }
    
    // Extract the cafe IDs
    const cafeIds = upvotes.map(upvote => upvote.cafe_id);
    
    // Get the cafe details for each upvoted cafe
    const { data: cafes, error: cafesError } = await supabase
      .from(CAFES_TABLE)
      .select('*')
      .in('id', cafeIds);
    
    if (cafesError) {
      return handleSupabaseError(cafesError, 'getUpvotedCafes-cafes');
    }
    
    // Transform the cafes to match our application's Cafe interface
    // This would typically call a transformCafeData function from cafeService
    return cafes || [];
  } catch (error) {
    console.error('Error fetching upvoted cafes:', error);
    return [];
  }
};

// Check if a cafe is upvoted by the current user
const isCafeUpvoted = async (cafeId: number): Promise<boolean> => {
  try {
    // Check if user is logged in
    const session = await authService.getSession();
    if (!session) {
      console.log('User not logged in, cafe cannot be upvoted');
      return false;
    }
    
    // Check if there's a record in the user_upvotes table
    const { data, error } = await supabase
      .from(USER_UPVOTES_TABLE)
      .select('*')
      .eq('user_id', session.user.id)
      .eq('cafe_id', cafeId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      console.error('Error checking upvote status:', error);
      return false;
    }
    
    // If data exists, the cafe is upvoted
    return !!data;
  } catch (error) {
    console.error('Error checking if cafe is upvoted:', error);
    return false;
  }
};

// Upvote a cafe
const upvoteCafe = async (cafeId: number): Promise<{ success: boolean; upvoted: boolean; upvotes: number; cafe: Cafe }> => {
  try {
    console.log('Upvoting cafe with ID:', cafeId);
    
    // Check if user is logged in
    const session = await authService.getSession();
    if (!session) {
      console.log('User not logged in, cannot upvote');
      return { success: false, upvoted: false, upvotes: 0, cafe: {} as Cafe };
    }
    
    // Check if the cafe is already upvoted
    const isAlreadyUpvoted = await isCafeUpvoted(cafeId);
    if (isAlreadyUpvoted) {
      console.log('Cafe already upvoted');
      return { success: true, upvoted: true, upvotes: 0, cafe: {} as Cafe }; // Already upvoted, so we consider this successful
    }
    
    // Start a transaction to update both the cafe upvote count and add a user_upvote record
    // First, get the current upvote count
    const { data: cafeData, error: cafeError } = await supabase
      .from(CAFES_TABLE)
      .select('upvotes')
      .eq('id', cafeId)
      .single();
    
    if (cafeError) {
      console.error('Error fetching cafe data:', cafeError);
      return { success: false, upvoted: false, upvotes: 0, cafe: {} as Cafe };
    }
    
    if (!cafeData) {
      console.error('Cafe not found with ID:', cafeId);
      return { success: false, upvoted: false, upvotes: 0, cafe: {} as Cafe };
    }
    
    // Increment the upvote count
    const newUpvotes = (cafeData.upvotes || 0) + 1;
    
    // Update the cafe with the new upvote count
    const { error: updateError } = await supabase
      .from(CAFES_TABLE)
      .update({ upvotes: newUpvotes })
      .eq('id', cafeId);
    
    if (updateError) {
      console.error('Error updating cafe upvotes:', updateError);
      return { success: false, upvoted: false, upvotes: 0, cafe: {} as Cafe };
    }
    
    // Add a record to the user_upvotes table
    const { error: upvoteError } = await supabase
      .from(USER_UPVOTES_TABLE)
      .insert({
        user_id: session.user.id,
        cafe_id: cafeId,
        created_at: new Date().toISOString()
      });
    
    if (upvoteError) {
      console.error('Error inserting user upvote record:', upvoteError);
      return { success: false, upvoted: false, upvotes: 0, cafe: {} as Cafe };
    }
    
    // Get the updated cafe data
    const { data: updatedCafe, error: fetchError } = await supabase
      .from(CAFES_TABLE)
      .select('*')
      .eq('id', cafeId)
      .single();
      
    if (fetchError || !updatedCafe) {
      console.error('Error fetching updated cafe data:', fetchError);
      return { success: true, upvoted: true, upvotes: newUpvotes, cafe: {} as Cafe };
    }
    
    return {
      success: true,
      upvoted: true,
      upvotes: newUpvotes,
      cafe: updatedCafe as Cafe
    };
  } catch (error) {
    console.error('Error upvoting cafe:', error);
    return {
      success: false,
      upvoted: false,
      upvotes: 0,
      cafe: {} as Cafe
    };
  }
};

const upvoteService = {
  getUpvotedCafes,
  isCafeUpvoted,
  upvoteCafe
};

export default upvoteService;
