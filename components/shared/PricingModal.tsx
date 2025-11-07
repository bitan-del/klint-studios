

import React from 'react';
import { X, DollarSign, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { PlanPrices, Currency } from '../../types';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PlanFeature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start gap-3">
        <Check size={18} className="text-emerald-400 flex-shrink-0 mt-1" />
        <span className="text-zinc-300">{children}</span>
    </li>
);

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
    // Try to get auth context, but provide defaults if not available (e.g., on login page)
    let planPrices: PlanPrices | undefined;
    let currency: Currency = 'INR';
    let isLoggedIn = false;
    
    try {
        const auth = useAuth();
        planPrices = auth.planPrices;
        currency = auth.currency;
        isLoggedIn = !!auth.user;
    } catch (e) {
        // Not in AuthProvider context (e.g., login page), use defaults
        planPrices = {
            solo: 999,
            studio: 2999,
            brand: 4999,
        };
    }
    
    if (!isOpen) return null;
    
    // Currency symbol
    const currencySymbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$';
    
    // Calculate GST (18%) and totals
    const calculatePricing = (basePrice: number) => {
        const gst = Math.round(basePrice * 0.18 * 100) / 100;
        const total = Math.round((basePrice + gst) * 100) / 100;
        return { base: basePrice, gst, total };
    };
    
    const soloPricing = calculatePricing(planPrices.solo);
    const studioPricing = calculatePricing(planPrices.studio);
    const brandPricing = calculatePricing(planPrices.brand);

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-slide-up duration-300"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-zinc-925/70 backdrop-blur-2xl w-full max-w-5xl rounded-xl border border-white/10 shadow-glass shadow-black/40 text-zinc-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
                        <p className="text-sm text-zinc-400 mt-1">Select a plan to unlock all features</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors" aria-label="Close pricing modal">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
                    {/* Sale Banner */}
                    <div className="mb-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-4 text-center">
                        <p className="text-sm text-emerald-300 font-semibold">
                            🎉 Special Offer: 1 Year Plans Available During Black Friday, Cyber Monday & Boxing Day Sales!
                        </p>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* BASIC Plan */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col">
                            <h3 className="text-2xl font-bold text-white mb-6">BASIC</h3>
                            
                            <div className="mb-4">
                                <div className="text-5xl font-bold text-white mb-2">
                                    {currencySymbol}{soloPricing.base.toLocaleString('en-IN')}
                                    <span className="text-lg font-normal text-zinc-400"> /3 months</span>
                                </div>
                                <div className="text-sm text-zinc-400 space-y-1">
                                    <div>Base: {currencySymbol}{soloPricing.base.toLocaleString('en-IN')}</div>
                                    <div>+ GST (18%): {currencySymbol}{soloPricing.gst.toLocaleString('en-IN')}</div>
                                </div>
                                <div className="text-lg font-semibold text-emerald-400 mt-2">
                                    Total: {currencySymbol}{soloPricing.total.toLocaleString('en-IN')}
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6 flex-grow text-sm">
                                <PlanFeature>AI Photoshoot</PlanFeature>
                                <PlanFeature>Product Photography</PlanFeature>
                                <PlanFeature>Photo to Prompt</PlanFeature>
                                <PlanFeature>Social Media Posts</PlanFeature>
                                <PlanFeature>100 images daily</PlanFeature>
                            </ul>

                            <button 
                                onClick={() => { if (!isLoggedIn) window.location.href = '/login.html' }}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl transition-colors"
                            >
                                {isLoggedIn ? 'Get BASIC' : 'Login to Purchase'}
                            </button>
                            
                            <div className="text-center text-xs text-zinc-500 mt-3">
                                {currencySymbol}{soloPricing.total.toLocaleString('en-IN')}/3 months • Billed quarterly
                            </div>
                        </div>

                        {/* PRO Plan (Recommended) */}
                        <div className="relative bg-zinc-900/50 border-2 border-emerald-500 rounded-2xl p-6 flex flex-col">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                                    ⚡ RECOMMENDED
                                </span>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-white mb-6">PRO</h3>
                            
                            <div className="mb-4">
                                <div className="text-5xl font-bold text-white mb-2">
                                    {currencySymbol}{studioPricing.base.toLocaleString('en-IN')}
                                    <span className="text-lg font-normal text-zinc-400"> /3 months</span>
                                </div>
                                <div className="text-sm text-zinc-400 space-y-1">
                                    <div>Base: {currencySymbol}{studioPricing.base.toLocaleString('en-IN')}</div>
                                    <div>+ GST (18%): {currencySymbol}{studioPricing.gst.toLocaleString('en-IN')}</div>
                                </div>
                                <div className="text-lg font-semibold text-emerald-400 mt-2">
                                    Total: {currencySymbol}{studioPricing.total.toLocaleString('en-IN')}
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6 flex-grow text-sm">
                                <PlanFeature>AI Photoshoot</PlanFeature>
                                <PlanFeature>Product Photography</PlanFeature>
                                <PlanFeature>Virtual Try-On</PlanFeature>
                                <PlanFeature>Photo Editor</PlanFeature>
                                <PlanFeature>Photo to Prompt</PlanFeature>
                                <PlanFeature>Social Media Posts</PlanFeature>
                                <PlanFeature>Style Transfer</PlanFeature>
                                <PlanFeature>Image Upscale</PlanFeature>
                                <PlanFeature>Unlimited daily use</PlanFeature>
                            </ul>

                            <button 
                                onClick={() => { if (!isLoggedIn) window.location.href = '/login.html' }}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors"
                            >
                                {isLoggedIn ? 'Get PRO' : 'Login to Purchase'}
                            </button>
                            
                            <div className="text-center text-xs text-zinc-500 mt-3">
                                {currencySymbol}{studioPricing.total.toLocaleString('en-IN')}/3 months • Billed quarterly
                            </div>
                        </div>

                        {/* ADVANCE Plan */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col">
                            <h3 className="text-2xl font-bold text-white mb-6">ADVANCE</h3>
                            
                            <div className="mb-4">
                                <div className="text-5xl font-bold text-white mb-2">
                                    {currencySymbol}{brandPricing.base.toLocaleString('en-IN')}
                                    <span className="text-lg font-normal text-zinc-400"> /3 months</span>
                                </div>
                                <div className="text-sm text-zinc-400 space-y-1">
                                    <div>Base: {currencySymbol}{brandPricing.base.toLocaleString('en-IN')}</div>
                                    <div>+ GST (18%): {currencySymbol}{brandPricing.gst.toLocaleString('en-IN')}</div>
                                </div>
                                <div className="text-lg font-semibold text-emerald-400 mt-2">
                                    Total: {currencySymbol}{brandPricing.total.toLocaleString('en-IN')}
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6 flex-grow text-sm">
                                <PlanFeature>Everything in PRO</PlanFeature>
                                <PlanFeature>Advance Mode</PlanFeature>
                                <PlanFeature>All features unlocked</PlanFeature>
                                <PlanFeature>Unlimited daily use</PlanFeature>
                            </ul>

                            <button 
                                onClick={() => { if (!isLoggedIn) window.location.href = '/login.html' }}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl transition-colors"
                            >
                                {isLoggedIn ? 'Get ADVANCE' : 'Login to Purchase'}
                            </button>
                            
                            <div className="text-center text-xs text-zinc-500 mt-3">
                                {currencySymbol}{brandPricing.total.toLocaleString('en-IN')}/3 months • Billed quarterly
                            </div>
                        </div>
                    </div>

                    {/* Cost & Value Analysis Section */}
                    <div className="mt-8 pt-8 text-center border-t border-zinc-800">
                        <h4 className="font-semibold text-lg text-white mb-3">Cost & Value Analysis</h4>
                        <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            Our pricing provides exceptional value powered by our own proprietary image model, specifically trained to create content that wins on social media. Each generation is optimized for engagement, virality, and brand storytelling. These are 3-month subscriptions with unlimited daily use. Our plans include premium features and a streamlined workflow to maximize your creative impact and return on investment. Special 1-year plans available during Black Friday, Cyber Monday, and Boxing Day sales!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};