import type { RazorpayOptions, RazorpayResponse } from '../types/payment';
import { PLAN_PRICING } from '../types/payment';

// 🎯 DEMO MODE - Set to false to use real Razorpay
const DEMO_MODE = false;

// Razorpay Plan IDs - All plans are available for purchase
const RAZORPAY_PLAN_IDS = {
  solo: 'plan_RWEqJmL9v1aJu2',    // Solo ₹999/year (₹1,178.82 with GST)
  studio: 'plan_RWEr3jmdBjVExE',  // Studio - upfront payment
  brand: 'plan_RWErZhQtFet8FP',   // Brand - upfront payment
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const razorpayService = {
  /**
   * Load Razorpay script
   */
  loadScript: (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check if already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('✅ Razorpay script loaded');
        resolve(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  },

  /**
   * Initialize Razorpay with keys
   */
  initialize: async (publishableKey: string, secretKey: string): Promise<void> => {
    // Just load the script - keys will be used when opening checkout
    await razorpayService.loadScript();
  },

  /**
   * Open Razorpay checkout
   * - All plans: Annual subscription
   */
  openCheckout: async (
    plan: 'solo' | 'studio' | 'brand',
    userId: string,
    userName: string,
    userEmail: string,
    publishableKey: string,
    onSuccess: (response: RazorpayResponse) => void,
    onFailure: (error: any) => void
  ): Promise<void> => {
    try {
      // 🎯 DEMO MODE - Simulate successful payment
      if (DEMO_MODE) {
        console.log('🎭 DEMO MODE: Simulating payment for', plan, 'plan');
        
        // Simulate a 2-second payment process
        setTimeout(() => {
          const demoResponse: RazorpayResponse = {
            razorpay_payment_id: `demo_pay_${Date.now()}`,
            razorpay_order_id: `demo_order_${Date.now()}`,
            razorpay_subscription_id: `demo_sub_${Date.now()}`,
            razorpay_signature: 'demo_signature',
          };
          
          console.log('✅ DEMO MODE: Payment successful!', demoResponse);
          onSuccess(demoResponse);
        }, 2000);
        
        return;
      }

      // Step 1: Create subscription in Razorpay via Edge Function
      console.log('📞 Creating Razorpay subscription via API...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const createSubResponse = await fetch(`${supabaseUrl}/functions/v1/clever-responder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ plan, userId }),
      });

      if (!createSubResponse.ok) {
        const error = await createSubResponse.json();
        console.error('❌ Failed to create subscription:', error);
        onFailure({ description: error.error || 'Failed to create subscription', code: 'API_ERROR' });
        return;
      }

      const { subscription_id } = await createSubResponse.json();
      console.log('✅ Subscription created:', subscription_id);

      // Check if Razorpay key is configured
      if (!publishableKey || publishableKey.trim() === '') {
        onFailure({ 
          description: 'Razorpay is not configured yet. Please configure Razorpay keys in the Admin Panel first.',
          code: 'RAZORPAY_NOT_CONFIGURED' 
        });
        return;
      }

      // Load Razorpay script
      const loaded = await razorpayService.loadScript();
      if (!loaded) {
        onFailure({ description: 'Failed to load Razorpay', code: 'SCRIPT_LOAD_FAILED' });
        return;
      }

      // Get plan details
      const pricing = PLAN_PRICING[plan];
      const planId = RAZORPAY_PLAN_IDS[plan];

      console.log(`🚀 Opening Razorpay checkout for ${plan} plan...`);
      console.log('Plan ID:', planId);
      console.log('Amount:', pricing.totalAmount);
      console.log('Key:', publishableKey.substring(0, 10) + '...');

      // Check if plan ID exists
      if (!planId) {
        onFailure({ 
          description: `No Razorpay plan ID configured for ${plan} plan. Please create the plan in Razorpay Dashboard first.`,
          code: 'PLAN_NOT_CONFIGURED' 
        });
        return;
      }

      // Step 2: Open Razorpay checkout with the subscription ID
      const options: any = {
        key: publishableKey,
        subscription_id: subscription_id, // Use the subscription ID from Step 1
        name: 'Klint Studios',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ₹${pricing.totalAmount}/year`,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: '#10b981', // emerald-500
        },
        handler: function (response: RazorpayResponse) {
          console.log('✅ Subscription payment successful:', response);
          onSuccess(response);
        },
        modal: {
          ondismiss: function () {
            console.log('⚠️ Payment modal closed by user');
            onFailure({ description: 'Payment cancelled by user', code: 'USER_CANCELLED' });
          },
        },
        notes: {
          plan,
          userId,
          userEmail,
        },
      };

      console.log('💳 Opening Razorpay with options:', {
        key: publishableKey.substring(0, 15) + '...',
        amount: pricing.totalAmount,
        plan,
      });

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('❌ Error opening Razorpay checkout:', error);
      onFailure(error);
    }
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (subscriptionId: string): Promise<boolean> => {
    try {
      console.log('🛑 Cancelling subscription:', subscriptionId);
      
      // This would typically call your backend/Edge Function
      // For now, we'll just log it
      // You'll need to implement the actual Razorpay API call on the backend
      
      return true;
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      return false;
    }
  },

  /**
   * Format currency for display
   */
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },
};
