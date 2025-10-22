import { supabase } from './supabaseClient';
import type { UserPlan, UserRole } from '../types/auth';
import type { Database } from '../types/database';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type PaymentSettings = Database['public']['Tables']['payment_settings']['Row'];
type PlanPricing = Database['public']['Tables']['plan_pricing']['Row'];

export const databaseService = {
  // ============ User Profile Management ============
  
  /**
   * Get a user profile by user ID
   */
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Get the current user's profile
   */
  getCurrentUserProfile: async (): Promise<UserProfile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return databaseService.getUserProfile(user.id);
  },

  /**
   * Get all users (admin only)
   */
  getAllUsers: async (): Promise<UserProfile[]> => {
    try {
      console.log('🔍 databaseService.getAllUsers - Starting query...');
      
      // Check current user session
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('🔍 Current authenticated user:', currentUser?.email);
      
      // Direct query to user_profiles table (admin can see all due to RLS policy)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all users:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        return [];
      }

      console.log('✅ Query successful, returned', data?.length || 0, 'users');
      return data || [];
    } catch (err) {
      console.error('❌ Exception in getAllUsers:', err);
      return [];
    }
  },

  /**
   * Update user plan (admin only)
   */
  updateUserPlan: async (userId: string, plan: UserPlan): Promise<boolean> => {
    console.log(`💾 Updating user plan: ${userId} → ${plan}`);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ plan })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Error updating user plan:', error);
      console.error('Error details:', { code: error.code, message: error.message, hint: error.hint });
      return false;
    }

    console.log('✅ User plan updated successfully:', data);
    return true;
  },

  /**
   * Update user role (admin only)
   */
  updateUserRole: async (userId: string, role: UserRole): Promise<boolean> => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }

    return true;
  },

  /**
   * Increment user's generation count
   */
  incrementGenerations: async (count: number = 1, isVideo: boolean = false): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      const { error } = await supabase.rpc('increment_user_generations', {
        p_user_id: user.id,
        p_count: count,
        p_is_video: isVideo,
      });

      if (error) {
        console.error('Error incrementing generations:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error calling increment_user_generations:', err);
      return false;
    }
  },

  // ============ Payment Settings Management (Admin Only) ============

  /**
   * Get payment settings
   */
  getPaymentSettings: async (): Promise<Record<string, PaymentSettings>> => {
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*');

    if (error) {
      console.error('Error fetching payment settings:', error);
      return {};
    }

    // Convert array to object keyed by gateway name
    const settings: Record<string, PaymentSettings> = {};
    data?.forEach(setting => {
      settings[setting.gateway] = setting;
    });

    return settings;
  },

  /**
   * Update payment settings (admin only)
   */
  updatePaymentSettings: async (
    gateway: 'stripe' | 'razorpay',
    publishableKey: string,
    secretKey: string
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('payment_settings')
      .update({
        publishable_key: publishableKey,
        secret_key: secretKey,
      })
      .eq('gateway', gateway);

    if (error) {
      console.error(`Error updating ${gateway} settings:`, error);
      return false;
    }

    return true;
  },

  // ============ Plan Pricing Management ============

  /**
   * Get all plan pricing
   */
  getPlanPricing: async (): Promise<PlanPricing[]> => {
    const { data, error } = await supabase
      .from('plan_pricing')
      .select('*');

    if (error) {
      console.error('Error fetching plan pricing:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Update plan price (admin only)
   */
  updatePlanPrice: async (
    plan: UserPlan,
    price: number,
    currency: 'USD' | 'EUR' | 'INR'
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('plan_pricing')
      .update({ price, currency })
      .eq('plan', plan);

    if (error) {
      console.error('Error updating plan price:', error);
      return false;
    }

    return true;
  },

  // ============ Generation History ============

  /**
   * Log a generation
   */
  logGeneration: async (
    generationType: string,
    mode: string | null,
    prompt: string | null,
    settings: any
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('generation_history')
      .insert({
        user_id: user.id,
        generation_type: generationType,
        mode,
        prompt,
        settings,
      });

    if (error) {
      console.error('Error logging generation:', error);
      return false;
    }

    return true;
  },

  /**
   * Get user's generation history
   */
  getGenerationHistory: async (limit: number = 50): Promise<any[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('generation_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching generation history:', error);
      return [];
    }

    return data || [];
  },

  // ============ Admin Settings ============

  /**
   * Get admin setting
   */
  getAdminSetting: async (key: string): Promise<any | null> => {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();

    if (error) {
      console.error('Error fetching admin setting:', error);
      return null;
    }

    return data?.setting_value;
  },

  /**
   * Set admin setting
   */
  setAdminSetting: async (key: string, value: any): Promise<boolean> => {
    console.log(`💾 setAdminSetting: ${key} = ${value}`);
    
    const { data, error } = await supabase
      .from('admin_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
      }, {
        onConflict: 'setting_key',  // Update if key exists, insert if not
      })
      .select();

    if (error) {
      console.error(`❌ Error setting admin setting ${key}:`, error);
      console.error('Error details:', { code: error.code, message: error.message, details: error.details });
      return false;
    }

    console.log(`✅ Successfully saved ${key}:`, data);
    return true;
  },
};

