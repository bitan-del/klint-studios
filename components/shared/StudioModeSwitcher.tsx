
import React, { useState, useRef, useEffect } from 'react';
import { Layers, Package, Palette, ImageUp, MoreHorizontal } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import type { StudioMode } from '../../types';
import { InfoTooltip } from './InfoTooltip';

export const StudioModeSwitcher: React.FC = () => {
    const { studioMode, setStudioMode, t } = useStudio();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleModeSelect = (mode: StudioMode) => {
        setStudioMode(mode);
        setDropdownOpen(false);
    };

    const isDropdownActive = studioMode === 'design' || studioMode === 'reimagine';

    return (
        <div className="flex-shrink-0 bg-zinc-900 p-1 rounded-full flex items-center gap-1 border border-zinc-800 shadow-inner-soft">
            <button
                onClick={() => setStudioMode('apparel')}
                className={`flex-1 flex items-center justify-center gap-2 py-1 px-4 text-sm font-medium rounded-full transition-colors duration-200 h-8 whitespace-nowrap
                ${studioMode === 'apparel' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}
            >
                <Layers size={16} />
                <span>{t('dress_a_model')}</span>
                <InfoTooltip text="Compose a scene with a person and items. Ideal for lookbooks, character design, and virtual photoshoots." />
            </button>
            <button
                onClick={() => setStudioMode('product')}
                className={`flex-1 flex items-center justify-center gap-2 py-1 px-4 text-sm font-medium rounded-full transition-colors duration-200 h-8 whitespace-nowrap
                ${studioMode === 'product' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}
            >
                <Package size={16} />
                <span>{t('stage_a_product')}</span>
                <InfoTooltip text="Place objects in a scene. Perfect for product photography, hero shots, and advertisements." />
            </button>
            
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className={`flex items-center justify-center py-1 px-2 text-sm font-medium rounded-full transition-colors duration-200 h-8
                    ${isDropdownActive ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}
                    aria-label="More modes"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                >
                    <MoreHorizontal size={20} />
                </button>

                {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-850 border border-white/10 rounded-lg shadow-2xl z-50 p-2 animate-fade-in duration-150">
                        <button
                            onClick={() => handleModeSelect('design')}
                            className={`w-full flex items-center gap-3 p-2 text-sm font-medium rounded-md transition-colors
                            ${studioMode === 'design' ? 'bg-emerald-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                        >
                            <Palette size={16} />
                            <span>{t('create_mockups')}</span>
                        </button>
                        <button
                            onClick={() => handleModeSelect('reimagine')}
                            className={`w-full flex items-center gap-3 p-2 text-sm font-medium rounded-md transition-colors mt-1
                            ${studioMode === 'reimagine' ? 'bg-emerald-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                        >
                            <ImageUp size={16} />
                            <span>{t('photo_editor')}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};