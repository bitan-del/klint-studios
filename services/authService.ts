
import { supabase } from './supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export const authService = {
  signUp: async (email, password) => {
    return await supabase.auth.signUp({ email, password });
  },

  signInWithEmail: async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  
  signInWithGoogle: async () => {
    try {
      console.log('🔐 Starting Google OAuth sign in...');
      // Redirect directly back to the main app - Supabase will handle token extraction
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      
      console.log('📍 Redirect URL:', appUrl);
      
      const response = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: appUrl,
        },
      });
      
      if (response.error) {
        console.error('❌ Google OAuth Error:', response.error);
      } else {
        console.log('✅ Google OAuth initiated successfully');
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Exception in signInWithGoogle:', error);
      return { error };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
  
  getUser: async (): Promise<SupabaseUser | null> => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        console.error("Error fetching user:", error);
        return null;
    }
    return data.user;
  },
  
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Error fetching session:", error);
        return null;
    }
    return data.session;
  },
  
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session);
    });
  }
};
