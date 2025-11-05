
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { User, UserPlan, UserRole, PaymentSettings, PlanPrices, Currency, PaymentGatewaySettings, ApiSettings, SupabaseSettings, GeminiSettings } from '../types';
import { hasPermission as checkPermission, Feature } from '../services/permissionsService';
import { supabase } from '../services/supabaseClient';
import { databaseService } from '../services/databaseService';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  users: User[]; // All users for admin
  updateUserPlan: (userId: string, plan: UserPlan) => Promise<void>;
  refreshUsers: () => Promise<void>; // Refresh user list (admin only)
  resetUserUsage: (userId: string) => Promise<void>; // Reset usage to 0 (admin only)
  doubleUserCredits: (userId: string) => Promise<void>; // Double monthly limit (admin only)
  hasPermission: (feature: Feature) => boolean;
  incrementGenerationsUsed: (count: number, isVideo?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  // Admin Payment & Plan Settings
  paymentSettings: PaymentSettings;
  planPrices: PlanPrices;
  currency: Currency;
  updatePaymentSettings: (gateway: 'stripe' | 'razorpay', settings: PaymentGatewaySettings) => Promise<void>;
  updatePlanPrices: (prices: PlanPrices, newCurrency?: Currency) => Promise<void>;
  setCurrency: (currency: Currency) => void;
  // Admin API Settings
  apiSettings: ApiSettings;
  updateApiSettings: (service: 'supabase' | 'gemini', settings: Partial<SupabaseSettings> | Partial<GeminiSettings>) => void;
  // Subscription Management
  needsPayment: boolean;
  checkSubscriptionStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Helper function to convert database user profile to User type
const convertProfileToUser = (profile: any): User => {
  return {
    id: profile.id,
    email: profile.email,
    plan: profile.plan as UserPlan,
    role: profile.role as UserRole,
    generationsUsed: profile.generations_used,
    dailyGenerationsUsed: profile.daily_generations_used,
    dailyVideosUsed: profile.daily_videos_used,
    lastGenerationDate: profile.last_generation_date || new Date().toISOString().split('T')[0],
  };
};

const initialApiSettings: ApiSettings = {
    supabase: { 
      url: import.meta.env.VITE_SUPABASE_URL || '', 
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '' 
    },
    gemini: { 
      apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' 
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsPayment, setNeedsPayment] = useState(false); // Free plan users don't "need" payment, but should be reminded
  
  // Admin settings state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    stripe: { publishableKey: '', secretKey: '' },
    razorpay: { publishableKey: '', secretKey: '' },
  });
  const [planPrices, setPlanPrices] = useState<PlanPrices>({
    solo: 25,
    studio: 59,
    brand: 129,
  });
  const [currency, setCurrency] = useState<Currency>('INR');
  const [apiSettings, setApiSettings] = useState<ApiSettings>(initialApiSettings);

  // Load ALL admin settings from database on mount
  useEffect(() => {
    const loadAdminSettings = async () => {
      try {
        // Load Gemini API key
        const geminiKey = await databaseService.getAdminSetting('gemini_api_key');
        if (geminiKey) {
          setApiSettings(current => ({
            ...current,
            gemini: { apiKey: geminiKey }
          }));
        }

        // Load Stripe settings
        const stripePublishable = await databaseService.getAdminSetting('stripe_publishable_key');
        const stripeSecret = await databaseService.getAdminSetting('stripe_secret_key');
        if (stripePublishable || stripeSecret) {
          setPaymentSettings(current => ({
            ...current,
            stripe: {
              publishableKey: stripePublishable || '',
              secretKey: stripeSecret || '',
            }
          }));
        }

        // Load Razorpay settings
        const razorpayKeyId = await databaseService.getAdminSetting('razorpay_key_id');
        const razorpayKeySecret = await databaseService.getAdminSetting('razorpay_key_secret');
        console.log('📦 Loaded Razorpay from DB:', { razorpayKeyId, razorpayKeySecret });
        if (razorpayKeyId || razorpayKeySecret) {
          setPaymentSettings(current => ({
            ...current,
            razorpay: {
              publishableKey: razorpayKeyId || '',
              secretKey: razorpayKeySecret || '',
            }
          }));
        }

        // Load plan pricing
        const freePlanPrice = await databaseService.getAdminSetting('plan_price_free');
        const soloPlanPrice = await databaseService.getAdminSetting('plan_price_solo');
        const studioPlanPrice = await databaseService.getAdminSetting('plan_price_studio');
        const brandPlanPrice = await databaseService.getAdminSetting('plan_price_brand');
        const currency = await databaseService.getAdminSetting('pricing_currency');
        
        if (freePlanPrice || soloPlanPrice || studioPlanPrice || brandPlanPrice) {
          setPlanPrices({
            free: parseFloat(freePlanPrice) || 0,
            solo: parseFloat(soloPlanPrice) || 25,
            studio: parseFloat(studioPlanPrice) || 59,
            brand: parseFloat(brandPlanPrice) || 129,
          });
        }
        
        if (currency) {
          setCurrency(currency as Currency);
        }

        console.log('✅ All admin settings loaded from database');
      } catch (error) {
        console.error('Error loading admin settings from database:', error);
      }
    };
    
    loadAdminSettings();
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let initialSessionCheckDone = false;

    console.log('🔄 Setting up Auth State Listener...');
    
    // Subscribe to auth changes FIRST (this catches the OAuth session from URL)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth State Change Event:', event, '| Session:', session?.user?.email || 'none');
        
        if (event === 'INITIAL_SESSION') {
          initialSessionCheckDone = true;
          console.log('📱 Initial session check from URL completed');
          
          // On OAuth redirect, this event fires with the session
          if (session?.user) {
            console.log('✅ OAuth Session found:', session.user.email);
            console.log('👤 Provider:', session.user.user_metadata?.provider);
            loadUserProfile(session.user);
          } else {
            console.log('⚪ No session on initial check');
            setLoading(false);
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.email);
          console.log('👤 Provider:', session.user.user_metadata?.provider);
          if (!initialSessionCheckDone) {
            initialSessionCheckDone = true;
          }
          loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setUsers([]);
          setLoading(false);
        }
      }
    );

    // Also try to get session directly (for already authenticated users)
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted && !initialSessionCheckDone) {
          console.log('✅ Session found from getSession():', session.user.email);
          loadUserProfile(session.user);
          initialSessionCheckDone = true;
        }
      } catch (error) {
        console.error('❌ Error getting session:', error);
      }
    };

    // Wait a bit for the auth state change listener to fire first
    const timer = setTimeout(() => {
      if (mounted && !initialSessionCheckDone) {
        checkExistingSession();
      }
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile from database - accepts user directly from auth event
  const loadUserProfile = async (authUser?: any) => {
    console.log('👤 loadUserProfile called with:', authUser?.email);
    
    try {
      if (!authUser?.email) {
        console.error('❌ No auth user email');
        setLoading(false);
        return;
      }

      console.log('✅ Processing user:', authUser.email);
      
      // Fetch actual user profile from database
      console.log('📊 Fetching user profile from database...');
      const profile = await databaseService.getUserProfile(authUser.id);
      console.log('📊 Profile fetched:', profile);
      
      if (profile) {
        // Use database data
        const userData = convertProfileToUser(profile);
        console.log('✅ Loaded user from database:', userData);
        setUser(userData);
        
        // Load admin data in background if user is admin (non-blocking)
        if (userData.role === 'admin') {
          console.log('👑 Admin user - loading admin data...');
          loadAllUsers().catch(e => console.warn('⚠️ loadAllUsers error:', e));
          // Payment settings and plan pricing are now loaded from admin_settings table in useEffect above
        }
      } else {
        // Fallback: Create default user object (for new users who don't have a profile yet)
        console.warn('⚠️ No profile found in database, using defaults');
        const isAdmin = authUser.email === 'bitan@outreachpro.io';
        const userData: User = {
          id: authUser.id,
          email: authUser.email,
          plan: isAdmin ? 'brand' : 'free',
          role: isAdmin ? 'admin' : 'user',
          generationsUsed: 0,
          dailyGenerationsUsed: 0,
          dailyVideosUsed: 0,
          lastGenerationDate: new Date().toISOString().split('T')[0],
        };
        
        console.log('✅ Setting default user:', userData.email);
        setUser(userData);
        
        // Load admin data in background if user is admin (non-blocking)
        if (userData.role === 'admin') {
          console.log('👑 Admin user - loading admin data...');
          loadAllUsers().catch(e => console.warn('⚠️ loadAllUsers error:', e));
        }
      }
      
      console.log('✅ setLoading(false) - login complete');
      setLoading(false);
      
    } catch (error) {
      console.error('❌ loadUserProfile error:', error);
      console.error('❌ Error details:', error);
      // Still set user to avoid infinite loading
      const isAdmin = authUser.email === 'bitan@outreachpro.io';
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email,
        plan: isAdmin ? 'brand' : 'free',
        role: isAdmin ? 'admin' : 'user',
        generationsUsed: 0,
        dailyGenerationsUsed: 0,
        dailyVideosUsed: 0,
        lastGenerationDate: new Date().toISOString().split('T')[0],
      };
      console.log('⚠️ Using fallback user due to error:', fallbackUser);
      setUser(fallbackUser);
      setLoading(false);
    }
  };

  // Load all users (admin only)
  const loadAllUsers = async () => {
    try {
      console.log('🔍 Loading all users from database...');
      console.log('🔍 Current user:', user);
      
      const allUsers = await databaseService.getAllUsers();
      console.log('📊 Raw database users count:', allUsers.length);
      console.log('📊 Raw database users:', allUsers);
      
      if (allUsers.length === 0) {
        console.warn('⚠️ No users returned from database!');
        console.warn('⚠️ This could mean:');
        console.warn('  1. No users have registered yet');
        console.warn('  2. RLS is blocking access');
        console.warn('  3. Database query is failing silently');
      }
      
      const convertedUsers = allUsers.map(convertProfileToUser);
      console.log('✅ Converted users:', convertedUsers);
      setUsers(convertedUsers);
      console.log('✅ Users state updated, total:', convertedUsers.length);
    } catch (error) {
      console.error('❌ Error loading all users:', error);
    }
  };

  // Real-time subscription for user changes (admin only)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    console.log('🔴 Setting up real-time subscription for user_profiles...');

    // Subscribe to all changes in user_profiles table
    const channel = supabase
      .channel('user_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_profiles',
        },
        (payload) => {
          console.log('🔴 Real-time update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('➕ New user added:', payload.new);
            // Reload all users to get the latest data
            loadAllUsers();
          } else if (payload.eventType === 'UPDATE') {
            console.log('✏️ User updated:', payload.new);
            // Update the specific user in the list
            setUsers(current => 
              current.map(u => 
                u.id === payload.new.id 
                  ? convertProfileToUser(payload.new)
                  : u
              )
            );
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ User deleted:', payload.old);
            // Remove the user from the list
            setUsers(current => 
              current.filter(u => u.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('🔴 Real-time subscription status:', status);
      });

    // Cleanup subscription on unmount or when user changes
    return () => {
      console.log('🔴 Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // NOTE: Payment settings and plan pricing are now loaded from admin_settings table
  // in the useEffect above (lines 74-137). The old loadPaymentSettings and loadPlanPricing
  // functions that used payment_settings and plan_pricing tables have been removed to avoid conflicts.

  // Permission check
  const hasPermission = (feature: Feature): boolean => {
    if (!user) return false;
    return checkPermission(user.plan, feature);
  };
  
  // Update user plan (admin only)
  const updateUserPlan = async (userId: string, plan: UserPlan) => {
    if (user?.role !== 'admin') {
      console.error("Permission denied: only admins can change user plans.");
      return;
    }

    const success = await databaseService.updateUserPlan(userId, plan);
    if (success) {
      // Update local state in users array
      setUsers(currentUsers => 
        currentUsers.map(u => 
          u.id === userId ? { ...u, plan } : u
        )
      );
      
      // If admin is changing their own plan, update the user object too
      if (user.id === userId) {
        console.log(`✅ Admin updated own plan to ${plan}, refreshing user state`);
        setUser(currentUser => currentUser ? { ...currentUser, plan } : null);
      }
    }
  };

  // Increment generations used
  const incrementGenerationsUsed = async (count: number, isVideo: boolean = false) => {
    if (!user) return;

    const success = await databaseService.incrementGenerations(count, isVideo);
    if (success) {
      // Reload user profile to get updated counts
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await loadUserProfile(authUser);
      }
    }
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsers([]);
  };

  // Check subscription status and determine if payment is needed
  const checkSubscriptionStatus = async () => {
    if (!user) {
      setNeedsPayment(true); // No user = needs payment
      return;
    }

    try {
      // Check if user has an active subscription
      const { data, error } = await supabase
        .rpc('check_subscription_status', { user_id: user.id });

      if (error) {
        console.error('❌ Error checking subscription:', error);
        // Default to needs payment if check fails
        setNeedsPayment(true);
        return;
      }

      const result = data as { has_active_subscription: boolean; needs_payment: boolean };
      
      console.log('📊 Subscription status:', result);
      setNeedsPayment(result.needs_payment);
    } catch (error) {
      console.error('❌ Error in checkSubscriptionStatus:', error);
      setNeedsPayment(true);
    }
  };

  // Update payment settings (admin only)
  const updatePaymentSettings = async (
    gateway: 'stripe' | 'razorpay', 
    settings: PaymentGatewaySettings
  ) => {
    if (user?.role !== 'admin') return;

    try {
      if (gateway === 'stripe') {
        // Save Stripe keys to database
        await databaseService.setAdminSetting('stripe_publishable_key', settings.publishableKey);
        await databaseService.setAdminSetting('stripe_secret_key', settings.secretKey);
        console.log('✅ Stripe settings saved to database');
      } else if (gateway === 'razorpay') {
        // Save Razorpay keys to database
        await databaseService.setAdminSetting('razorpay_key_id', settings.publishableKey);
        await databaseService.setAdminSetting('razorpay_key_secret', settings.secretKey);
        console.log('✅ Razorpay settings saved to database');
      }
      
      // Update local state
      setPaymentSettings(current => ({ ...current, [gateway]: settings }));
    } catch (error) {
      console.error(`❌ Failed to save ${gateway} settings to database:`, error);
    }
  };

  // Update plan prices (admin only)
  const updatePlanPrices = async (prices: PlanPrices, newCurrency?: Currency) => {
    if (user?.role !== 'admin') return;

    try {
      // Save each plan price to database
      await databaseService.setAdminSetting('plan_price_free', prices.free.toString());
      await databaseService.setAdminSetting('plan_price_solo', prices.solo.toString());
      await databaseService.setAdminSetting('plan_price_studio', prices.studio.toString());
      await databaseService.setAdminSetting('plan_price_brand', prices.brand.toString());
      
      // Save currency if provided
      if (newCurrency) {
        await databaseService.setAdminSetting('pricing_currency', newCurrency);
        setCurrency(newCurrency);
      }
      
      console.log('✅ Plan pricing saved to database');
      
      // Update local state
      setPlanPrices(prices);
    } catch (error) {
      console.error('❌ Failed to save plan pricing to database:', error);
    }
  };
  
  // Note: setCurrency is exposed in the context but currency changes are saved via updatePlanPrices

  // Update API settings (stores in localStorage for Gemini)
  const updateApiSettings = async (
    service: 'supabase' | 'gemini', 
    settings: Partial<SupabaseSettings> | Partial<GeminiSettings>
  ) => {
    if (user?.role !== 'admin') return;
    
    if (service === 'gemini') {
      const geminiSettings = settings as GeminiSettings;
      
      // Save to database so ALL users across ALL devices use the new key
      const success = await databaseService.setAdminSetting('gemini_api_key', geminiSettings.apiKey);
      
      if (success) {
        console.log('✅ Gemini API key saved to database');
        // Refresh the cached key in geminiService
        const { refreshGeminiApiKey } = await import('../services/geminiService');
        refreshGeminiApiKey();
        setApiSettings(current => ({ ...current, gemini: geminiSettings }));
        
        // Show a message to user that changes take effect immediately
        console.log('✅ API key updated! All new requests will use the new key.');
        console.log('ℹ️  If you have other browser tabs open, they will automatically refresh within 5 minutes or on next API call.');
      } else {
        console.error('❌ Failed to save Gemini API key to database');
      }
    }
    // Supabase settings are in environment variables, not changeable at runtime
  };

  // Reset user usage to 0 (admin only)
  const resetUserUsage = async (userId: string) => {
    if (user?.role !== 'admin') {
      console.error("Permission denied: only admins can reset usage.");
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          generations_used: 0,
          daily_generations_used: 0,
          daily_videos_used: 0,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error resetting user usage:', error);
        return;
      }

      console.log('✅ User usage reset to 0');
      
      // Update local state
      setUsers(currentUsers => 
        currentUsers.map(u => 
          u.id === userId 
            ? { ...u, generationsUsed: 0, dailyGenerationsUsed: 0, dailyVideosUsed: 0 } 
            : u
        )
      );
    } catch (error) {
      console.error('Error in resetUserUsage:', error);
    }
  };

  // Double user credits (admin only) - doubles monthly generation limit
  const doubleUserCredits = async (userId: string) => {
    if (user?.role !== 'admin') {
      console.error("Permission denied: only admins can double credits.");
      return;
    }

    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;

      const currentUsed = targetUser.generationsUsed;
      const doubled = currentUsed * 2;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          generations_used: doubled,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error doubling user credits:', error);
        return;
      }

      console.log(`✅ User credits doubled: ${currentUsed} → ${doubled}`);
      
      // Update local state
      setUsers(currentUsers => 
        currentUsers.map(u => 
          u.id === userId 
            ? { ...u, generationsUsed: doubled } 
            : u
        )
      );
    } catch (error) {
      console.error('Error in doubleUserCredits:', error);
    }
  };

  const value = {
    user,
    loading,
    users,
    updateUserPlan,
    refreshUsers: loadAllUsers,
    resetUserUsage,
    doubleUserCredits,
    hasPermission,
    incrementGenerationsUsed,
    logout,
    paymentSettings,
    planPrices,
    currency,
    updatePaymentSettings,
    updatePlanPrices,
    setCurrency,
    apiSettings,
    updateApiSettings,
    needsPayment,
    checkSubscriptionStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};