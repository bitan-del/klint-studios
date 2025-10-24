import React, { useState } from 'react';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { TermsOfServiceModal } from './TermsOfServiceModal';

export const Footer: React.FC = () => {
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    return (
        <>
            <footer className="relative mt-auto border-t border-white/10 bg-black/40 backdrop-blur-2xl">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none"></div>
                
                <div className="relative px-6 py-4">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                        {/* Copyright */}
                        <div className="text-white/60">
                            © {new Date().getFullYear()} Klint Studios. All rights reserved.
                        </div>

                        {/* Links */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setIsPrivacyOpen(true)}
                                className="text-white/60 hover:text-white/90 transition-colors"
                            >
                                Privacy Policy
                            </button>
                            <button
                                onClick={() => setIsTermsOpen(true)}
                                className="text-white/60 hover:text-white/90 transition-colors"
                            >
                                Terms of Service
                            </button>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Modals */}
            <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
            <TermsOfServiceModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        </>
    );
};

