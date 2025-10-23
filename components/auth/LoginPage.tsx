import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { authService } from '../../services/authService';

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.618-3.499-11.188-8.261l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.088,5.571l6.19,5.238C43.021,36.258,44,34,44,30C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

export const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const { error } = await authService.signInWithGoogle();
        if (error) {
            console.error('Google sign-in error:', error);
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center mb-8 animate-fade-in delay-100">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-zinc-100 to-zinc-400">Sign in to Studio</h2>
                <p className="text-sm text-zinc-400 mt-2">Use your Google account to continue.</p>
            </div>
            
            {/* Brand Video */}
            <div className="mb-6 animate-fade-in delay-150 rounded-lg overflow-hidden">
                <iframe
                    width="100%"
                    height="240"
                    src="https://www.youtube.com/embed/EM68s3Lnr5o?autoplay=0&controls=1&modestbranding=1&rel=0&showinfo=0"
                    title="Klint Studios Brand Video"
                    frameBorder="0"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                ></iframe>
            </div>
            
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex justify-center items-center gap-3 bg-white hover:bg-zinc-200 text-zinc-800 font-semibold py-3 px-5 rounded-lg transition-all duration-300 border border-zinc-300 animate-fade-in disabled:opacity-70 delay-200 hover:shadow-lg active:scale-[0.98]"
            >
                <GoogleIcon />
                {loading ? 'Signing in...' : 'Continue with Google'}
            </button>
        </AuthLayout>
    );
};