import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap, Crown } from 'lucide-react';
import type { ImageQuality, QualityUsage } from '../../types/quality';

interface QualitySelectorProps {
    selected: ImageQuality;
    onChange: (quality: ImageQuality) => void;
    usage: QualityUsage;
    limits: { hd: number; qhd: number };
    disabled?: boolean;
}

export const QualitySelector: React.FC<QualitySelectorProps> = ({
    selected,
    onChange,
    usage,
    limits,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const hdDisabled = disabled || usage.hd >= limits.hd;
    const qhdDisabled = disabled || usage.qhd >= limits.qhd;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getLabel = (q: ImageQuality) => {
        switch (q) {
            case 'regular': return 'Regular';
            case 'hd': return 'HD';
            case 'qhd': return 'QHD';
        }
    };

    const getIcon = (q: ImageQuality) => {
        switch (q) {
            case 'regular': return null;
            case 'hd': return <Zap className="w-3 h-3" />;
            case 'qhd': return <Crown className="w-3 h-3" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-2
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700
                `}
            >
                <span className="text-zinc-400">Quality:</span>
                <span className={selected !== 'regular' ? 'text-emerald-400' : 'text-zinc-200'}>
                    {getLabel(selected)}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 right-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[200px] p-1">
                    <div className="space-y-1">
                        {/* Regular Option */}
                        <button
                            onClick={() => {
                                onChange('regular');
                                setIsOpen(false);
                            }}
                            className={`
                                w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between group
                                ${selected === 'regular' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}
                            `}
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">Regular</span>
                                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">Unlimited generations</span>
                            </div>
                        </button>

                        {/* HD Option */}
                        <button
                            onClick={() => {
                                if (!hdDisabled) {
                                    onChange('hd');
                                    setIsOpen(false);
                                }
                            }}
                            disabled={hdDisabled}
                            className={`
                                w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between group
                                ${selected === 'hd' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}
                                ${hdDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium">HD (2K)</span>
                                    <Zap className="w-3 h-3 text-emerald-500" />
                                </div>
                                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                                    {limits.hd > 0 ? `${usage.hd} / ${limits.hd} used` : 'Upgrade to unlock'}
                                </span>
                            </div>
                            {selected === 'hd' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </button>

                        {/* QHD Option */}
                        <button
                            onClick={() => {
                                if (!qhdDisabled) {
                                    onChange('qhd');
                                    setIsOpen(false);
                                }
                            }}
                            disabled={qhdDisabled}
                            className={`
                                w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between group
                                ${selected === 'qhd' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}
                                ${qhdDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium">QHD (4K)</span>
                                    <Crown className="w-3 h-3 text-purple-500" />
                                </div>
                                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                                    {limits.qhd > 0 ? `${usage.qhd} / ${limits.qhd} used` : 'Upgrade to unlock'}
                                </span>
                            </div>
                            {selected === 'qhd' && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
