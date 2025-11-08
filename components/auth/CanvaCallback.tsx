import React, { useEffect, useState } from 'react';
import { exchangeCodeForToken } from '../../services/canvaService';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const CanvaCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      // Parse URL parameters directly from window location
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const state = urlParams.get('state');

      if (error) {
        setStatus('error');
        setError(error === 'access_denied' ? 'Authorization was denied' : error);
        return;
      }

      if (!code) {
        setStatus('error');
        setError('No authorization code received');
        return;
      }

      if (state !== 'canva_auth') {
        setStatus('error');
        setError('Invalid state parameter');
        return;
      }

      try {
        // Get redirect URI (should match what you configured in Canva)
        const redirectUri = `${window.location.origin}/canva-callback.html`;
        
        // Exchange code for tokens
        await exchangeCodeForToken(code, redirectUri);
        
        setStatus('success');
        
        // Redirect to admin panel after 2 seconds
        // Always redirect to production admin panel since OAuth callback happens on production
        setTimeout(() => {
          window.location.href = 'https://www.klintstudios.com/#admin?tab=integrations';
        }, 2000);
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Failed to authenticate with Canva');
        console.error('Canva OAuth error:', err);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin mx-auto mb-4 text-emerald-400" size={48} />
            <h2 className="text-xl font-bold mb-2">Connecting to Canva...</h2>
            <p className="text-zinc-400">Please wait while we authenticate your account.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={48} />
            <h2 className="text-xl font-bold mb-2">Successfully Connected!</h2>
            <p className="text-zinc-400">Redirecting to admin panel...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-4 text-red-400" size={48} />
            <h2 className="text-xl font-bold mb-2">Connection Failed</h2>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => {
                window.location.href = 'https://www.klintstudios.com/#admin?tab=integrations';
              }}
              className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-colors"
            >
              Go Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
};

