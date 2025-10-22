
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Get Supabase credentials from environment variables (Vite uses VITE_ prefix)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Supabase credentials not found!\n' +
    'Please create a .env file in the root directory with:\n' +
    'VITE_SUPABASE_URL=your_supabase_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n\n' +
    'Copy env.example to .env and fill in your credentials.'
  );
  throw new Error('Missing Supabase configuration');
}

// Create Supabase client with TypeScript types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce', // Use PKCE flow for better security with OAuth
  },
});

// Early OAuth token detection from URL hash
if (typeof window !== 'undefined') {
  console.log('🔍 Checking for OAuth tokens in URL...');
  const hash = window.location.hash;
  const search = window.location.search;
  
  if (hash.includes('access_token') || hash.includes('code')) {
    console.log('✅ OAuth token found in URL hash');
    console.log('📍 Hash length:', hash.length);
  }
  
  // Log when session is detected from URL
  let sessionDetected = false;
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION' && session?.user) {
      if (!sessionDetected) {
        sessionDetected = true;
        console.log('✅ OAuth Sign In Detected (INITIAL_SESSION):', session.user.email);
        console.log('👤 Provider:', session?.user?.user_metadata?.provider);
      }
    } else if (event === 'SIGNED_IN') {
      console.log('✅ OAuth Sign In Detected (SIGNED_IN):', session?.user?.email, 'Provider:', session?.user?.user_metadata?.provider);
    } else if (event === 'INITIAL_SESSION') {
      console.log('📱 Initial Session Check: Not authenticated');
    }
  });
}