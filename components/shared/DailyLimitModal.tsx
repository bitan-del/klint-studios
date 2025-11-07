import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Zap, CreditCard } from 'lucide-react';
import { PLAN_DETAILS, getPlanDisplayName } from '../../services/permissionsService';
import type { UserPlan } from '../../types';

interface DailyLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
    userPlan: UserPlan;
    dailyGenerationsUsed: number;
}

export const DailyLimitModal: React.FC<DailyLimitModalProps> = ({ 
    isOpen, 
    onClose, 
    onUpgrade,
    userPlan,
    dailyGenerationsUsed 
}) => {
    if (!isOpen) return null;

    const planDetails = PLAN_DETAILS[userPlan];
    const dailyLimit = planDetails.dailyLimit || 0;
    const planDisplayName = getPlanDisplayName(userPlan);

    const modalContent = (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-zinc-925/95 backdrop-blur-2xl w-full max-w-md rounded-xl border border-white/10 shadow-2xl shadow-black/40 text-zinc-200 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors z-10"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="p-6">
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-amber-500/20 rounded-full">
                            <AlertCircle className="w-8 h-8 text-amber-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white text-center mb-2">
                        Daily Limit Reached
                    </h2>

                    {/* Message */}
                    <p className="text-zinc-400 text-center mb-6">
                        You've used all <span className="text-emerald-400 font-semibold">{dailyLimit}</span> creations for today on your <span className="text-emerald-400 font-semibold">{planDisplayName}</span> plan.
                    </p>

                    {/* Usage Info */}
                    <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 border border-zinc-700">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-zinc-400">Today's Usage</span>
                            <span className="text-sm font-semibold text-white">
                                {dailyGenerationsUsed} / {dailyLimit}
                            </span>
                        </div>
                        <div className="w-full bg-zinc-700 rounded-full h-2">
                            <div 
                                className="bg-amber-500 h-2 rounded-full transition-all"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Upgrade Message */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-emerald-300 mb-1">
                                    Upgrade for Unlimited Daily Usage
                                </p>
                                <p className="text-xs text-zinc-400">
                                    {userPlan === 'free' 
                                        ? 'Upgrade to BASIC plan for 100 creations per day, or PRO/ADVANCE for unlimited daily usage.'
                                        : 'Upgrade to PRO or ADVANCE plan for unlimited daily usage.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                onUpgrade();
                                onClose();
                            }}
                            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <CreditCard size={18} />
                            Upgrade Plan
                        </button>
                    </div>

                    {/* Note */}
                    <p className="text-xs text-zinc-500 text-center mt-4">
                        Your daily limit will reset tomorrow
                    </p>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};


