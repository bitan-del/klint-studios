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
    billingPeriod: 'annual',
    features: [
      'Create unlimited AI photoshoots',
      'Generate 20 images per minute',
      'Virtual try-on & product staging',
      'AI-powered prompt enhancement',
      '50+ professional scene styles',
      'HD exports ready for social media',
      'Priority email support',
      'Cancel anytime',
    ],
  },
  studio: {
    plan: 'studio',
    baseAmount: 2999,
    gstAmount: 539.82,
    totalAmount: 3538.82,
    currency: 'INR',
    billingPeriod: 'annual',
    features: [
      'Everything in Solo',
      '50 images/minute lightning speed',
      'Auto-generate product catalogs',
      '4 lifestyle shots in 1:1 & 9:16 ratios',
      'Hollywood-grade color grading',
      'AI realism boost & film grain',
      'Generative image editor',
      'Advanced editing tools',
    ],
  },
  brand: {
    plan: 'brand',
    baseAmount: 4999,
    gstAmount: 899.82,
    totalAmount: 5898.82,
    currency: 'INR',
    billingPeriod: 'annual',
    features: [
      'Everything in Studio',
      '100 images/minute ultra-fast',
      'Bulk process entire collections',
      'Full e-commerce + social media assets',
      'Save & apply brand looks instantly',
      'Dedicated account manager',
      'Phone & priority chat support',
      'SLA guarantee',
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

