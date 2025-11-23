import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface OptionItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
}

interface OptionGridProps {
    options: OptionItem[];
    selectedId?: string | string[];
    onSelect: (id: string) => void;
    multiSelect?: boolean;
    columns?: 2 | 3 | 4;
}

export const OptionGrid: React.FC<OptionGridProps> = ({
    options,
    selectedId,
    onSelect,
    multiSelect = false,
    columns = 2
}) => {
    const isSelected = (id: string) => {
        if (multiSelect && Array.isArray(selectedId)) {
            return selectedId.includes(id);
        }
        return selectedId === id;
    };

    const gridCols = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4',
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-3 w-full animate-fade-in`}>
            {options.map((option) => {
                const active = isSelected(option.id);
                return (
                    <motion.button
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(option.id)}
                        className={`relative group p-4 rounded-xl border text-left transition-all duration-200 flex flex-col gap-2 ${active
                                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                            }`}
                    >
                        <div className="flex items-start justify-between w-full">
                            <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'
                                }`}>
                                {option.icon}
                            </div>
                            {active && (
                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <Check size={12} className="text-black font-bold" />
                                </div>
                            )}
                        </div>

                        <div>
                            <span className={`block font-medium text-sm ${active ? 'text-emerald-100' : 'text-zinc-300 group-hover:text-white'
                                }`}>
                                {option.label}
                            </span>
                            {option.description && (
                                <span className="block text-xs text-zinc-500 mt-1 line-clamp-2">
                                    {option.description}
                                </span>
                            )}
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
};
