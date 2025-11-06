import React from 'react';
import { Loader2, Download, RotateCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PolaroidCardProps {
    imageUrl?: string;
    conceptName: string;
    status: 'pending' | 'done' | 'error';
    error?: string;
    onRetry: () => void;
    onDownload: () => void;
    isHighlighted?: boolean;
}

const PolaroidCard: React.FC<PolaroidCardProps> = ({
    imageUrl,
    conceptName,
    status,
    error,
    onRetry,
    onDownload,
    isHighlighted = false
}) => {
    return (
        <div className={cn(
            "relative bg-white rounded-lg p-4 shadow-2xl transform transition-all duration-300 group",
            isHighlighted && "scale-105 ring-2 ring-violet-500"
        )}>
            <div className="aspect-[4/5] w-full bg-zinc-100 rounded-sm overflow-hidden mb-3 relative">
                {status === 'pending' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-200">
                        <Loader2 className="animate-spin h-10 w-10 text-violet-500" />
                    </div>
                )}
                {status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-4">
                        <p className="text-red-600 font-semibold text-sm mb-2">Error</p>
                        <p className="text-red-500 text-xs text-center mb-4">{error}</p>
                        <button
                            onClick={onRetry}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}
                {status === 'done' && imageUrl && (
                    <img 
                        src={imageUrl} 
                        alt={conceptName} 
                        className="w-full h-full object-cover"
                    />
                )}
                {status === 'done' && imageUrl && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={onDownload}
                            className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                            aria-label="Download"
                        >
                            <Download className="h-4 w-4 text-zinc-800" />
                        </button>
                        <button
                            onClick={onRetry}
                            className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                            aria-label="Regenerate"
                        >
                            <RotateCw className="h-4 w-4 text-zinc-800" />
                        </button>
                    </div>
                )}
            </div>
            <p className="text-center text-zinc-800 font-medium text-sm leading-tight min-h-[2.5rem] flex items-center justify-center">
                {conceptName}
            </p>
        </div>
    );
};

export default PolaroidCard;

