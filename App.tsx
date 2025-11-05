import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useStudio } from './context/StudioContext';
import { InputPanel } from './components/shared/InputPanel';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { StudioView } from './components/studio/StudioView';
import { StudioModeSwitcher } from './components/shared/StudioModeSwitcher';
import { GenerateButton } from './components/shared/GenerateButton';
import { InteractiveGuide } from './components/shared/InteractiveGuide';
import { BestPracticesModal } from './components/shared/BestPracticesModal';
import { PricingModal } from './components/shared/PricingModal';
import { PaymentModal } from './components/payment/PaymentModal';
import { FeatureLockOverlay } from './components/shared/FeatureLockOverlay';
import { Chatbot } from './components/chatbot/Chatbot';
import { DashboardContainer } from './components/dashboard/DashboardContainer';
import { User, PanelLeft, PanelRight, ChevronDown, Globe, Key, X, Shield, Search, CreditCard, DollarSign, Eye, EyeOff, Link2, Loader2, Check, RefreshCw, RotateCcw, Zap, LayoutGrid, Layers } from 'lucide-react';
import { KLogo } from './components/shared/KLogo';
import type { User as UserType, UserPlan, Currency, PlanPrices, PaymentGatewaySettings, SupabaseSettings, GeminiSettings } from './types';
import { PLAN_DETAILS } from './services/permissionsService';


