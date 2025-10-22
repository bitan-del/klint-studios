import React from 'react';
import { Info } from 'lucide-react';

export const InfoTooltip: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  return (
    <div className={`relative group flex items-center ${className}`}>
      <Info size={14} className="text-zinc-500 cursor-help" />
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-zinc-900 text-zinc-200 text-xs rounded-lg border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        {text}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-zinc-900"></div>
      </div>
    </div>
  );
};