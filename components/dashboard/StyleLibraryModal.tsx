import React from 'react';
import { X, Search, Image as ImageIcon } from 'lucide-react';
import { STYLE_PRESETS, type StylePreset } from '../pixelmuse/stylePresets';

interface StyleLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (style: StylePreset) => void;
    currentStyleId: string;
}

// Re-export for compatibility
export type { StylePreset };

export const StyleLibraryModal: React.FC<StyleLibraryModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    currentStyleId
}) => {
    const [searchQuery, setSearchQuery] = React.useState('');

    if (!isOpen) return null;

    const filteredStyles = STYLE_PRESETS.filter(style =>
        style.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        style.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Choose a Style</h2>
                        <p className="text-sm text-zinc-400">Select a visual style for your generation</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search styles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredStyles.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => onSelect(style)}
                                className={`
                                    group relative flex flex-col text-left rounded-xl overflow-hidden border transition-all duration-200
                                    ${currentStyleId === style.id
                                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.02]'
                                        : 'border-zinc-800 hover:border-zinc-600 hover:scale-[1.02]'
                                    }
                                `}
                            >
                                {/* Style Image */}
                                <div className="h-32 w-full relative overflow-hidden bg-zinc-800">
                                    <img 
                                        src={style.imageUrl} 
                                        alt={style.label}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        onError={(e) => {
                                            // Fallback to gradient if image fails
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                parent.className = 'h-32 w-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center relative overflow-hidden';
                                                parent.innerHTML = '<div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div><svg class="w-8 h-8 text-white/50 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                            }
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

                                    {/* Klint Label Badge */}
                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded text-[10px] font-medium text-white/90 border border-white/10">
                                        Klint
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-3 bg-zinc-900 group-hover:bg-zinc-800/80 transition-colors">
                                    <h3 className="text-sm font-semibold text-zinc-100 truncate">{style.label}</h3>
                                    <p className="text-[10px] text-zinc-500 truncate">{style.description}</p>
                                </div>

                                {/* Selected Indicator */}
                                {currentStyleId === style.id && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
