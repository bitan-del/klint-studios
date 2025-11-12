import React from 'react';

export const ModelInfo: React.FC = () => {
    return (
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/50 bg-gray-800 flex items-center justify-center">
                <span className="text-xl font-serif font-bold text-white">K</span>
            </div>
            <div>
                <p className="text-xs text-gray-300">Model</p>
                <p className="font-semibold text-white">klint studios</p>
            </div>
        </div>
    );
};

