import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { KLogo } from '../shared/KLogo';

export const EmptyState: React.FC = () => {
    const { studioMode, t } = useStudio();
    
    const messages = {
        apparel: t('empty_state_apparel'),
        product: t('empty_state_product'),
        design: t('empty_state_design'),
        reimagine: t('empty_state_reimagine'),
        video: t('empty_state_video')
    };

    const titles = {
        apparel: t('canvas_apparel'),
        product: t('canvas_product'),
        design: t('canvas_design'),
        reimagine: t('canvas_reimagine'),
        video: t('canvas_video')
    };
    
    const message = messages[studioMode] || messages.apparel;
    const title = titles[studioMode] || titles.apparel;

    return (
        <div className="flex flex-col items-center justify-center text-center text-zinc-500 p-8 animate-fade-in">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-zinc-900/80 border border-white/10 mb-6 animate-float shadow-2xl shadow-black">
                <div className="absolute inset-0 rounded-full bg-aurora opacity-60 animate-pulse-slow"></div>
                <KLogo size={48} className="text-emerald-300" style={{ filter: 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.6))' }} />
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">{title}</h3>
            <p className="text-md mt-2 max-w-sm text-zinc-400">{message}</p>
        </div>
    );
}
