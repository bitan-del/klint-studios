import React, { useState, useEffect } from 'react';
import { X, Shield, CreditCard, FileText, AlertCircle } from 'lucide-react';
import { PlanCard } from './PlanCard';
import { PaymentSuccess } from './PaymentSuccess';
import type { PlanPricing } from '../../types/payment';
import { PLAN_PRICING } from '../../types/payment';
import { razorpayService } from '../../services/razorpayService';
import { subscriptionService } from '../../services/subscriptionService';
import { invoiceService } from '../../services/invoiceService';
import { useAuth } from '../../context/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstLogin?: boolean;
  canClose?: boolean; // Allow closing for feature-locked scenarios
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  isFirstLogin = false,
  canClose = false,
}) => {
  const { user, paymentSettings, checkSubscriptionStatus } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'solo' | 'studio' | 'brand' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);

  // Reset state when modal opens and check for Razorpay keys
  useEffect(() => {
    if (isOpen) {
      setSelectedPlan(null);
      setIsProcessing(false);
      setShowSuccess(false);
      setSubscriptionId(null);
      setPaymentId(null);
      
      // Check if Razorpay keys are loaded
      const hasKeys = paymentSettings.razorpay.publishableKey && paymentSettings.razorpay.publishableKey.trim() !== '';
      
      if (!hasKeys) {
        setError('Loading payment gateway...');
        // Retry after a short delay
        const timeout = setTimeout(() => {
          const recheckKeys = paymentSettings.razorpay.publishableKey && paymentSettings.razorpay.publishableKey.trim() !== '';
          if (!recheckKeys) {
            setError('Razorpay is not configured yet. Please configure Razorpay keys in the Admin Panel first.');
          } else {
            setError(null);
          }
          setIsLoadingKeys(false);
        }, 1000);
        
        return () => clearTimeout(timeout);
      } else {
        setError(null);
        setIsLoadingKeys(false);
      }
    }
  }, [isOpen, paymentSettings.razorpay.publishableKey]);

  if (!isOpen) return null;

  const plans: PlanPricing[] = [
    PLAN_PRICING.solo,
    PLAN_PRICING.studio,
    PLAN_PRICING.brand,
  ];

  const handlePlanSelect = async (plan: 'solo' | 'studio' | 'brand') => {
    if (!user || isProcessing) return;

    setSelectedPlan(plan);
    setIsProcessing(true);
    setError(null);

    console.log('🎯 Starting payment flow for:', plan);

    try {
      // Open Razorpay checkout for all plans
      await razorpayService.openCheckout(
        plan,
        user.id,
        user.email.split('@')[0], // Use email prefix as name
        user.email,
        paymentSettings.razorpay.publishableKey,
        async (response) => {
          // Success callback
          console.log('✅ Payment successful:', response);

          try {
            // Get plan pricing
            const planPricing = PLAN_PRICING[plan];
            
            // Create payment record
            console.log('💾 Creating payment record...');
            const paymentId = await subscriptionService.createPayment(
              user.id,
              plan,
              planPricing.baseAmount, // Pass the base amount (before GST)
              response // Pass the entire response object
            );

            if (!paymentId) {
              console.error('❌ Failed to create payment record');
              setError('Failed to create payment record. Please contact support.');
              setIsProcessing(false);
              return;
            }

            console.log('✅ Payment record created:', paymentId);
            setPaymentId(paymentId); // Store for invoice generation

            // Create subscription
            console.log('💾 Creating subscription...');
            const subId = await subscriptionService.createSubscription(
              user.id,
              plan,
              paymentId,
              response.razorpay_subscription_id
            );

            if (!subId) {
              console.error('❌ Failed to create subscription');
              setError('Failed to create subscription. Please contact support.');
              setIsProcessing(false);
              return;
            }

            console.log('✅ Subscription created:', subId);

            // Update user plan
            console.log('💾 Updating user plan...');
            await subscriptionService.updateUserPlan(user.id, plan);
            console.log('✅ User plan updated');

            // Create invoice
            console.log('📄 Creating invoice...');
            try {
              await invoiceService.createInvoice(user.id, paymentId, plan);
              console.log('✅ Invoice created');
            } catch (invoiceError) {
              console.error('⚠️ Invoice creation failed (non-critical):', invoiceError);
              // Don't fail the whole payment if invoice creation fails
            }

            // Refresh subscription status
            console.log('🔄 Refreshing subscription status...');
            await checkSubscriptionStatus();
            console.log('✅ Subscription status refreshed');

            // Show success
            setSubscriptionId(subId);
            setShowSuccess(true);
            setIsProcessing(false);
          } catch (dbError: any) {
            console.error('❌ Database error:', dbError);
            setError(`Database error: ${dbError.message}. You may need to run the migration first.`);
            setIsProcessing(false);
          }
        },
        (error) => {
          // Failure callback
          console.error('❌ Payment failed:', error);
          
          if (error.code === 'USER_CANCELLED') {
            setError('You closed the payment window. Please select a plan to continue.');
          } else {
            setError(error.description || 'Payment failed. Please try again.');
          }
          
          setIsProcessing(false);
          setSelectedPlan(null);
        }
      );
    } catch (err: any) {
      console.error('❌ Error processing payment:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleClose = () => {
    // Always allow closing - users can logout if needed
    onClose();
  };

  // Success screen
  if (showSuccess && subscriptionId && paymentId) {
    return (
      <PaymentSuccess
        plan={selectedPlan!}
        subscriptionId={subscriptionId}
        paymentId={paymentId}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isFirstLogin ? 'Welcome! Choose Your Plan' : 'Choose Your Plan'}
            </h2>
            <p className="text-zinc-400 mt-1">
              Select a plan to unlock all features
            </p>
          </div>
          {/* Always show close button - users can close and logout */}
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold">Notice</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Sale Banner */}
        <div className="mx-6 mb-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-4 text-center">
          <p className="text-sm text-emerald-300 font-semibold">
            🎉 Special Offer: 1 Year Plans Available During Black Friday, Cyber Monday & Boxing Day Sales!
          </p>
        </div>

        {/* Plans Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.plan}
              plan={plan}
              isPopular={plan.plan === 'studio'}
              isSelected={selectedPlan === plan.plan}
              isLoading={(isProcessing && selectedPlan === plan.plan) || isLoadingKeys}
              onSelect={() => {
                if (plan.plan !== 'free') {
                  handlePlanSelect(plan.plan as 'solo' | 'studio' | 'brand');
                }
              }}
            />
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="border-t border-zinc-800 p-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="flex items-center justify-center gap-2 text-zinc-400">
              <Shield size={18} className="text-emerald-500" />
              <span className="text-sm">Secure Payment via Razorpay</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-zinc-400">
              <CreditCard size={18} className="text-emerald-500" />
              <span className="text-sm">Annual Subscription Plans</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-zinc-400">
              <FileText size={18} className="text-emerald-500" />
              <span className="text-sm">GST Invoice Included</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 text-center mt-4">
            All plans are billed quarterly (3 months) with 18% GST. Special 1-year plans available during Black Friday, Cyber Monday, and Boxing Day sales!
          </p>
        </div>
      </div>
    </div>
  );
};
