
import React from 'react';
import { Camera, X } from 'lucide-react';
import { AspectRatioSelector } from '../shared/AspectRatioSelector';
import { SettingSection } from '../settings/SettingSection';
import { OptionSelector } from '../shared/OptionSelector';
import { useStudio } from '../../context/StudioContext';
import type { VideoCreativeControls } from '../../types';

interface VideoSettingsPanelProps {
    onClose: () => void;
    isMobileView?: boolean;
}

const RESOLUTION_OPTIONS: { id: VideoCreativeControls['resolution'], name: string }[] = [
    { id: '720p', name: '720p (Fast)' },
    { id: '1080p', name: '1080p (HD)' }
];

export const VideoSettingsPanel: React.FC<VideoSettingsPanelProps> = ({ onClose, isMobileView }) => {
    const { videoControls, updateVideoControl } = useStudio();
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {isMobileView && (
                        <button onClick={onClose} className="p-1 -m-1 text-zinc-400 hover:text-white" aria-label="Close panel">
                            <X size={24} />
                        </button>
                    )}
                    <h2 className="text-lg font-bold text-zinc-100">Video Settings</h2>
                </div>
            </div>
            
            <div className="flex-grow min-h-0 overflow-y-auto p-4 space-y-2">
                <SettingSection id="video-settings-output" title="Output" icon={<Camera size={18} />} defaultOpen>
                    <div className="space-y-6 pt-4">
                        <AspectRatioSelector />
                        <OptionSelector
                            label="Resolution"
                            options={RESOLUTION_OPTIONS}
                            selectedOption={RESOLUTION_OPTIONS.find(o => o.id === videoControls.resolution) || RESOLUTION_OPTIONS[0]}
                            onSelect={(option) => updateVideoControl('resolution', option.id as VideoCreativeControls['resolution'])}
                            gridCols="grid-cols-2"
                        />
                         <div className="p-3 rounded-lg bg-zinc-800/50 border border-white/10 text-sm text-zinc-400">
                            <p><strong className="text-zinc-300">Duration:</strong> Fixed at 8 seconds.</p>
                            <p className="mt-1"><strong className="text-zinc-300">Daily Limit:</strong> 10 videos per day.</p>
                        </div>
                    </div>
                </SettingSection>
            </div>
        </div>
    );
};
