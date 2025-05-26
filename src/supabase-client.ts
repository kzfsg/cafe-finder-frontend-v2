import { createClient } from '@supabase/supabase-js';

// Get environment variables using Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not defined in .env file');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined in .env file');
}

// Create Supabase client with improved session handling
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true, // Uses localStorage by default
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token', // Consistent key for storage
    },
  }
);