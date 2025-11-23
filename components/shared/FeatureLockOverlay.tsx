import React from 'react';
import { Lock, X, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FeatureLockOverlayProps {
  isLocked: boolean;
  onUnlock: () => void;
  onClose: () => void;
}

export const FeatureLockOverlay: React.FC<FeatureLockOverlayProps> = ({
  isLocked,
  onUnlock,
  onClose,
}) => {
  const { user, logout } = useAuth();

  if (!isLocked) return null;

  const isLoggedOut = !user;

  const handleLogout = async () => {
    await logout();
  };

  const handleLogin = () => {
    // Redirect to login page
    window.location.href = '/login.html';
  };

  return (
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the card
        if (e.target === e.currentTarget && !isLoggedOut) {
          onUnlock();
        }
      }}
    >
      <div className="relative text-center p-8 bg-zinc-900/90 rounded-2xl border-2 border-emerald-500/50 shadow-2xl max-w-md mx-4">
        {/* Close Button - only show if user is logged in */}
        {!isLoggedOut && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close overlay"
          >
            <X size={24} />
          </button>
        )}

        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={32} className="text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {isLoggedOut ? 'Login Required' : 'Features Locked'}
        </h3>
        <p className="text-zinc-300 mb-6">
          {isLoggedOut
            ? 'Please login to access Klint Studios and start creating amazing content!'
            : 'Subscribe to a plan to unlock all features and start creating amazing content!'
          }
        </p>

        {isLoggedOut ? (
          /* Login Button */
          <button
            onClick={handleLogin}
            className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all"
          >
            Login
          </button>
        ) : (
          <>
            {/* View Plans Button */}
            <button
              onClick={onUnlock}
              className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all mb-3"
            >
              View Plans
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-all border border-zinc-700 flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </>
        )}

        <p className="text-xs text-zinc-500 mt-4">
          {isLoggedOut
            ? 'Sign in with Google to get started'
            : 'Subscribe or logout to switch accounts'
          }
        </p>
      </div>
    </div>
  );
};

