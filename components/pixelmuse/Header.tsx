import React from 'react';
import { ChevronRight } from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBack }) => {
  return (
    <div className="p-4 border-b border-zinc-900 flex items-center gap-4 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
        >
          <ChevronRight size={20} className="text-white rotate-180" />
        </button>
      )}
      <div className="flex flex-col">
        <h1 className="font-bold text-lg text-white">PixelMuse</h1>
        <span className="text-xs text-zinc-500">AI Image Generator • Create</span>
      </div>
    </div>
  );
};
