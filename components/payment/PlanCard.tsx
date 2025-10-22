import React from 'react';
import { Check, Zap } from 'lucide-react';
import type { PlanPricing } from '../../types/payment';

interface PlanCardProps {
  plan: PlanPricing;
  isPopular?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isPopular = false,
  isSelected = false,
  onSelect,
  isLoading = false,
}) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className={`
        relative bg-zinc-900 rounded-xl p-6 border-2 transition-all
        ${isPopular ? 'border-emerald-500 shadow-glow-lg' : 'border-zinc-800'}
        ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-950' : ''}
        hover:border-emerald-500/50 hover:shadow-lg
      `}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Zap size={12} className="fill-current" />
            RECOMMENDED
          </div>
        </div>
      )}

      {/* Plan Name */}
      <h3 className="text-2xl font-bold text-white capitalize mb-2">
        {plan.plan}
      </h3>

      {/* Price */}
      <div className="mb-4">
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-white">
              {formatPrice(plan.baseAmount)}
            </p>
            <p className="text-zinc-400">/year</p>
          </div>
          <div className="mt-2 text-sm space-y-1">
            <p className="text-zinc-400">
              Base: {formatPrice(plan.baseAmount)}
            </p>
            <p className="text-zinc-400">
              + GST (18%): {formatPrice(plan.gstAmount)}
            </p>
            <div className="border-t border-zinc-700 pt-1 mt-1">
              <p className="text-emerald-400 font-semibold">
                Total: {formatPrice(plan.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-zinc-300">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Select Button */}
      <button
        onClick={onSelect}
        disabled={isLoading}
        className={`
          w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
          ${isPopular
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          `Get ${plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1)}`
        )}
      </button>

      {/* Annual Note */}
      <p className="text-xs text-center text-zinc-500 mt-3">
        ₹{plan.totalAmount.toLocaleString('en-IN')}/year • Billed annually
      </p>
    </div>
  );
};
