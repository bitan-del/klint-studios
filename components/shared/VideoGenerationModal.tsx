import React, { useState, useEffect } from 'react';
import { X, Video, Sparkles, Info } from 'lucide-react';
import type { VideoGenerationConfig, VideoDuration, VideoQuality, VideoRatio } from '../../types/video';
import { VIDEO_DURATION_OPTIONS, VIDEO_QUALITY_OPTIONS, VIDEO_RATIO_OPTIONS, VIDEO_PLAN_LIMITS } from '../../types/video';
import { useAuth } from '../../context/AuthContext';
import { videoService } from '../../services/videoService';
import { storageService } from '../../services/storageService';

interface VideoGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceImage: string;
    onGenerate: (config: VideoGenerationConfig) => Promise<void>;
}

export const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({
    isOpen,
    onClose,
    sourceImage,
    onGenerate
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'frames' | 'ingredients'>('ingredients');
    const [duration, setDuration] = useState<VideoDuration>('4s');
    const [quality, setQuality] = useState<VideoQuality>('720p');
    const [ratio, setRatio] = useState<VideoRatio>('16:9');
    const [prompt, setPrompt] = useState('');
    const [enhancePrompt, setEnhancePrompt] = useState(true);
    const [multiShotMode, setMultiShotMode] = useState(false);
    const [startFrame, setStartFrame] = useState<string | undefined>(undefined);
    const [endFrame, setEndFrame] = useState<string | undefined>(undefined);
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUsage, setVideoUsage] = useState<{ monthly: number; daily: number }>({ monthly: 0, daily: 0 });
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    const limits = user ? VIDEO_PLAN_LIMITS[user.plan] : { monthly: 0, daily: 0 };
    const canGenerate = videoUsage.monthly < limits.monthly && videoUsage.daily < limits.daily;

    // Load video usage on mount
    useEffect(() => {
        if (user?.id && isOpen) {
            storageService.getVideoUsage(user.id).then(setVideoUsage);
        }
    }, [user?.id, isOpen]);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!user) return;

        setIsGenerating(true);
        setGeneratedVideoUrl(null);
        try {
            const config: VideoGenerationConfig = {
                sourceImage,
                duration,
                quality,
                ratio,
                prompt: prompt.trim() || undefined,
                enhancePrompt,
                startFrame,
                endFrame,
                multiShotMode
            };

            const videoUrl = await videoService.generateVideo(user.id, config, user.plan);

            // Refresh usage
            const newUsage = await storageService.getVideoUsage(user.id);
            setVideoUsage(newUsage);

            await onGenerate(config);
            setGeneratedVideoUrl(videoUrl);
        } catch (error) {
            console.error('Video generation failed:', error);
            alert(error instanceof Error ? error.message : 'Video generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950/70 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/5">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-zinc-950/50 backdrop-blur-xl border-b border-white/10 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-950/50 border border-emerald-500/20 rounded-lg shadow-inner shadow-emerald-500/10">
                                <Video className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Generate Video</h2>
                                <div className="text-sm text-zinc-400">
                                    <span className="font-medium">Monthly:</span> {videoUsage.monthly}/{limits.monthly} •
                                    <span className="font-medium">Daily:</span> {videoUsage.daily}/{limits.daily}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setActiveTab('ingredients')}
                            className={`px - 4 py - 2 rounded - lg text - sm font - medium transition - colors ${activeTab === 'ingredients'
                                ? 'bg-white/10 text-white'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                } `}
                        >
                            Ingredients
                        </button>
                        <button
                            onClick={() => setActiveTab('frames')}
                            className={`px - 4 py - 2 rounded - lg text - sm font - medium transition - colors ${activeTab === 'frames'
                                ? 'bg-white/10 text-white'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                } `}
                        >
                            Frames
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {generatedVideoUrl ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-emerald-900/20 to-emerald-950/40 shadow-2xl border border-emerald-500/20 flex items-center justify-center">
                                <div className="text-center p-8 space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
                                        <Sparkles className="w-10 h-10 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Video Generated! 🎉</h3>
                                        <p className="text-zinc-400 text-sm">Your video is ready to download</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-300 mb-2">Video URL:</p>
                                        <code className="text-xs text-emerald-400 bg-black/30 px-2 py-1 rounded block overflow-x-auto">
                                            {generatedVideoUrl}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setGeneratedVideoUrl(null)}
                                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                                >
                                    Generate Another
                                </button>
                                <a
                                    href={generatedVideoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                                >
                                    <Video size={18} />
                                    Open Video in New Tab
                                </a>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Source Image Preview */}
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800">
                                <img
                                    src={sourceImage}
                                    alt="Source"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white">
                                    Source Image
                                </div>
                            </div>

                            {activeTab === 'ingredients' ? (
                                <>
                                    {/* Prompt */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">
                                            Prompt
                                        </label>
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="Describe the scene you imagine, with details."
                                            className="w-full h-24 px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                                        />
                                        <button
                                            onClick={() => setEnhancePrompt(!enhancePrompt)}
                                            className={`flex items - center gap - 2 px - 3 py - 1.5 rounded - lg text - sm transition - colors ${enhancePrompt
                                                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-transparent'
                                                } `}
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Enhance {enhancePrompt ? 'on' : 'off'}
                                        </button>
                                    </div>

                                    {/* Multi-shot Mode */}
                                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white">Multi-shot mode</span>
                                            <button className="text-zinc-400 hover:text-white">
                                                <Info className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setMultiShotMode(!multiShotMode)}
                                            className={`relative w - 12 h - 6 rounded - full transition - colors ${multiShotMode ? 'bg-emerald-600' : 'bg-zinc-700'
                                                } `}
                                        >
                                            <div
                                                className={`absolute top - 1 w - 4 h - 4 bg - white rounded - full transition - transform ${multiShotMode ? 'translate-x-7' : 'translate-x-1'
                                                    } `}
                                            />
                                        </button>
                                    </div>

                                    {/* Model */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Model</label>
                                        <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">Klint v.2</span>
                                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">G</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quality */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Quality</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {VIDEO_QUALITY_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setQuality(option.value)}
                                                    className={`group relative p-5 rounded-xl border transition-all duration-200 ${quality === option.value
                                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                                        } `}
                                                >
                                                    <div className="text-left relative z-10">
                                                        <div className={`font-semibold mb-1 transition-colors ${quality === option.value ? 'text-emerald-400' : 'text-white group-hover:text-white'}`}>{option.label}</div>
                                                        <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">{option.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ratio */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-zinc-300">Ratio</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {VIDEO_RATIO_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setRatio(option.value)}
                                                    className={`group relative p-4 rounded-xl border transition-all duration-200 ${ratio === option.value
                                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                                        } `}
                                                >
                                                    <div className="text-center relative z-10">
                                                        <div className={`font-semibold mb-1 transition-colors ${ratio === option.value ? 'text-emerald-400' : 'text-white group-hover:text-white'}`}>{option.label}</div>
                                                        <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">{option.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-zinc-300">Duration</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {VIDEO_DURATION_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setDuration(option.value)}
                                                    className={`group relative p-4 rounded-xl border transition-all duration-200 ${duration === option.value
                                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                                        } `}
                                                >
                                                    <div className="text-center relative z-10">
                                                        <div className={`font-semibold transition-colors ${duration === option.value ? 'text-emerald-400' : 'text-white group-hover:text-white'}`}>{option.label}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Frames Tab */
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Start Frame */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Start frame</label>
                                        <div className="aspect-video border-2 border-dashed border-zinc-700 rounded-xl flex items-center justify-center bg-zinc-800/50 hover:border-zinc-600 transition-colors cursor-pointer group">
                                            {startFrame ? (
                                                <img src={startFrame} alt="Start frame" className="w-full h-full object-contain rounded-lg" />
                                            ) : (
                                                <div className="text-center p-6">
                                                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                        <Video className="w-6 h-6 text-zinc-500 group-hover:text-zinc-400" />
                                                    </div>
                                                    <p className="text-sm text-zinc-500 group-hover:text-zinc-400">Optional</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* End Frame */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">End frame</label>
                                        <div className="aspect-video border-2 border-dashed border-zinc-700 rounded-xl flex items-center justify-center bg-zinc-800/50 hover:border-zinc-600 transition-colors cursor-pointer group">
                                            {endFrame ? (
                                                <img src={endFrame} alt="End frame" className="w-full h-full object-contain rounded-lg" />
                                            ) : (
                                                <div className="text-center p-6">
                                                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                        <Video className="w-6 h-6 text-zinc-500 group-hover:text-zinc-400" />
                                                    </div>
                                                    <p className="text-sm text-zinc-500 group-hover:text-zinc-400">Optional</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!generatedVideoUrl && (
                    <div className="sticky bottom-0 bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 p-6 z-20">
                        {!canGenerate ? (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 flex items-center gap-3">
                                <Info className="w-5 h-5 text-amber-500 shrink-0" />
                                <p className="text-sm text-amber-200">
                                    {limits.monthly === 0
                                        ? 'Upgrade your plan to generate videos'
                                        : 'You have reached your video generation limit'}
                                </p>
                            </div>
                        ) : null}

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all border border-white/5 hover:border-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !canGenerate}
                                className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-zinc-800 disabled:to-zinc-800 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Generating Magic...
                                    </>
                                ) : (
                                    <>
                                        <Video className="w-5 h-5" />
                                        Generate Video
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
