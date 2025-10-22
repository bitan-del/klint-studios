import React from 'react';
import { Check, Download, Sparkles } from 'lucide-react';
import { generateInvoice } from '../../utils/invoiceGenerator';
import { useAuth } from '../../context/AuthContext';

interface PaymentSuccessProps {
  plan: 'free' | 'solo' | 'studio' | 'brand';
  subscriptionId: string;
  paymentId: string;
  onClose: () => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  plan,
  subscriptionId,
  paymentId,
  onClose,
}) => {
  const { user, checkSubscriptionStatus } = useAuth();
  const [isGeneratingInvoice, setIsGeneratingInvoice] = React.useState(false);

  const isFree = plan === 'free';

  const handleClose = async () => {
    // Refresh subscription status one more time before closing
    console.log('🔄 Final subscription status refresh before closing...');
    await checkSubscriptionStatus();
    onClose();
  };

  const handleDownloadInvoice = async () => {
    if (!user || isFree) return;

    setIsGeneratingInvoice(true);
    try {
      await generateInvoice(paymentId, user.email);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again or contact support.');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl max-w-lg w-full p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
          <Check size={40} className="text-emerald-500 relative z-10" />
        </div>

        {/* Success Message */}
        <h2 className="text-3xl font-bold text-white mb-3">
          Payment Successful!
        </h2>
        <p className="text-zinc-400 mb-6">
          Welcome to the {plan.charAt(0).toUpperCase() + plan.slice(1)} plan! Your subscription is now active.
        </p>

        {/* Plan Details */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles size={20} className="text-emerald-500" />
            <span className="text-emerald-400 font-semibold text-lg capitalize">
              {plan} Plan
            </span>
          </div>
          <div className="space-y-2 text-sm text-zinc-300">
            <p>✓ Annual subscription activated</p>
            <p>✓ Auto-renews in 1 year</p>
            <p>✓ GST invoice available</p>
          </div>
        </div>

        {/* Download Invoice Button (for paid plans) */}
        {!isFree && (
          <button
            onClick={handleDownloadInvoice}
            disabled={isGeneratingInvoice}
            className="w-full mb-4 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition-all border border-zinc-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingInvoice ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Invoice...
              </>
            ) : (
              <>
                <Download size={18} />
                Download GST Invoice
              </>
            )}
          </button>
        )}

        {/* Continue Button */}
        <button
          onClick={handleClose}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-all"
        >
          Start Creating
        </button>

        {/* Additional Info */}
        <p className="text-xs text-zinc-500 mt-4">
          You can view and download your invoice anytime from your account settings.
        </p>
      </div>
    </div>
  );
};




