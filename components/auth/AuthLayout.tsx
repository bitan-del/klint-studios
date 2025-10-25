import React, { useRef, useState } from 'react';
import { KLogo } from '../shared/KLogo';
import { PricingModal } from '../shared/PricingModal';
import { Footer } from '../shared/Footer';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX_viewport = e.clientX - rect.left;
        const mouseY_viewport = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((mouseY_viewport - centerY) / centerY) * -8;
        const rotateY = ((mouseX_viewport - centerX) / centerX) * 8;
        card.style.setProperty('--rotate-x', `${rotateX}deg`);
        card.style.setProperty('--rotate-y', `${rotateY}deg`);

        const cardRect = card.getBoundingClientRect();
        const mouseX_card = e.clientX - cardRect.left;
        const mouseY_card = e.clientY - cardRect.top;
        card.style.setProperty('--mouse-x', `${(mouseX_card / cardRect.width) * 100}%`);
        card.style.setProperty('--mouse-y', `${(mouseY_card / cardRect.height) * 100}%`);
    };

    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (card) {
            card.style.setProperty('--rotate-x', '0deg');
            card.style.setProperty('--rotate-y', '0deg');
            card.style.setProperty('--mouse-x', `50%`);
            card.style.setProperty('--mouse-y', `50%`);
        }
    };

    return (
        <div className="min-h-screen text-zinc-200 flex flex-col font-sans auth-noise-overlay overflow-y-auto">
            <div className="fixed inset-0 pointer-events-none auth-aurora"></div>
            <div className="fixed inset-0 pointer-events-none shooting-stars">
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
            </div>
            
            {/* Glassmorphic Navigation Bar */}
            <nav className="sticky top-0 z-50 px-6 lg:px-12 py-4">
                <div className="flex justify-center">
                    {/* Glassmorphic container with rounded pill shape */}
                    <div className="relative border border-white/20 bg-black/40 backdrop-blur-2xl shadow-2xl rounded-full px-8 py-2.5 inline-flex">
                        {/* Subtle glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 rounded-full"></div>
                        
                        <div className="relative flex items-center gap-8">
                            {/* Logo */}
                            <a href="/" className="flex items-center gap-2 cursor-pointer group">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all">
                                    <KLogo className="text-white" size={18} />
                                </div>
                                <h1 className="text-base font-bold text-white tracking-tight">Klint Studios</h1>
                            </a>

                            {/* Center Navigation */}
                            <div className="hidden lg:flex items-center gap-1">
                                <button
                                    onClick={() => setIsPricingModalOpen(true)}
                                    className="px-4 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    Pricing
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="hidden md:flex items-center gap-2">
                                <a
                                    href="/login.html"
                                    className="px-5 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-full transition-all border border-white/20"
                                >
                                    Login
                                </a>
                                <a
                                    href="/login.html"
                                    className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                                >
                                    Sign up for free
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            
            <div 
                className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 py-12"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div 
                    ref={cardRef}
                    className="w-full max-w-4xl animate-float-in interactive-card"
                    style={{
                        transform: 'perspective(1500px) rotateX(var(--rotate-x, 0)) rotateY(var(--rotate-y, 0))',
                        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                >
                     <div className="relative bg-zinc-900/70 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-glass shadow-black/40 p-12 shadow-glass-inset shimmer-border glass-shine-effect">
                        {children}
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <Footer />
            
            {/* Pricing Modal */}
            <PricingModal 
                isOpen={isPricingModalOpen} 
                onClose={() => setIsPricingModalOpen(false)} 
            />
        </div>
    );
};
