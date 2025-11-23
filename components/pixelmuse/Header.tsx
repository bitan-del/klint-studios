import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ArrowRight, Settings2 } from 'lucide-react'; // Added imports for new icons

interface HeaderProps {
  onBack: () => void;
  isGenerating: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onBack, isGenerating }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/50 backdrop-blur-md z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowRight className="rotate-180" size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            PixelMuse <span className="text-xs font-normal text-pink-400 px-2 py-0.5 bg-pink-500/10 rounded-full border border-pink-500/20">Advanced</span>
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Settings2 size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-black font-bold text-xs">
          B
        </div>
      </div>
    </header>
  );
};
