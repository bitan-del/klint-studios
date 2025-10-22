import React from 'react';
import { InfoTooltip } from './InfoTooltip';

interface Option {
    id: string;
    name: string;
    description?: string;
}

interface OptionSelectorProps<T extends Option> {
    label: string;
    options: readonly T[];
    selectedOption: T;
    onSelect: (option: T) => void;
    gridCols?: string;
    className?: string;
    buttonTextSize?: string;
    infoTooltip?: string;
}

export const OptionSelector = <T extends Option>({
    label,
    options,
    selectedOption,
    onSelect,
    gridCols = 'grid-cols-2',
    className = '',
    buttonTextSize = 'text-sm',
    infoTooltip
}: OptionSelectorProps<T>) => {
    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-zinc-300">{label}</label>
                {infoTooltip && <InfoTooltip text={infoTooltip} />}
            </div>
            <div className={`grid ${gridCols} gap-2`}>
                {options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => onSelect(option)}
                        className={`p-2.5 rounded-lg text-center transition-all duration-200 h-12 flex items-center justify-center border ${buttonTextSize} shadow-inner-highlight hover:-translate-y-px
                        ${
                            selectedOption.id === option.id
                                ? 'bg-emerald-600 text-white font-semibold border-emerald-500 shadow-md shadow-emerald-900/40'
                                : 'bg-zinc-850 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:border-white/20'
                        }`}
                        title={option.description}
                    >
                        {option.name}
                    </button>
                ))}
            </div>
        </div>
    );
};