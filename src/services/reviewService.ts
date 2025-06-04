import { supabase } from '../supabase-client';
import type { User } from './authService';

// Define types for database responses
interface Profile {
  username: string;
  avatar_url?: string;
}

interface CafeDetails {
  name: string;
  imageUrls?: string[];
}

interface DatabaseReview {
  id: string;
  user_id: string;
  cafe_id: number;
  rating: boolean;
  comment: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  cafes?: CafeDetails;
  [key: string]: any;
}

export interface ReviewSubmission {
  cafe_id: number;
  rating: boolean; // true for positive, false for negative
  comment: string;
}

export interface Review {
  id: string;
  user_id: string;
  cafe_id: number;
  rating: boolean;
  comment: string;
  created_at: string;
  updated_at: string;
  cafe_name?: string;
  cafe_image?: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

const reviewService = {
  // Get all reviews for a specific user with cafe details
  async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id(username, avatar_url),
          cafes:cafe_id(name, imageUrls)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as DatabaseReview[]).map((review: DatabaseReview) => ({
        ...review,
        cafe_name: review.cafes?.name || 'Unknown Cafe',
        cafe_image: review.cafes?.imageUrls?.[0]
      }));
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  },

  // Get all reviews for a specific cafe
  async getCafeReviews(cafeId: number): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .eq('cafe_id', cafeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

// Transform the data to match our Review interface
      return (data || [] as DatabaseReview[]).map((review: DatabaseReview) => ({
        ...review,
        user: review.profiles ? {
          username: review.profiles.username,
          avatar_url: review.profiles.avatar_url
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching cafe reviews:', error);
      return [];
    }
  },

  // Add a new review
  async addReview(reviewData: ReviewSubmission, user: User): Promise<Review | null> {
    try {
      // First check if the user has already reviewed this cafe
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('cafe_id', reviewData.cafe_id)
        .eq('user_id', user.id)
        .single();

      // If the user has already reviewed this cafe, update the existing review
      if (existingReview) {
        const { data, error } = await supabase
          .from('reviews')
          .update({
            rating: reviewData.rating,
            comment: reviewData.comment,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReview.id)
          .select(`
            *,
            profiles:user_id(username, avatar_url)
          `)
          .single();

        if (error) throw error;
        
        return data ? {
          ...data,
          user: data.profiles ? {
            username: data.profiles.username,
            avatar_url: data.profiles.avatar_url
          } : undefined
        } : null;
      }

      // Otherwise, create a new review
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          cafe_id: reviewData.cafe_id,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .single();

      if (error) throw error;
      
      return data ? {
        ...data,
        user: data.profiles ? {
          username: data.profiles.username,
          avatar_url: data.profiles.avatar_url
        } : undefined
      } : null;
    } catch (error) {
      console.error('Error adding review:', error);
      return null;
    }
  },

  // Delete a review
  async deleteReview(reviewId: string, userId: string): Promise<boolean> {
    try {
      // Ensure the user is the owner of the review
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      return false;
    }
  },

  // Check if a user has already reviewed a cafe
  async hasUserReviewedCafe(cafeId: number, userId: string): Promise<Review | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('cafe_id', cafeId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error checking if user reviewed cafe:', error);
      return null;
    }
  }
};

export default reviewService;