// A helper component for API key inputs with a visibility toggle
const PasswordInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string }> = ({ value, onChange, placeholder }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="relative">
            <input 
                type={isVisible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 pr-10 text-sm placeholder-zinc-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button type="button" onClick={() => setIsVisible(!isVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );
};


const AdminPanelModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const { 
        users, 
        updateUserPlan,
        refreshUsers,
        resetUserUsage,
        doubleUserCredits,
        paymentSettings,
        updatePaymentSettings,
        planPrices,
        updatePlanPrices,
        currency,
        setCurrency,
        apiSettings,
        updateApiSettings,
    } = useAuth();
    
    const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'integrations'>('users');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Local state for forms to avoid re-rendering on every keystroke
    const [stripeKeys, setStripeKeys] = useState(paymentSettings.stripe);
    const [razorpayKeys, setRazorpayKeys] = useState(paymentSettings.razorpay);
    const [prices, setPrices] = useState<PlanPrices>({
        free: planPrices.free ?? 0,
        solo: planPrices.solo ?? 999,
        studio: planPrices.studio ?? 2999,
        brand: planPrices.brand ?? 4999,
    });
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>('INR'); // Fixed to INR
    const [gemini, setGemini] = useState(apiSettings.gemini);
    
    // Loading and success states
    const [savingStripe, setSavingStripe] = useState(false);
    const [savingRazorpay, setSavingRazorpay] = useState(false);
    const [savingPrices, setSavingPrices] = useState(false);
    const [savingGemini, setSavingGemini] = useState(false);
    
    const [savedStripe, setSavedStripe] = useState(false);
    const [savedRazorpay, setSavedRazorpay] = useState(false);
    const [savedPrices, setSavedPrices] = useState(false);
    const [savedGemini, setSavedGemini] = useState(false);
    
    // Track plan changes for each user
    const [userPlanChanges, setUserPlanChanges] = useState<Record<string, UserPlan>>({});
    const [savingPlan, setSavingPlan] = useState<string | null>(null);
    
    // Effect to reset local state when modal is opened
    useEffect(() => {
        if (isOpen) {
            console.log('🔄 Syncing admin panel with global state...');
            console.log('Payment settings:', paymentSettings);
            console.log('Plan prices:', planPrices);
            console.log('API settings:', apiSettings);
            
            setStripeKeys(paymentSettings.stripe);
            setRazorpayKeys(paymentSettings.razorpay);
            setPrices({
                free: planPrices.free ?? 0,
                solo: planPrices.solo ?? 999,
                studio: planPrices.studio ?? 2999,
                brand: planPrices.brand ?? 4999,
            });
            setSelectedCurrency('INR'); // Always use INR
            setGemini(apiSettings.gemini);
        }
    }, [isOpen, paymentSettings, planPrices, apiSettings]); // Sync when modal opens OR settings change

    // Debug logging
    useEffect(() => {
        if (isOpen) {
            console.log('👥 Admin Panel - Total users:', users.length);
            console.log('👥 Users data:', users);
        }
    }, [isOpen, users]);
    
    // Auto-refresh users every 5 seconds when Admin Panel is open
    useEffect(() => {
        if (!isOpen) return;
        
        console.log('🔄 Setting up auto-refresh for user list...');
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing users...');
            refreshUsers();
        }, 5000); // Refresh every 5 seconds
        
        return () => {
            console.log('🔄 Cleaning up auto-refresh...');
            clearInterval(interval);
        };
    }, [isOpen, refreshUsers]);

    if (!isOpen) return null;

    // Show ALL users (including admins) in the admin panel
    const filteredUsers = users
        .filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const planOptions = Object.keys(PLAN_DETAILS) as UserPlan[];
    const currencyOptions: Currency[] = ['USD', 'EUR', 'INR'];
    const currencySymbols = { USD: '$', EUR: '€', INR: '₹' };

    const handleSaveStripe = async () => {
        setSavingStripe(true);
        setSavedStripe(false);
        await updatePaymentSettings('stripe', stripeKeys);
        setSavingStripe(false);
        setSavedStripe(true);
        setTimeout(() => setSavedStripe(false), 3000);
    };
    
    const handleSaveRazorpay = async () => {
        setSavingRazorpay(true);
        setSavedRazorpay(false);
        await updatePaymentSettings('razorpay', razorpayKeys);
        setSavingRazorpay(false);
        setSavedRazorpay(true);
        setTimeout(() => setSavedRazorpay(false), 3000);
    };
    
    const handleSavePrices = async () => {
        console.log('💾 Save Prices clicked');
        setSavingPrices(true);
        setSavedPrices(false);
        console.log('💾 Saving prices:', prices, 'currency:', selectedCurrency);
        await updatePlanPrices(prices, selectedCurrency);
        console.log('💾 Save completed');
        setSavingPrices(false);
        setSavedPrices(true);
        setTimeout(() => {
            console.log('💾 Resetting saved state');
            setSavedPrices(false);
        }, 3000);
    };
    
    const handleSaveGemini = async () => {
        setSavingGemini(true);
        setSavedGemini(false);
        await updateApiSettings('gemini', gemini);
        setSavingGemini(false);
        setSavedGemini(true);
        setTimeout(() => setSavedGemini(false), 3000);
    };
    
    const handlePlanChange = (userId: string, newPlan: UserPlan) => {
        setUserPlanChanges(prev => ({ ...prev, [userId]: newPlan }));
    };
    
    const handleSavePlan = async (userId: string) => {
        const newPlan = userPlanChanges[userId];
        if (!newPlan) return;
        
        console.log(`💾 Saving plan change: ${userId} → ${newPlan}`);
        setSavingPlan(userId);
        await updateUserPlan(userId, newPlan);
        
        // Refresh users to get latest data from database
        console.log('🔄 Refreshing users after plan change...');
        await refreshUsers();
        
        setSavingPlan(null);
        
        // Remove from pending changes
        setUserPlanChanges(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
        });
        
        console.log('✅ Plan change saved and users refreshed');
    };


    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-slide-up"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-zinc-925/70 backdrop-blur-2xl w-full max-w-5xl rounded-xl border border-white/10 shadow-glass p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <Shield size={20} className="text-emerald-400" />
                        Admin Panel
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors" aria-label="Close modal">
                        <X size={22} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-700 mb-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('users')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'users' ? 'text-white border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-white'}`}>User Management</button>
                    <button onClick={() => setActiveTab('payments')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'payments' ? 'text-white border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-white'}`}>Payments & Plans</button>
                    <button onClick={() => setActiveTab('integrations')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'integrations' ? 'text-white border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-white'}`}>Integrations</button>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {activeTab === 'users' && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="relative flex-1 max-w-sm">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                    <input 
                                        type="text"
                                        placeholder="Search by email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 pl-10 text-sm placeholder-zinc-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        console.log('🔄 Manual refresh clicked');
                                        console.log('📊 Current users in state:', users);
                                        refreshUsers();
                                    }}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <RefreshCw size={16} />
                                    Refresh ({users.length})
                                </button>
                            </div>
                            
                            {/* Debug info */}
                            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-xs text-blue-300">
                                <strong>Debug Info:</strong> Showing {filteredUsers.length} of {users.length} total users. 
                                {users.length === 0 && ' No users loaded from database.'}
                                {users.length === 1 && ' Only 1 user found. Have other users logged in?'}
                            </div>
                            <table className="w-full text-left text-sm table-fixed">
                                <thead className="border-b border-zinc-700 sticky top-0 bg-zinc-925/70 backdrop-blur-xl">
                                    <tr className="text-zinc-400">
                                        <th className="p-3 font-semibold w-[20%]">Email</th>
                                        <th className="p-3 font-semibold w-[8%]">Role</th>
                                        <th className="p-3 font-semibold w-[12%]">Current Plan</th>
                                        <th className="p-3 font-semibold w-[13%]">Monthly Usage</th>
                                        <th className="p-3 font-semibold w-[17%]">Daily Usage</th>
                                        <th className="p-3 font-semibold w-[15%]">Last Active</th>
                                        <th className="p-3 font-semibold w-[15%]">Change Plan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? filteredUsers.map(user => {
                                        const monthlyLimit = PLAN_DETAILS[user.plan].generations;
                                        const dailyImageLimit = PLAN_DETAILS[user.plan].dailyLimit || 'N/A';

                                        return (
                                            <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                                <td className="p-3 font-medium text-zinc-300 truncate" title={user.email}>{user.email}</td>
                                                <td className="p-3">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                                        user.role === 'admin' 
                                                            ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30' 
                                                            : 'bg-zinc-700 text-zinc-300'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-3 capitalize">{user.plan}</td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span>{user.generationsUsed} / {monthlyLimit}</span>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => resetUserUsage(user.id)}
                                                                className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition-colors"
                                                                title="Reset to 0"
                                                            >
                                                                <RotateCcw size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => doubleUserCredits(user.id)}
                                                                className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-yellow-400 transition-colors"
                                                                title="Double credits"
                                                            >
                                                                <Zap size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span>Images: {user.dailyGenerationsUsed} / {dailyImageLimit}</span>
                                                            <button
                                                                onClick={() => resetUserUsage(user.id)}
                                                                className="p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-emerald-400 transition-colors"
                                                                title="Reset daily usage"
                                                            >
                                                                <RotateCcw size={12} />
                                                            </button>
                                                        </div>
                                                        <p>Videos: {user.dailyVideosUsed} / 10</p>
                                                    </div>
                                                </td>
                                                <td className="p-3">{new Date(user.lastGenerationDate).toLocaleDateString()}</td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <select 
                                                            value={userPlanChanges[user.id] || user.plan} 
                                                            onChange={(e) => handlePlanChange(user.id, e.target.value as UserPlan)}
                                                            className="bg-zinc-800 border border-zinc-700 rounded-md p-1.5 capitalize focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 flex-1"
                                                            aria-label={`Change plan for ${user.email}`}
                                                        >
                                                            {planOptions.map(planKey => (
                                                                <option key={planKey} value={planKey} className="capitalize">{planKey}</option>
                                                            ))}
                                                        </select>
                                                        {userPlanChanges[user.id] && userPlanChanges[user.id] !== user.plan && (
                                                            <button
                                                                onClick={() => handleSavePlan(user.id)}
                                                                disabled={savingPlan === user.id}
                                                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition-all disabled:opacity-70 flex items-center gap-1 min-w-[60px] justify-center"
                                                            >
                                                                {savingPlan === user.id ? (
                                                                    <>
                                                                        <Loader2 size={12} className="animate-spin" />
                                                                        <span>...</span>
                                                                    </>
                                                                ) : (
                                                                    <span>Save</span>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={7} className="text-center p-6 text-zinc-500">No users found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'payments' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Payment Gateways Section */}
                            <section>
                                <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2"><CreditCard size={20} /> Payment Gateways</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Stripe */}
                                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-white/10 space-y-3">
                                        <h4 className="font-bold text-zinc-100">Stripe</h4>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-400">Publishable Key</label>
                                            <PasswordInput value={stripeKeys.publishableKey} onChange={(e) => setStripeKeys({...stripeKeys, publishableKey: e.target.value})} placeholder="pk_live_..." />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-400">Secret Key</label>
                                            <PasswordInput value={stripeKeys.secretKey} onChange={(e) => setStripeKeys({...stripeKeys, secretKey: e.target.value})} placeholder="sk_live_..." />
                                        </div>
                                        <button 
                                            onClick={handleSaveStripe} 
                                            disabled={savingStripe}
                                            className="w-full sm:w-auto text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px]"
                                        >
                                            {savingStripe && <Loader2 size={16} className="animate-spin" />}
                                            {savedStripe && <Check size={16} className="animate-bounce" />}
                                            {savingStripe ? 'Saving...' : savedStripe ? 'Saved!' : 'Save Stripe Keys'}
                                        </button>
                                    </div>
                                    {/* Razorpay */}
                                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-white/10 space-y-3">
                                        <h4 className="font-bold text-zinc-100">Razorpay</h4>
                                         <div className="space-y-1">
                                            <label className="text-xs text-zinc-400">Key ID</label>
                                            <PasswordInput value={razorpayKeys.publishableKey} onChange={(e) => setRazorpayKeys({...razorpayKeys, publishableKey: e.target.value})} placeholder="rzp_live_..." />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-400">Key Secret</label>
                                            <PasswordInput value={razorpayKeys.secretKey} onChange={(e) => setRazorpayKeys({...razorpayKeys, secretKey: e.target.value})} placeholder="Your secret key" />
                                        </div>
                                        <button 
                                            onClick={handleSaveRazorpay} 
                                            disabled={savingRazorpay}
                                            className="w-full sm:w-auto text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[180px]"
                                        >
                                            {savingRazorpay && <Loader2 size={16} className="animate-spin" />}
                                            {savedRazorpay && <Check size={16} className="animate-bounce" />}
                                            {savingRazorpay ? 'Saving...' : savedRazorpay ? 'Saved!' : 'Save Razorpay Keys'}
                                        </button>
                                    </div>
                                </div>
                            </section>

                             {/* Plan Pricing Section */}
                            <section>
                                <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2"><DollarSign size={20} /> Subscription Plan Pricing (INR)</h3>
                                <div className="p-4 bg-zinc-800/50 rounded-lg border border-white/10 space-y-4">
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-zinc-300 mb-2 block">Free Plan Price</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                                                <input type="number" value={prices.free} onChange={(e) => setPrices({...prices, free: parseFloat(e.target.value) || 0})} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 pl-8 text-sm placeholder-zinc-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-zinc-300 mb-2 block">Solo Plan Price</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                                                <input type="number" value={prices.solo} onChange={(e) => setPrices({...prices, solo: parseFloat(e.target.value) || 0})} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 pl-8 text-sm placeholder-zinc-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-zinc-300 mb-2 block">Studio Plan Price</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                                                <input type="number" value={prices.studio} onChange={(e) => setPrices({...prices, studio: parseFloat(e.target.value) || 0})} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 pl-8 text-sm placeholder-zinc-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-zinc-300 mb-2 block">Brand Plan Price</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                                                <input type="number" value={prices.brand} onChange={(e) => setPrices({...prices, brand: parseFloat(e.target.value) || 0})} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 pl-8 text-sm placeholder-zinc-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleSavePrices} 
                                        disabled={savingPrices}
                                        className="w-full sm:w-auto text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                                    >
                                        {savingPrices && <Loader2 size={16} className="animate-spin" />}
                                        {savedPrices && <Check size={16} className="animate-bounce" />}
                                        {savingPrices ? 'Saving...' : savedPrices ? 'Saved!' : 'Save Prices'}
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                    {activeTab === 'integrations' && (
                         <div className="space-y-8 animate-fade-in">
                            <div className="bg-blue-900/50 border border-blue-500/30 text-blue-300 text-sm rounded-lg p-3">
                                <strong>Info:</strong> Supabase credentials are configured via environment variables for security. Update them in your .env file or hosting platform settings.
                            </div>
                            <div className="bg-yellow-900/50 border border-yellow-500/30 text-yellow-300 text-sm rounded-lg p-3">
                                <strong>Note:</strong> Changes to Gemini API key take effect immediately. The cache refreshes automatically within 5 minutes or on the next API call.
                            </div>
                             <section>
                                <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2"><Link2 size={20} /> API Keys & Integrations</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Supabase Status */}
                                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-white/10 space-y-3">
                                        <h4 className="font-bold text-zinc-100">Supabase (Backend)</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs text-zinc-400">Status</label>
                                                <span className="text-xs font-semibold text-emerald-400">✓ Connected</span>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-400">Project URL</label>
                                                <input value={apiSettings.supabase.url} disabled className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-2 text-sm text-zinc-500 cursor-not-allowed" />
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-2">
                                                Configure in environment variables:<br/>
                                                <code className="bg-zinc-900 px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</code><br/>
                                                <code className="bg-zinc-900 px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>
                                            </p>
                                        </div>
                                    </div>
                                    {/* Gemini */}
                                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-white/10 space-y-3">
                                        <h4 className="font-bold text-zinc-100">Google Gemini</h4>
                                         <div className="space-y-1">
                                            <label className="text-xs text-zinc-400">Gemini API Key</label>
                                            <PasswordInput value={gemini.apiKey} onChange={(e) => setGemini({...gemini, apiKey: e.target.value})} placeholder="AIzaSy..." />
                                        </div>
                                        <button 
                                            onClick={handleSaveGemini} 
                                            disabled={savingGemini}
                                            className="w-full sm:w-auto text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px]"
                                        >
                                            {savingGemini && <Loader2 size={16} className="animate-spin" />}
                                            {savedGemini && <Check size={16} className="animate-bounce" />}
                                            {savingGemini ? 'Saving...' : savedGemini ? 'Saved!' : 'Save Gemini Key'}
                                        </button>
                                        <p className="text-xs text-zinc-500 mt-2">
                                            Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Google AI Studio</a>
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const ApiKeySelectorModal: React.FC = () => {
    const { isApiKeySelectorOpen, closeApiKeySelector, setHasSelectedApiKey, t } = useStudio();

    const handleSelectKey = async () => {
        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            // @ts-ignore
            await window.aistudio.openSelectKey();
            // Assume success to avoid race condition
            setHasSelectedApiKey(true); 
            closeApiKeySelector();
        }
    };

    if (!isApiKeySelectorOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-slide-up duration-300"
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-zinc-925/70 backdrop-blur-2xl w-full max-w-md rounded-xl border border-white/10 shadow-glass shadow-black/40 text-zinc-200 p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <Key size={20} className="text-emerald-400" />
                        Select API Key
                    </h2>
                    <button onClick={closeApiKeySelector} className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors" aria-label="Close modal">
                        <X size={22} />
                    </button>
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                    To generate videos with the Veo model, you need to select a personal API key. Video generation is a premium feature and usage will be billed to your Google Cloud project.
                </p>
                <p className="text-sm text-zinc-400 mb-6">
                    For more information, please see the{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">
                        billing documentation
                    </a>.
                </p>
                <button 
                    onClick={handleSelectKey}
                    className="w-full bg-brand-primary text-white font-semibold py-3 px-5 rounded-lg transition-all duration-300 shadow-button-glow-pro hover:shadow-button-glow-pro-hover bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] border border-emerald-400/50"
                >
                    Select Your API Key
                </button>
            </div>
        </div>
    );
};

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage, t } = useStudio();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Globe size={18} />
                <span className="hidden sm:inline text-sm font-medium uppercase">{language}</span>
                <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute left-0 lg:left-auto lg:right-0 mt-2 w-32 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-50 p-1 animate-fade-in duration-150">
                    <button
                        onClick={() => { setLanguage('en'); setIsOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${language === 'en' ? 'bg-emerald-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => { setLanguage('hinglish'); setIsOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${language === 'hinglish' ? 'bg-emerald-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                    >
                        Hinglish
                    </button>
                </div>
            )}
        </div>
    );
};


const UserMenu: React.FC = () => {
    const { user, logout, loading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { t } = useStudio();

    useEffect(() => {
        console.log('🔍 UserMenu - loading:', loading, '| user:', user?.email || 'none');
    }, [user, loading]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Show loading state
    if (loading) {
        console.log('📍 UserMenu: showing loading state');
        return (
            <div className="flex items-center gap-2 p-1.5">
                <div className="w-7 h-7 bg-zinc-700 rounded-full animate-pulse"></div>
            </div>
        );
    }

    // Show login button if not logged in
    if (!user) {
        console.log('📍 UserMenu: showing login button (no user)');
        return (
            <a 
                href="/login.html"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
            >
                Login
            </a>
        );
    }

    console.log('📍 UserMenu: showing user menu for', user.email);
    const dailyLimit = PLAN_DETAILS[user.plan].dailyLimit || 0;
    const dailyGenerationsPercentage = dailyLimit > 0 ? Math.min(100, (user.dailyGenerationsUsed / dailyLimit) * 100) : 0;
    const userInitial = user.email.charAt(0).toUpperCase();

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <div className="w-7 h-7 bg-zinc-700 rounded-full flex items-center justify-center text-emerald-300 font-bold text-sm border border-zinc-600">
                    {userInitial}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{user.email}</span>
                <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute left-0 lg:left-auto lg:right-0 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-50 p-4 animate-fade-in duration-150">
                    <div className="flex items-center gap-3 border-b border-zinc-700 pb-3 mb-3">
                         <div className="w-9 h-9 bg-zinc-700 rounded-full flex items-center justify-center text-emerald-300 font-bold text-base border border-zinc-600">
                            {userInitial}
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-zinc-200 truncate">{user.email}</p>
                            <p className="text-xs text-zinc-400 capitalize">{user.plan} Plan</p>
                        </div>
                    </div>
                    <div className="space-y-4 text-xs text-zinc-400">
                        <div>
                            <div className="flex justify-between">
                                <span>{t('daily_limit')}</span>
                                <span>{user.dailyGenerationsUsed} / {dailyLimit} {t('images')}</span>
                            </div>
                            <div className="w-full bg-zinc-700 rounded-full h-1.5 mt-1">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${dailyGenerationsPercentage}%` }}></div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                window.location.href = '/login.html';
                            }}
                            className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-md transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AppHeader: React.FC<{
    onInputsClick: () => void;
    onSettingsClick: () => void;
    onSwitchToSimple?: () => void;
}> = ({ onInputsClick, onSettingsClick, onSwitchToSimple }) => {
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const { t } = useStudio();
    const { user } = useAuth();

    return (
        <>
            <header className="relative flex-shrink-0 p-2 border-b border-white/10 flex items-center justify-between gap-4 bg-zinc-925/70 backdrop-blur-xl z-40 shadow-lg shadow-black/20">
                {/* --- LEFT GROUP --- */}
                <div className="flex items-center justify-start gap-2 lg:flex-1">
                    {/* Mobile Inputs Button */}
                    <button onClick={onInputsClick} className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800 lg:hidden" aria-label="Open inputs panel">
                        <PanelLeft size={20} />
                        <span className="font-medium text-sm hidden sm:inline">{t('inputs')}</span>
                    </button>
                    
                    {/* Moved Mobile Icons */}
                    <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
                        {onSwitchToSimple && (
                            <button 
                                onClick={onSwitchToSimple}
                                className="p-2 rounded-lg hover:bg-zinc-800" 
                                aria-label="Switch to Simple Mode"
                                title="Simple Mode"
                            >
                                <LayoutGrid size={20} className="text-zinc-400 hover:text-emerald-400" />
                            </button>
                        )}
                        <LanguageSwitcher />
                         {user?.role === 'admin' && (
                           <button onClick={() => setIsAdminPanelOpen(true)} className="p-2 rounded-lg hover:bg-zinc-800" aria-label="Open admin panel">
                               <Shield size={20} className="text-emerald-300" />
                           </button>
                        )}
                        <UserMenu />
                        <button onClick={onSettingsClick} className="p-2 rounded-lg hover:bg-zinc-800 flex items-center gap-2" aria-label="Open settings panel">
                            <span className="font-medium text-sm hidden sm:inline">{t('settings')}</span>
                            <PanelRight size={20} />
                        </button>
                    </div>

                    {/* Desktop Logo */}
                    <a href="/landing.html" className="hidden lg:flex items-center gap-2" aria-label="Go to home page">
                        <KLogo size={24} className="text-emerald-400" />
                        <h1 className="hidden md:block text-lg font-bold text-zinc-100">Klint Studios</h1>
                    </a>
                </div>

                {/* --- CENTER GROUP (Absolutely positioned on mobile) --- */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:left-auto lg:top-auto lg:translate-x-0 lg:translate-y-0 flex items-center gap-4">
                    {/* Desktop Switcher */}
                    <div className="hidden lg:flex justify-center items-center">
                        <StudioModeSwitcher />
                    </div>
                    <div id="generate-button-container">
                        <GenerateButton />
                    </div>
                </div>

                {/* --- RIGHT GROUP --- */}
                <div className="flex-1 items-center justify-end gap-2 sm:gap-3 hidden lg:flex">
                    {onSwitchToSimple && (
                        <button 
                            onClick={onSwitchToSimple}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-emerald-400 transition-colors whitespace-nowrap"
                            title="Switch to Simple Mode"
                        >
                            <LayoutGrid size={18} />
                            <span className="text-sm font-medium">Simple Mode</span>
                        </button>
                    )}
                     {user?.role === 'admin' && (
                        <button onClick={() => setIsAdminPanelOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-900/50 hover:bg-emerald-800/70 border border-emerald-500/30 text-emerald-300 transition-colors whitespace-nowrap">
                            <Shield size={18} />
                            <span className="text-sm font-medium">Admin Panel</span>
                        </button>
                    )}
                    <LanguageSwitcher />
                    <UserMenu />
                </div>
            </header>
            <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
            <AdminPanelModal isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />
        </>
    );
};


const AppContent: React.FC = () => {
    const { isGuideActive, isBestPracticesModalOpen, setBestPracticesModalOpen, t } = useStudio();
    const { user, needsPayment, checkSubscriptionStatus, logout } = useAuth();
    const [activeMobilePanel, setActiveMobilePanel] = useState<'inputs' | 'settings' | null>(null);
    const [isLgSettingsPanelOpen, setLgSettingsPanelOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
    const [isFeatureLocked, setIsFeatureLocked] = useState(false);
    const [hideFeatureLock, setHideFeatureLock] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [useSimplifiedUI, setUseSimplifiedUI] = useState(true); // Toggle for new simplified UI

    // Check subscription status when user logs in
    useEffect(() => {
        if (user && !hasCheckedSubscription) {
            console.log('🔍 Checking subscription status for user:', user.email);
            checkSubscriptionStatus();
            setHasCheckedSubscription(true);
        }
    }, [user, hasCheckedSubscription, checkSubscriptionStatus]);

    // Show payment modal reminder every 30 minutes for free users
    useEffect(() => {
        if (user && user.plan === 'free' && user.role !== 'admin' && user.role !== 'super_admin') {
            console.log('⏰ Setting up payment reminder for free user');
            
            // Show immediately on first login
            setIsPaymentModalOpen(true);
            
            // Then show every 30 minutes
            const interval = setInterval(() => {
                console.log('💳 Reminder: Payment modal for free user');
                setIsPaymentModalOpen(true);
            }, 1800000); // 30 minutes (30 * 60 * 1000)
            
            return () => clearInterval(interval);
        }
    }, [user]);

    // Feature lock interceptor - show payment modal when user tries to use features
    const handleFeatureAccess = () => {
        if (user && user.role === 'admin') {
            // Admin has full access
            return true;
        }
        
        if (needsPayment) {
            console.log('🔒 Feature locked - opening payment modal');
            setIsPaymentModalOpen(true);
            setIsFeatureLocked(false); // Allow closing for feature-lock scenario
            return false;
        }
        
        return true;
    };

    useEffect(() => {
        const isPanelOpen = activeMobilePanel !== null;
        if (isPanelOpen) {
            document.documentElement.classList.add('no-scroll');
            document.body.classList.add('no-scroll');
        } else {
            document.documentElement.classList.remove('no-scroll');
            document.body.classList.remove('no-scroll');
        }
        return () => {
             document.documentElement.classList.remove('no-scroll');
             document.body.classList.remove('no-scroll');
        }
    }, [activeMobilePanel]);

    // If user is logged in and simplified UI is enabled, show the new dashboard
    if (user && useSimplifiedUI) {
        return (
            <>
                <DashboardContainer
                    user={user}
                    onLogout={logout}
                    onOpenPayment={() => setIsPaymentModalOpen(true)}
                    onOpenAdmin={() => setIsAdminPanelOpen(true)}
                    onSwitchToAdvanced={() => setUseSimplifiedUI(false)}
                />

                {/* Payment Modal */}
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    canClose={user.plan !== 'free' || user.role === 'admin'}
                />

                {/* Admin Panel Modal */}
                <AdminPanelModal isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />
            </>
        );
    }

    return (
        <div className="bg-zinc-950 text-zinc-300 font-sans antialiased h-screen flex flex-col overflow-hidden">
            <AppHeader
                onInputsClick={() => setActiveMobilePanel('inputs')}
                onSettingsClick={() => setActiveMobilePanel('settings')}
                onSwitchToSimple={() => setUseSimplifiedUI(true)}
            />
            <main className="flex-grow flex-1 flex overflow-hidden relative">
                {/* Feature Lock Overlay - shown when:
                    1. User is not logged in (!user)
                    2. User hasn't paid (needsPayment) and is not admin
                */}
                {(!user || (user.role !== 'admin' && needsPayment)) && !hideFeatureLock && (
                    <FeatureLockOverlay 
                        isLocked={!user || needsPayment}
                        onUnlock={() => setIsPaymentModalOpen(true)}
                        onClose={() => {
                            // Hide the overlay so user can access menu and logout
                            setHideFeatureLock(true);
                            console.log('Feature lock hidden');
                        }}
                    />
                )}
                {/* --- DESKTOP INPUTS PANEL --- */}
                <aside className="w-[380px] flex-shrink-0 hidden lg:flex flex-col border-r border-white/10">
                    <InputPanel onClose={() => {}} />
                </aside>
                
                <section className="min-w-0 flex-1 flex flex-col p-3">
                    <StudioView />
                </section>
                
                {/* --- XL+ DESKTOP SETTINGS PANEL (PERMANENT) --- */}
                <aside className="w-[420px] flex-shrink-0 hidden xl:flex flex-col border-l border-white/10">
                    <SettingsPanel onClose={() => {}} />
                </aside>

                {/* --- NEW: LG-ONLY SLIDEOUT PANEL --- */}
                {/* Handle to open panel */}
                <div className="hidden lg:block xl:hidden absolute top-1/2 right-0 -translate-y-1/2 z-30 animate-peek-in">
                    <button
                        onClick={() => setLgSettingsPanelOpen(true)}
                        className="group w-8 h-28 flex flex-col items-center justify-center gap-1.5 py-2
                                   bg-zinc-850 hover:bg-zinc-700
                                   border-y border-l border-white/10
                                   rounded-l-lg shadow-lg
                                   transition-colors duration-200
                                   focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        aria-label="Open settings panel"
                    >
                        <PanelLeft size={16} className="text-zinc-400 group-hover:text-emerald-300 transition-colors duration-200"/>
                        <span
                            className="text-xs font-bold uppercase text-zinc-400 group-hover:text-emerald-300 transition-colors duration-200"
                            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                        >
                            {t('settings')}
                        </span>
                    </button>
                </div>

                {/* The Panel */}
                <div 
                    className={`
                        absolute top-0 right-0 h-full w-[420px] bg-zinc-925/90 backdrop-blur-xl border-l border-white/10 z-20 
                        transform transition-transform duration-300 ease-in-out 
                        lg:flex xl:hidden flex-col
                        ${isLgSettingsPanelOpen ? 'translate-x-0' : 'translate-x-full'}
                    `}
                >
                    <SettingsPanel onClose={() => setLgSettingsPanelOpen(false)} isMobileView={true} />
                </div>
            </main>

            {/* --- MOBILE FULL-SCREEN PANELS --- */}
            <div className={`fixed inset-0 z-50 bg-zinc-950 transform transition-transform duration-300 ease-in-out lg:hidden ${activeMobilePanel === 'inputs' ? 'translate-x-0' : '-translate-x-full'}`}>
                <InputPanel onClose={() => setActiveMobilePanel(null)} isMobileView={true} />
            </div>

            <div className={`fixed inset-0 z-50 bg-zinc-950 transform transition-transform duration-300 ease-in-out lg:hidden ${activeMobilePanel === 'settings' ? 'translate-x-0' : 'translate-x-full'}`}>
                 <SettingsPanel onClose={() => setActiveMobilePanel(null)} isMobileView={true} />
            </div>

            {isGuideActive && <InteractiveGuide />}
            <BestPracticesModal isOpen={isBestPracticesModalOpen} onClose={() => setBestPracticesModalOpen(false)} />
            <PaymentModal 
                isOpen={isPaymentModalOpen} 
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setIsFeatureLocked(false);
                    // Re-check subscription status after modal closes
                    checkSubscriptionStatus();
                }} 
                isFirstLogin={isFeatureLocked}
                canClose={!isFeatureLocked}
            />
            <ApiKeySelectorModal />
            <Chatbot />
        </div>
    );
};

const App: React.FC = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;