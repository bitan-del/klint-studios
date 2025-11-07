import React, { useState } from 'react';
import { DashboardHome } from './DashboardHome';
import { SimplifiedWorkflow } from './SimplifiedWorkflow';
import { StoryboardWorkflow } from './StoryboardWorkflow';
import { SocialMediaPostsWorkflow } from './SocialMediaPostsWorkflow';
import { User, Settings, LogOut, CreditCard, Menu, X, Layers, Zap, Lock } from 'lucide-react';
import { KLogo } from '../shared/KLogo';
import { Footer } from '../shared/Footer';
import type { User as UserType } from '../../types';

interface DashboardContainerProps {
    user: UserType;
    onLogout: () => void;
    onOpenPayment: () => void;
    onOpenDailyLimitModal?: () => void;
    onOpenAdmin?: () => void;
    onSwitchToAdvanced?: () => void;
}

export const DashboardContainer: React.FC<DashboardContainerProps> = ({
    user,
    onLogout,
    onOpenPayment,
    onOpenDailyLimitModal,
    onOpenAdmin,
    onSwitchToAdvanced,
}) => {
    const [currentWorkflow, setCurrentWorkflow] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleSelectWorkflow = (workflowId: string) => {
        setCurrentWorkflow(workflowId);
    };

    const handleBackToDashboard = () => {
        setCurrentWorkflow(null);
    };

    // Check if user has access to Advanced Mode (only ADVANCE plan)
    // BASIC (solo) and PRO (studio) plans are locked out
    const userPlan = user?.plan || 'free';
    const hasAdvancedModeAccess = userPlan === 'brand' || user?.role === 'admin' || user?.role === 'super_admin';
    
    // Debug log to verify plan
    console.log('🔍 User plan:', userPlan, 'hasAdvancedModeAccess:', hasAdvancedModeAccess, 'Full user:', user);
    
    const handleAdvancedModeClick = () => {
        if (!hasAdvancedModeAccess) {
            // Show payment modal for locked feature
            console.log('🔒 Advanced Mode is locked for plan:', user?.plan);
            onOpenPayment();
        } else if (onSwitchToAdvanced) {
            onSwitchToAdvanced();
        }
    };

    const getPlanBadge = () => {
        const plan = user.plan;
        const colors = {
            free: 'bg-zinc-700 text-zinc-300',
            solo: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50',
            studio: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50',
            brand: 'bg-purple-500/20 text-purple-400 border border-purple-500/50',
        };

        // Map plan to display name
        const planDisplayName = plan === 'solo' ? 'BASIC' : plan === 'studio' ? 'PRO' : plan === 'brand' ? 'ADVANCE' : plan.toUpperCase();

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[plan] || colors.free}`}>
                {planDisplayName}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Glassmorphic Navigation Bar */}
            <nav className="relative z-50 sticky top-0 px-6 lg:px-12 py-4">
                <div className="flex justify-center">
                    {/* Glassmorphic container with rounded pill shape */}
                    <div className="relative border border-white/20 bg-zinc-800 shadow-xl rounded-full px-8 py-2.5 inline-flex">
                        <div className="relative flex items-center gap-8">
                            {/* Logo */}
                            <div className="flex items-center gap-2 cursor-pointer group" onClick={handleBackToDashboard}>
                                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg transition-all">
                                    <KLogo className="text-white" size={18} />
                                </div>
                                <h1 className="text-base font-bold text-white tracking-tight">Klint Studios</h1>
                            </div>

                            {/* Center Navigation */}
                            <div className="hidden lg:flex items-center gap-1">
                                <button
                                    onClick={onOpenPayment}
                                    className="px-4 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    Pricing
                                </button>
                                {onSwitchToAdvanced && (
                                    <button
                                        onClick={handleAdvancedModeClick}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 relative ${
                                            hasAdvancedModeAccess
                                                ? 'text-white/70 hover:text-white hover:bg-white/5'
                                                : 'text-zinc-500/50 hover:text-zinc-400 opacity-40 cursor-pointer border border-amber-500/30 bg-zinc-800/50'
                                        }`}
                                        title={!hasAdvancedModeAccess ? 'Upgrade to ADVANCE plan to unlock Advanced Mode' : 'Switch to Advanced Mode'}
                                    >
                                        {!hasAdvancedModeAccess ? (
                                            <>
                                                <Lock className="w-4 h-4 text-amber-500 mr-0.5" />
                                                <Layers className="w-4 h-4 opacity-30" />
                                                <span className="line-through decoration-2">Advanced Mode</span>
                                            </>
                                        ) : (
                                            <>
                                                <Layers className="w-4 h-4" />
                                                <span>Advanced Mode</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Right Side: User Menu (only shown when logged in) */}
                            <div className="hidden md:flex items-center">
                                {/* User Avatar with Dropdown */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg transition-all"
                                        title={user.email}
                                    >
                                        {user.email?.[0]?.toUpperCase() || 'U'}
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showUserMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                                            <div className="absolute right-0 mt-2 w-64 bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-2xl z-50">
                                                <div className="p-4 border-b border-white/10">
                                                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                        {getPlanBadge()}
                                                        {user.plan === 'solo' && (
                                                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full text-xs font-semibold">
                                                                100 creations a day
                                                            </span>
                                                        )}
                                                        {(user.plan === 'studio' || user.plan === 'brand') && (
                                                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full text-xs font-semibold">
                                                                Unlimited Usage
                                                            </span>
                                                        )}
                                                    </div>
                                                    {user.plan === 'free' && (
                                                        <p className="text-xs text-white/40 mt-2">
                                                            {user.dailyGenerationsUsed || 0} / 5 generations used today
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="p-2">
                                                    {onSwitchToAdvanced && (
                                                        <button
                                                            onClick={() => { 
                                                                if (hasAdvancedModeAccess) {
                                                                    onSwitchToAdvanced();
                                                                } else {
                                                                    onOpenPayment();
                                                                }
                                                                setShowUserMenu(false);
                                                            }}
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg transition-colors ${
                                                                hasAdvancedModeAccess
                                                                    ? 'hover:bg-white/5 text-white/80'
                                                                    : 'text-zinc-500/50 hover:text-zinc-400 opacity-40 border border-amber-500/30 bg-zinc-800/50'
                                                            }`}
                                                            title={!hasAdvancedModeAccess ? 'Upgrade to ADVANCE plan to unlock Advanced Mode' : 'Switch to Advanced Mode'}
                                                        >
                                                            {!hasAdvancedModeAccess ? (
                                                                <>
                                                                    <Lock className="w-4 h-4 text-amber-500" />
                                                                    <Layers className="w-4 h-4 opacity-30" />
                                                                    <span className="line-through decoration-2">Advanced Mode</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Layers className="w-4 h-4" />
                                                                    <span>Advanced Mode</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    
                                                    {user.plan === 'free' && (
                                                        <button
                                                            onClick={() => { onOpenPayment(); setShowUserMenu(false); }}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-white/5 rounded-lg transition-colors text-white/80"
                                                        >
                                                            <CreditCard className="w-4 h-4" />
                                                            Upgrade Plan
                                                        </button>
                                                    )}
                                                    
                                                    {(user.role === 'admin' || user.role === 'super_admin') && onOpenAdmin && (
                                                        <button
                                                            onClick={() => { onOpenAdmin(); setShowUserMenu(false); }}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-white/5 rounded-lg transition-colors text-white/80"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                            Admin Panel
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        onClick={() => { onLogout(); setShowUserMenu(false); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-white/5 rounded-lg transition-colors text-red-400"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Logout
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                        {/* Mobile: Hamburger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        </div>
                    </div>

                    {/* Mobile Menu - Outside the rounded pill */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden mt-4 pt-4 border-t border-zinc-800 px-6">
                            <div className="space-y-2">
                                <div className="px-3 py-2 bg-zinc-800 rounded-lg">
                                    <p className="text-sm font-medium">{user.email}</p>
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                        {getPlanBadge()}
                                        {user.plan === 'solo' && (
                                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full text-xs font-semibold">
                                                100 creations a day
                                            </span>
                                        )}
                                        {(user.plan === 'studio' || user.plan === 'brand') && (
                                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full text-xs font-semibold">
                                                Unlimited Usage
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {onSwitchToAdvanced && (
                                    <button
                                        onClick={() => { 
                                            if (hasAdvancedModeAccess) {
                                                onSwitchToAdvanced();
                                            } else {
                                                onOpenPayment();
                                            }
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg transition-colors ${
                                            hasAdvancedModeAccess
                                                ? 'hover:bg-zinc-800'
                                                : 'text-zinc-500/50 hover:text-zinc-400 opacity-40 border border-amber-500/30 bg-zinc-800/50'
                                        }`}
                                        title={!hasAdvancedModeAccess ? 'Upgrade to ADVANCE plan to unlock Advanced Mode' : 'Switch to Advanced Mode'}
                                    >
                                        {!hasAdvancedModeAccess ? (
                                            <>
                                                <Lock className="w-4 h-4 text-amber-500" />
                                                <Layers className="w-4 h-4 opacity-30" />
                                                <span className="line-through decoration-2">Advanced Mode</span>
                                            </>
                                        ) : (
                                            <>
                                                <Layers className="w-4 h-4" />
                                                <span>Advanced Mode</span>
                                            </>
                                        )}
                                    </button>
                                )}
                                
                                {user.plan === 'free' && (
                                    <>
                                        <div className="px-3 py-2 bg-zinc-800 rounded-lg text-sm">
                                            <span className="text-zinc-400">Daily: </span>
                                            <span className="text-zinc-100 font-semibold">
                                                {user.dailyGenerationsUsed || 0} / 5
                                            </span>
                                        </div>
                                        <button
                                            onClick={onOpenPayment}
                                            className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-semibold"
                                        >
                                            Upgrade Plan
                                        </button>
                                    </>
                                )}
                                
                                {(user.role === 'admin' || user.role === 'super_admin') && onOpenAdmin && (
                                    <button
                                        onClick={onOpenAdmin}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Admin Panel
                                    </button>
                                )}
                                
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-zinc-800 rounded-lg transition-colors text-red-400"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Free Plan Banner */}
            {user.plan === 'free' && (
                <div className="px-6 lg:px-12 pt-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <Zap className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        Free Plan: <span className="text-emerald-400">{user.dailyGenerationsUsed || 0}/5</span> generations used today
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        Upgrade to unlock unlimited generations and premium features
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onOpenPayment}
                                className="hidden sm:block px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm rounded-lg transition-colors"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0">
                {currentWorkflow ? (
                    currentWorkflow === 'storyboard' ? (
                        <StoryboardWorkflow onBack={handleBackToDashboard} />
                    ) : currentWorkflow === 'social-media-posts' ? (
                        <SocialMediaPostsWorkflow onBack={handleBackToDashboard} onOpenDailyLimitModal={onOpenDailyLimitModal} />
                    ) : (
                        <SimplifiedWorkflow
                            workflowId={currentWorkflow}
                            onOpenDailyLimitModal={onOpenDailyLimitModal}
                            onBack={handleBackToDashboard}
                        />
                    )
                ) : (
                    <DashboardHome
                        onSelectWorkflow={handleSelectWorkflow}
                        userPlan={user.plan}
                    />
                )}
                
                {/* Footer */}
                <Footer />
            </div>
        </div>
    );
};

