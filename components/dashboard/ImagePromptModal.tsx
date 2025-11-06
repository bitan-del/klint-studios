import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Download, Sparkles, Wand2, Image as ImageIcon, Layers, Zap, Copy, Plus, Info, Lightbulb, TrendingUp, Star } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

interface ImagePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    imageId: number;
    onNavigateToWorkflow?: (workflowId: string) => void;
}

// Cache for generated prompts to avoid re-analyzing the same image
const promptCache = new Map<number, string>();

export const ImagePromptModal: React.FC<ImagePromptModalProps> = ({ isOpen, onClose, imageUrl, imageId, onNavigateToWorkflow }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Generate a random username based on imageId for consistency
    const randomUsernames = [
        'AlexCreative', 'MayaDesigns', 'SamVisuals', 'JordanArts', 'TaylorStudio',
        'CaseyPixels', 'RileyShots', 'QuinnLens', 'MorganFrame', 'AveryCapture',
        'BlakeFocus', 'CameronView', 'DakotaFrame', 'EmeryLens', 'FinleyShots'
    ];
    const randomUsername = randomUsernames[imageId % randomUsernames.length];

    useEffect(() => {
        if (isOpen && imageUrl) {
            // Reset state when modal opens
            setPrompt('');
            setIsGenerating(false);
            setError(null);
        }
    }, [isOpen, imageUrl, imageId]);

    // Handle ESC key to close modal
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    const generatePrompt = async () => {
        if (!imageUrl) return;

        // Check cache first
        if (promptCache.has(imageId)) {
            setPrompt(promptCache.get(imageId) || '');
            setIsGenerating(false);
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // Convert image URL to base64
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            
            reader.onloadend = async () => {
                try {
                    const base64Image = reader.result as string;
                    
                    // Use a lightweight prompt to analyze the image (optimized for cost)
                    const analysisPrompt = `Generate a concise AI image generation prompt (max 100 words) describing: subject, style, lighting, colors, composition, camera details. Format as comma-separated keywords.`;

                    const generatedPrompt = await geminiService.analyzeImage(base64Image, analysisPrompt);
                    
                    // Cache the result
                    promptCache.set(imageId, generatedPrompt);
                    setPrompt(generatedPrompt);
                } catch (err) {
                    console.error('Error generating prompt:', err);
                    setError('Failed to generate prompt. Please try again.');
                } finally {
                    setIsGenerating(false);
                }
            };

            reader.onerror = () => {
                setError('Failed to load image.');
                setIsGenerating(false);
            };

            reader.readAsDataURL(blob);
        } catch (err) {
            console.error('Error fetching image:', err);
            setError('Failed to load image.');
            setIsGenerating(false);
        }
    };

    const downloadImage = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Generate filename: klint_<imageId>.<extension>
            const extension = blob.type.split('/')[1] || 'jpg';
            link.download = `klint_${imageId}.${extension}`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading image:', err);
            alert('Failed to download image. Please try again.');
        }
    };

    const handleFeatureClick = (feature: string) => {
        // Map feature names to workflow IDs
        const featureToWorkflowMap: Record<string, string> = {
            'ai-photoshoot': 'ai-photoshoot',
            'product-photography': 'product-photography',
            'variation-lab': 'photo-editor',
            'upscale': 'upscale',
            'style-transfer': 'style-transfer',
            'multisnap': 'product-photography', // MultiSnap uses product photography workflow
        };

        const workflowId = featureToWorkflowMap[feature] || feature;

        // Convert image to base64 and navigate to feature
        fetch(imageUrl)
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Image = reader.result as string;
                    // Store in localStorage for the feature to use
                    localStorage.setItem('gallery_image_for_feature', base64Image);
                    localStorage.setItem('gallery_feature', workflowId);
                    // Close modal first
                    onClose();
                    // Navigate to the workflow
                    if (onNavigateToWorkflow) {
                        onNavigateToWorkflow(workflowId);
                    } else {
                        // Fallback: try to navigate using window location or dispatch event
                        window.dispatchEvent(new CustomEvent('navigate-to-workflow', { detail: { workflowId } }));
                    }
                };
                reader.readAsDataURL(blob);
            })
            .catch(err => {
                console.error('Error converting image:', err);
                alert('Failed to load image. Please try again.');
            });
    };

    if (!isOpen) return null;

    const modalContent = (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ zIndex: 99999 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-zinc-925/95 backdrop-blur-2xl w-full max-w-7xl rounded-xl border border-white/10 shadow-2xl shadow-black/40 text-zinc-200 overflow-hidden relative"
                style={{ zIndex: 100000 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col lg:flex-row h-[90vh] max-h-[900px]">
                    {/* Image Section */}
                    <div className="flex-1 bg-zinc-950 flex items-center justify-center p-6 overflow-hidden relative">
                        {/* Close button positioned on image section, top-right */}
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Close button clicked - closing modal');
                                onClose();
                            }} 
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            className="absolute top-6 right-6 p-2.5 rounded-full text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 z-50 shadow-lg" 
                            aria-label="Close modal"
                            type="button"
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={imageUrl}
                            alt="Gallery Image"
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    </div>

                    {/* Side Panel */}
                    <div className="w-full lg:w-96 bg-zinc-900/95 border-l border-white/10 flex flex-col overflow-hidden">
                        {/* Top Actions */}
                        <div className="p-4 pt-6 border-b border-white/10 space-y-3">
                            <button
                                onClick={downloadImage}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                                <Download size={18} />
                                Download Image
                            </button>
                            <button
                                onClick={generatePrompt}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Fetching...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Fetch User Prompt
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                            {/* Prompt Section */}
                            {prompt && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-zinc-300">Prompt</h3>
                                    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                                        <p className="text-xs text-zinc-200 leading-relaxed line-clamp-3">
                                            {prompt}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(prompt);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors border border-zinc-700"
                                        >
                                            <Copy size={14} />
                                            Copy
                                        </button>
                                        <button
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors border border-zinc-700"
                                        >
                                            <Plus size={14} />
                                            Use
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Error State */}
                            {error && (
                                <div className="space-y-2">
                                    <p className="text-xs text-red-400">{error}</p>
                                    <button
                                        onClick={generatePrompt}
                                        className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {/* Klint Studios Features */}
                            <div className="space-y-4 -mx-2 px-2">
                                <h3 className="text-sm font-semibold text-zinc-300 px-2">Use with Klint Studios</h3>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleFeatureClick('ai-photoshoot')}
                                        className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors group"
                                    >
                                        <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                                            <ImageIcon size={18} className="text-emerald-400" />
                                        </div>
                                        <span className="text-xs font-medium text-zinc-300">AI Photoshoot</span>
                                    </button>

                                    <button
                                        onClick={() => handleFeatureClick('product-photography')}
                                        className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors group"
                                    >
                                        <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                                            <Layers size={18} className="text-emerald-400" />
                                        </div>
                                        <span className="text-xs font-medium text-zinc-300">Product Photo</span>
                                    </button>

                                    <button
                                        onClick={() => handleFeatureClick('variation-lab')}
                                        className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors group"
                                    >
                                        <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                                            <Sparkles size={18} className="text-emerald-400" />
                                        </div>
                                        <span className="text-xs font-medium text-zinc-300">Variation Lab</span>
                                    </button>

                                    <button
                                        onClick={() => handleFeatureClick('upscale')}
                                        className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors group"
                                    >
                                        <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                                            <Zap size={18} className="text-emerald-400" />
                                        </div>
                                        <span className="text-xs font-medium text-zinc-300">Upscale</span>
                                    </button>

                                    <button
                                        onClick={() => handleFeatureClick('style-transfer')}
                                        className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors group"
                                    >
                                        <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                                            <Wand2 size={18} className="text-emerald-400" />
                                        </div>
                                        <span className="text-xs font-medium text-zinc-300">Style Transfer</span>
                                    </button>

                                    <button
                                        onClick={() => handleFeatureClick('multisnap')}
                                        className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors group"
                                    >
                                        <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                                            <ImageIcon size={18} className="text-emerald-400" />
                                        </div>
                                        <span className="text-xs font-medium text-zinc-300">MultiSnap</span>
                                    </button>
                                </div>
                            </div>

                            {/* Image Details & Tips Section */}
                            <div className="space-y-4 -mx-2 px-2 pt-4 border-t border-white/10">
                                <h3 className="text-sm font-semibold text-zinc-300 px-2 flex items-center gap-2">
                                    <Info size={16} className="text-emerald-400" />
                                    Image Details
                                </h3>
                                
                                <div className="space-y-3 px-2">
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                                            <div className="text-xs text-zinc-400 mb-1">Image ID</div>
                                            <div className="text-sm font-medium text-zinc-200">#{imageId}</div>
                                        </div>
                                        <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                                            <div className="text-xs text-zinc-400 mb-1">Creator</div>
                                            <div className="text-sm font-medium text-zinc-200">@{randomUsername}</div>
                                        </div>
                                    </div>

                                    {/* Tips Section */}
                                    <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                                        <div className="flex items-start gap-2">
                                            <Lightbulb size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                            <div className="space-y-1.5">
                                                <div className="text-xs font-semibold text-emerald-300">Pro Tips</div>
                                                <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                                                    <li>Click any feature to use this image as input</li>
                                                    <li>Generate a prompt to reuse this style elsewhere</li>
                                                    <li>Download for offline use or reference</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp size={14} className="text-zinc-400" />
                                            <div className="text-xs font-semibold text-zinc-300">Popular Uses</div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="px-2 py-1 bg-zinc-700/50 text-xs text-zinc-300 rounded-md">Product Shots</span>
                                            <span className="px-2 py-1 bg-zinc-700/50 text-xs text-zinc-300 rounded-md">Social Media</span>
                                            <span className="px-2 py-1 bg-zinc-700/50 text-xs text-zinc-300 rounded-md">Marketing</span>
                                            <span className="px-2 py-1 bg-zinc-700/50 text-xs text-zinc-300 rounded-md">E-commerce</span>
                                        </div>
                                    </div>

                                    {/* Feature Highlight */}
                                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg p-3 border border-emerald-500/20">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Star size={14} className="text-emerald-400" />
                                            <div className="text-xs font-semibold text-emerald-300">Best For</div>
                                        </div>
                                        <div className="text-xs text-zinc-300 leading-relaxed">
                                            This image works great with <span className="text-emerald-400 font-medium">AI Photoshoot</span> and <span className="text-emerald-400 font-medium">Variation Lab</span> for creating professional variations and style transfers.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Use portal to render at root level, ensuring it's above everything
    return createPortal(modalContent, document.body);
};
