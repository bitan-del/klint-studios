import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, AlertTriangle, CheckCircle, XCircle, Mail } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { Subscription } from '../../types/payment';
import { PLAN_PRICING } from '../../types/payment';

export const SubscriptionSettings: React.FC = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading subscription:', error);
        setSubscription(null);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error in loadSubscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription || !user) return;

    setCancelling(true);
    try {
      // Update subscription status to cancelled
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          auto_renew: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) {
        console.error('Error cancelling subscription:', error);
        alert('Failed to cancel subscription. Please contact support.');
        return;
      }

      // Reload subscription
      await loadSubscription();
      setShowCancelConfirm(false);
      alert('Subscription cancelled successfully. You can continue using the service until your trial/subscription ends.');
    } catch (error) {
      console.error('Error in handleCancelSubscription:', error);
      alert('An error occurred. Please try again or contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!subscription) return 0;
    
    const endDate = subscription.status === 'trial' && subscription.trial_end_date
      ? new Date(subscription.trial_end_date)
      : new Date(subscription.end_date);
    
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const planDetails = subscription ? PLAN_PRICING[subscription.plan] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-800">
        <p className="text-zinc-400">No active subscription found.</p>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();
  const isTrial = subscription.status === 'trial';
  const isActive = subscription.status === 'active';
  const isCancelled = subscription.status === 'cancelled';

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Subscription Status</h3>
          <div className={`
            px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2
            ${isTrial ? 'bg-blue-500/20 text-blue-400' : ''}
            ${isActive ? 'bg-emerald-500/20 text-emerald-400' : ''}
            ${isCancelled ? 'bg-red-500/20 text-red-400' : ''}
            ${subscription.status === 'expired' ? 'bg-zinc-500/20 text-zinc-400' : ''}
          `}>
            {isTrial && <Calendar size={16} />}
            {isActive && <CheckCircle size={16} />}
            {isCancelled && <XCircle size={16} />}
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Plan:</span>
            <span className="text-white font-semibold capitalize">{subscription.plan}</span>
          </div>
          
          {isTrial && subscription.trial_end_date && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Trial Ends:</span>
              <span className="text-white font-semibold">
                {formatDate(subscription.trial_end_date)}
                {daysRemaining > 0 && (
                  <span className="text-blue-400 ml-2">({daysRemaining} days left)</span>
                )}
              </span>
            </div>
          )}

          {(isActive || isCancelled) && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Started:</span>
                <span className="text-white">{formatDate(subscription.start_date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Renews On:</span>
                <span className="text-white">
                  {formatDate(subscription.end_date)}
                  {!isCancelled && daysRemaining > 0 && (
                    <span className="text-emerald-400 ml-2">({daysRemaining} days)</span>
                  )}
                </span>
              </div>
            </>
          )}

          {planDetails && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Price:</span>
              <span className="text-white font-semibold">
                ₹{planDetails.totalAmount.toLocaleString('en-IN')}/year
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Auto-Renewal:</span>
            <span className={subscription.auto_renew ? 'text-emerald-400' : 'text-zinc-400'}>
              {subscription.auto_renew ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Trial Warning */}
        {isTrial && daysRemaining > 0 && !isCancelled && (
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-semibold text-sm">Free Trial Active</p>
                <p className="text-blue-200 text-xs mt-1">
                  Your card will be charged ₹{planDetails?.totalAmount.toLocaleString('en-IN')} in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} unless you cancel before {formatDate(subscription.trial_end_date!)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Notice */}
        {isCancelled && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">
              Your subscription has been cancelled. You can continue using the service until {formatDate(subscription.end_date)}.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isCancelled && (isActive || isTrial) && (
        <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-800">
          <h3 className="text-lg font-semibold text-white mb-4">Manage Subscription</h3>
          
          {/* Upgrade Options */}
          <div className="mb-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-semibold text-sm">Want to Upgrade?</p>
                <p className="text-amber-200 text-xs mt-1">
                  Contact us at <a href="mailto:support@klintstudios.com" className="underline hover:text-amber-100">support@klintstudios.com</a> to upgrade to Studio or Brand plan. We'll calculate the pro-rated difference and upgrade your account.
                </p>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-all"
            >
              Cancel Subscription
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 font-semibold text-sm mb-2">Are you sure?</p>
                <p className="text-red-200 text-xs">
                  {isTrial 
                    ? 'You will lose access to all features after your trial ends and won\'t be charged.'
                    : `You'll continue to have access until ${formatDate(subscription.end_date)}, but won't be charged again.`
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 px-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold transition-all"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};




