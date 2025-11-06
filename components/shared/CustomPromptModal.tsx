import React from 'react';
import { X, Type } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { PromptOptimizer } from './PromptOptimizer';

interface CustomPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    studioMode: 'apparel' | 'product';
}

export const CustomPromptModal: React.FC<CustomPromptModalProps> = ({ isOpen, onClose, studioMode }) => {
    const { apparelControls, productControls, updateApparelControl, updateProductControl, t } = useStudio();
    
    const controls = studioMode === 'apparel' ? apparelControls : productControls;
    const updateControl = studioMode === 'apparel' ? updateApparelControl : updateProductControl;
    const customPrompt = controls?.customPrompt || '';
    
    const handleChange = (value: string) => {
        if (studioMode === 'apparel') {
            updateApparelControl('customPrompt', value);
        } else {
            updateProductControl('customPrompt', value);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-slide-up duration-300"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-zinc-925/70 backdrop-blur-2xl w-full max-w-2xl rounded-xl border border-white/10 shadow-2xl shadow-black/40 text-zinc-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
                    <h2 className="text-lg sm:text-xl font-bold flex items-center gap-3">
                        <Type size={22} className="text-emerald-400" />
                        {t('custom_prompt_override')}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors" aria-label="Close modal">
                        <X size={22} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6">
                    <p className="text-sm text-zinc-400 mb-4">
                        {t('custom_prompt_desc')}
                    </p>
                    <div className="relative">
                        <textarea
                            value={customPrompt}
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder={studioMode === 'apparel' ? t('custom_prompt_placeholder') : "e.g., A watch on a marble slab, surrounded by coffee beans, dramatic side lighting..."}
                            rows={8}
                            className="w-full p-3 rounded-md bg-zinc-850 text-zinc-200 border border-zinc-700 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-sm shadow-inner-soft resize-y"
                            style={{ minHeight: '200px' }}
                        />
                        <PromptOptimizer
                            prompt={customPrompt}
                            setPrompt={handleChange}
                            context={studioMode === 'apparel' ? "A detailed, overriding photoshoot prompt" : "A detailed, overriding photoshoot prompt for a product"}
                            className="absolute bottom-3 right-3"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

