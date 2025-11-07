// Payment System Types

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'solo' | 'studio' | 'brand';
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  razorpaySubscriptionId?: string;
  razorpayMandateId?: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number; // Base amount without GST
  gstAmount: number; // 18% GST
  totalAmount: number; // amount + gstAmount
  currency: string;
  status: PaymentStatus;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  paymentId: string;
  userName: string;
  userEmail: string;
  userAddress?: string;
  userGstNumber?: string;
  companyName?: string;
  plan: 'free' | 'solo' | 'studio' | 'brand';
  baseAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  invoiceDate: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface PlanPricing {
  plan: 'free' | 'solo' | 'studio' | 'brand';
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;
  billingPeriod: string;
  features: string[];
}

export const PLAN_PRICING: Record<string, PlanPricing> = {
  solo: {
    plan: 'solo',
    baseAmount: 999,
    gstAmount: 179.82,
    totalAmount: 1178.82,
    currency: 'INR',
    billingPeriod: '3 months',
    features: [
      'AI Photoshoot',
      'Product Photography',
      'Photo to Prompt',
      'Social Media Posts',
      '100 images daily',
    ],
  },
  studio: {
    plan: 'studio',
    baseAmount: 2999,
    gstAmount: 539.82,
    totalAmount: 3538.82,
    currency: 'INR',
    billingPeriod: '3 months',
    features: [
      'AI Photoshoot',
      'Product Photography',
      'Virtual Try-On',
      'Photo Editor',
      'Photo to Prompt',
      'Social Media Posts',
      'Style Transfer',
      'Image Upscale',
      'Unlimited daily use',
    ],
  },
  brand: {
    plan: 'brand',
    baseAmount: 5999, // Placeholder - user didn't specify, using reasonable default
    gstAmount: 1079.82,
    totalAmount: 7078.82,
    currency: 'INR',
    billingPeriod: '3 months',
    features: [
      'Everything in PRO',
      'Advance Mode',
      'All features unlocked',
      'Unlimited daily use',
    ],
  },
};

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  subscription_id?: string;
  order_id?: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  razorpay_subscription_id?: string;
}

export interface SubscriptionCheckResult {
  hasActiveSubscription: boolean;
  subscription?: Subscription;
  daysRemaining?: number;
  needsPayment: boolean;
}

