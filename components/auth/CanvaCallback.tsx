import React, { useEffect, useState } from 'react';
import { exchangeCodeForToken } from '../../services/canvaService';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const CanvaCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      // Log storage contents for debugging
      console.log('🔍 Storage check on callback page load:');
      console.log('  - sessionStorage.canva_code_verifier:', sessionStorage.getItem('canva_code_verifier') ? 'exists' : 'not found');
      console.log('  - localStorage.canva_code_verifier:', localStorage.getItem('canva_code_verifier') ? 'exists' : 'not found');
      console.log('  - All sessionStorage keys:', Object.keys(sessionStorage));
      console.log('  - All localStorage keys:', Object.keys(localStorage));
      
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

      // Add logging to debug state parameter
      console.log('🔍 OAuth Callback Received:');
      console.log('  - Code:', code ? `${code.substring(0, 20)}...` : 'null');
      console.log('  - State:', state || 'null');
      console.log('  - Expected State: canva_auth');
      console.log('  - State Match:', state === 'canva_auth');
      console.log('  - Full URL:', window.location.href);

      // Note: State parameter now contains session ID: canva_auth_<sessionId>
      // This allows us to retrieve the code verifier from the database
      if (state && state.startsWith('canva_auth_')) {
        console.log('✅ State parameter validated successfully');
        console.log('🔐 Session ID extracted from state');
      } else if (!state) {
        console.warn('⚠️ State parameter not returned by Canva');
        console.warn('⚠️ Will try to retrieve verifier from browser storage as fallback');
      } else {
        console.warn('⚠️ State parameter format unexpected:', state);
        console.warn('⚠️ Will try to retrieve verifier from browser storage as fallback');
      }

      try {
        // Get redirect URI (MUST match exactly what was used in authorization request)
        // Always use the full production URL to ensure consistency
        const redirectUri = 'https://www.klintstudios.com/canva-callback.html';
        
        console.log('🔄 Exchanging code for token...');
        console.log('📍 Using redirect URI:', redirectUri);
        console.log('📍 Current origin:', window.location.origin);
        console.log('📍 State parameter:', state || 'null');
        
        // Exchange code for tokens (pass state to retrieve verifier from database)
        await exchangeCodeForToken(code, redirectUri, state || undefined);
        
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

