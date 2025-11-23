
import React, { useState, useRef, useEffect } from 'react';
import { Layers, Package, Palette, ImageUp, MoreHorizontal, Sparkles, Wand2 } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
import type { StudioMode } from '../../types';
import { InfoTooltip } from './InfoTooltip';

interface StudioModeSwitcherProps {
    onShowPixelMuse?: () => void;
    onSwitchMode?: () => void;
    isPixelMuseActive?: boolean;
}

export const StudioModeSwitcher: React.FC<StudioModeSwitcherProps> = ({ onShowPixelMuse, onSwitchMode, isPixelMuseActive = false }) => {
    const { studioMode, setStudioMode, t } = useStudio();
    const { user } = useAuth();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Check if user has access to PixelMuse (currently available to all users)
    const hasPixelMuseAccess = true; // user?.plan === 'brand' || user?.role === 'admin' || user?.role === 'super_admin';

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
        if (onSwitchMode) onSwitchMode();
    };

    // Dropdown is active if any dropdown mode is selected
    const isDropdownActive = studioMode === 'design' || studioMode === 'reimagine';

    const renderButton = (
        isActive: boolean,
        onClick: () => void,
        icon: React.ReactNode,
        label: string,
        activeColorClass: string = 'bg-emerald-600'
    ) => (
        <button
            onClick={onClick}
            className={`relative flex items-center justify-center rounded-md transition-all duration-300 ease-in-out overflow-hidden
            ${isActive
                    ? `${activeColorClass} text-white px-3 py-2 gap-2 shadow-lg shadow-emerald-900/20`
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 p-2.5'}`}
            title={label}
        >
            {icon}
            <span className={`whitespace-nowrap font-medium text-sm transition-all duration-300 ${isActive ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0 hidden'}`}>
                {label}
            </span>
        </button>
    );

    return (
        <div className="flex-shrink-0 bg-zinc-900/50 backdrop-blur-sm px-2 py-1.5 rounded-lg flex items-center gap-2 border border-zinc-800/50">
            {/* Agentic Design */}
            {renderButton(
                studioMode === 'chason' && !isPixelMuseActive,
                () => {
                    setStudioMode('chason');
                    if (onSwitchMode) onSwitchMode();
                },
                <Sparkles size={16} />,
                "Agentic Design",
                "bg-gradient-to-br from-emerald-500 to-teal-500"
            )}

            {/* MultiSnap */}
            {renderButton(
                studioMode === 'design' && !isPixelMuseActive,
                () => handleModeSelect('design'),
                <Palette size={16} />,
                "MultiSnap",
                "bg-zinc-700"
            )}

            {/* Variation Lab */}
            {renderButton(
                studioMode === 'reimagine' && !isPixelMuseActive,
                () => handleModeSelect('reimagine'),
                <ImageUp size={16} />,
                "Variation Lab",
                "bg-zinc-700"
            )}

            {/* PixelMuse */}
            {hasPixelMuseAccess && onShowPixelMuse && renderButton(
                isPixelMuseActive,
                () => onShowPixelMuse(),
                <Wand2 size={16} className={isPixelMuseActive ? "animate-pulse" : ""} />,
                "PixelMuse",
                "bg-emerald-600"
            )}

            {/* More Options */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className={`flex items-center justify-center p-2.5 rounded-md transition-all duration-200
                    ${isDropdownActive ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
                    title="More Options"
                >
                    <MoreHorizontal size={16} />
                </button>

                {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 p-2 backdrop-blur-xl">
                        <div className="text-xs text-zinc-500 p-3 text-center">More modes coming soon</div>
                    </div>
                )}
            </div>
        </div>
    );
};