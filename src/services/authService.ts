import { supabase } from '../supabase-client';

// No need for axios or API configuration as we're using Supabase client

// Interface for user registration data
export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Interface for login data
export interface LoginData {
  identifier: string; // Strapi uses 'identifier' for username/email
  password: string;
}

// Interface for our application's user data
type User = {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  bookmarkedCafes?: any[];
  [key: string]: any; // For other properties that might be returned
};

// This ensures we're exporting the type
export type { User };

// Type guard to check if an object is our User type
const isUser = (obj: any): obj is User => {
  return (
    obj && 
    typeof obj.id === 'string' && 
    typeof obj.email === 'string' &&
    typeof obj.created_at === 'string'
  );
}

// Authentication service methods
const authService = {
  // Register a new user
  register: async (data: RegisterData) => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            email: data.email
          }
        }
      });

      if (error) throw error;

      // If we have a user, the profile will be created by the trigger
      if (authData.user) {
        // If we have a session, log the user in
        if (authData.session) {
          // Get the full user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          const userData: User = {
            id: authData.user.id,
            email: authData.user.email || '',
            username: profileData?.username || data.username || authData.user.email?.split('@')[0] || '',
            created_at: authData.user.created_at || new Date().toISOString(),
            avatar_url: profileData?.avatar_url || null,
          };
          
          // Store session and user data in localStorage
          localStorage.setItem('jwt', authData.session.access_token);
          localStorage.setItem('user', JSON.stringify(userData));
          
          return {
            user: userData,
            jwt: authData.session.access_token
          };
        }
        
        // If no session (email confirmation required)
        return { 
          user: null, 
          message: 'Please check your email to confirm your registration.' 
        };
      }
      
      throw new Error('Registration failed');
      
      // If we get here, it means the user needs to confirm their email
      return { 
        user: null, 
        message: 'Please check your email to confirm your registration.' 
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  login: async (data: LoginData) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.identifier, // Supabase uses email, not identifier
        password: data.password
      });
      
      if (error) throw error;
      
      if (!authData.session || !authData.user) {
        throw new Error('No session or user data returned');
      }
      
      // Format user data to match our User interface
      if (!authData.user.email) {
        throw new Error('User email is required');
      }
      
      const userData: User = {
        id: authData.user.id,
        email: authData.user.email,
        username: authData.user.user_metadata?.username || authData.user.email.split('@')[0],
        created_at: authData.user.created_at || new Date().toISOString(),
        avatar_url: authData.user.user_metadata?.avatar_url,
      };
      
      // Store session and user data in localStorage
      localStorage.setItem('jwt', authData.session.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return {
        user: userData,
        jwt: authData.session.access_token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      if (!isUser(user)) {
        console.warn('Invalid user data in localStorage');
        return null;
      }
      return user;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },
  
  // Check if user is logged in
  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('jwt');
  },

  // Get user's profile picture
  getUserAvatar: (user: User): string => {
    // If user has an avatar, return the URL, otherwise return default avatar
    return user?.avatar_url || 'icons/default-avatar.svg';
  },
  
  // Get the current user with fresh data from Supabase
  refreshUserData: async (): Promise<User | null> => {
    try {
      // First, check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No active session:', sessionError);
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        return null;
      }
      
      // Get the current user's data
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user data:', userError);
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        return null;
      }
      
      // Get the user's profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      // Format user data to match our User interface
      const formattedUser: User = {
        id: user.id,
        email: user.email || '',
        username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || '',
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at,
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      };
      
      // Update localStorage with fresh user data
      localStorage.setItem('user', JSON.stringify(formattedUser));
      
      return formattedUser;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }
};

export default authService;
