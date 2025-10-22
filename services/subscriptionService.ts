import { supabase } from './supabaseClient';
import type { RazorpayResponse } from '../types/payment';

export const subscriptionService = {
  /**
   * Create a payment record
   */
  createPayment: async (
    userId: string,
    plan: string,
    amount: number,
    razorpayResponse: RazorpayResponse
  ): Promise<string> => {
    try {
      console.log('💳 Creating payment record...', { userId, plan, amount });

      // Calculate GST (18%)
      const gstAmount = Math.round(amount * 0.18 * 100) / 100;
      const totalAmount = amount + gstAmount;

      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          plan,
          amount,
          gst_amount: gstAmount,
          total_amount: totalAmount,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          status: 'success',
          payment_method: 'razorpay',
          paid_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error creating payment:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No payment ID returned');
      }

      console.log('✅ Payment created:', data.id);
      return data.id;
    } catch (error: any) {
      console.error('❌ Error in createPayment:', error);
      throw error;
    }
  },

  /**
   * Create a subscription
   */
  createSubscription: async (
    userId: string,
    plan: string,
    paymentId: string,
    razorpaySubscriptionId: string
  ): Promise<string> => {
    try {
      console.log('📋 Creating subscription...', { userId, plan, paymentId });

      // Call the database function to create subscription
      const { data, error } = await supabase.rpc('create_subscription', {
        p_user_id: userId,
        p_plan: plan,
        p_payment_id: paymentId,
        p_razorpay_subscription_id: razorpaySubscriptionId,
      });

      if (error) {
        console.error('❌ Error creating subscription:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No subscription ID returned');
      }

      console.log('✅ Subscription created:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Error in createSubscription:', error);
      throw error;
    }
  },

  /**
   * Update user plan (already handled by create_subscription, but kept for compatibility)
   */
  updateUserPlan: async (userId: string, plan: string): Promise<void> => {
    try {
      console.log('👤 Updating user plan...', { userId, plan });

      const { error } = await supabase
        .from('user_profiles')
        .update({ plan })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating user plan:', error);
        throw new Error(error.message);
      }

      console.log('✅ User plan updated');
    } catch (error: any) {
      console.error('❌ Error in updateUserPlan:', error);
      throw error;
    }
  },

  /**
   * Check if user has active subscription
   */
  checkSubscriptionStatus: async (userId: string): Promise<{
    has_active_subscription: boolean;
    needs_payment: boolean;
  }> => {
    try {
      const { data, error } = await supabase.rpc('check_subscription_status', {
        user_id: userId,
      });

      if (error) {
        console.error('❌ Error checking subscription:', error);
        throw new Error(error.message);
      }

      return data as { has_active_subscription: boolean; needs_payment: boolean };
    } catch (error: any) {
      console.error('❌ Error in checkSubscriptionStatus:', error);
      throw error;
    }
  },

  /**
   * Get user's active subscription
   */
  getUserSubscription: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('❌ Error fetching subscription:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error in getUserSubscription:', error);
      throw error;
    }
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (subscriptionId: string): Promise<void> => {
    try {
      console.log('🛑 Cancelling subscription...', subscriptionId);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) {
        console.error('❌ Error cancelling subscription:', error);
        throw new Error(error.message);
      }

      console.log('✅ Subscription cancelled');
    } catch (error: any) {
      console.error('❌ Error in cancelSubscription:', error);
      throw error;
    }
  },
};
