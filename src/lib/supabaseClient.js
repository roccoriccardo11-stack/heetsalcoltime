// Supabase client helper (Optional: ready for direct integration)
// If you want to connect a live Supabase backend, create a project at https://supabase.com
// and define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.

let supabase = null;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const getSupabase = async () => {
  if (!isSupabaseConfigured) return null;
  if (!supabase) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.warn('Supabase JS library not loaded or error initializing:', e);
    }
  }
  return supabase;
};
