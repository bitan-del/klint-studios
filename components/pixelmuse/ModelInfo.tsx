import React from 'react';

interface ModelInfoProps {
    quality?: 'regular' | 'hd' | 'qhd';
    feature?: string;
}

export const ModelInfo: React.FC<ModelInfoProps> = ({ quality = 'regular', feature = 'PixelMuse' }) => {
    return (
        <div className="flex flex-col space-y-0.5 text-white">
            <p className="text-xs text-gray-400">Model Name</p>
            <p className="font-bold text-sm">Klint</p>
            <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                <span className="capitalize">Category: {quality === 'regular' ? 'Regular' : quality.toUpperCase()}</span>
                <span>•</span>
                <span>Feature: {feature}</span>
            </div>
        </div>
    );
};

