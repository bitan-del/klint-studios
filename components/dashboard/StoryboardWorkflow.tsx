import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Sparkles, Image as ImageIcon, Copy, Check, Loader2, FolderOpen } from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { ImageLibraryModal } from '../common/ImageLibraryModal';

interface StoryboardWorkflowProps {
    onBack: () => void;
}

export const StoryboardWorkflow: React.FC<StoryboardWorkflowProps> = ({ onBack }) => {
    const [uploadedImage, setUploadedImage] = useState<string>('');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [uploadMode, setUploadMode] = useState<'upload' | 'library'>('upload');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedImage(event.target?.result as string);
                setGeneratedPrompt(''); // Clear previous prompt
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file');
        }
    };

    const handleGeneratePrompt = async () => {
        if (!uploadedImage) {
            alert('Please upload an image first');
            return;
        }

        setIsGenerating(true);
        try {
            const analysisPrompt = `Analyze this image in extreme detail for the Photo to Prompt tool in Klint Studios.

**Your Task:** Create a comprehensive, detailed prompt that describes this image so precisely that someone could recreate it exactly using AI image generation.

**Include:**
- Subject/main focus (detailed physical description)
- Pose, expression, and body language
- Clothing and accessories (colors, styles, textures)
- Background and environment (detailed setting)
- Lighting (direction, quality, mood, shadows)
- Color palette and tones
- Composition and framing
- Camera angle and perspective
- Artistic style and aesthetic
- Mood and atmosphere
- Any text, logos, or graphics visible
- Technical details (depth of field, focus, etc.)

**Format:** Write a single, detailed paragraph that captures every visual element. Make it specific, actionable, and comprehensive enough to recreate this exact image.

Return ONLY the prompt text, no explanations or metadata.`;

            const result = await geminiService.analyzeImage(uploadedImage, analysisPrompt);
            
            console.log('🎨 Prompt generated:', result.substring(0, 200));
            
            if (result && result.trim()) {
                setGeneratedPrompt(result.trim());
            } else {
                throw new Error('Empty response from AI');
            }
        } catch (error) {
            console.error('Failed to generate prompt:', error);
            alert('Failed to generate prompt. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!generatedPrompt) return;
        
        try {
            await navigator.clipboard.writeText(generatedPrompt);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy to clipboard');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedImage(event.target?.result as string);
                setGeneratedPrompt('');
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300">
            {/* Header */}
            <div className="bg-zinc-900 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Back to Dashboard</span>
                        </button>
                        <div className="h-6 w-px bg-zinc-800" />
                        <div>
                            <h1 className="text-xl font-semibold text-white">Photo to Prompt</h1>
                            <p className="text-sm text-zinc-400">Convert any image into a detailed AI prompt</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Left Column - Image Upload */}
                    <div className="space-y-4">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <ImageIcon className="w-5 h-5 text-emerald-400" />
                                <h2 className="text-lg font-semibold text-white">Upload Image</h2>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setUploadMode('upload')}
                                    className={`
                                        flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                        ${uploadMode === 'upload' 
                                            ? 'bg-emerald-500 text-black' 
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        }
                                    `}
                                >
                                    <Upload className="w-4 h-4 inline mr-2" />
                                    Upload
                                </button>
                                <button
                                    onClick={() => setUploadMode('library')}
                                    className={`
                                        flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                        ${uploadMode === 'library' 
                                            ? 'bg-emerald-500 text-black' 
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        }
                                    `}
                                >
                                    <FolderOpen className="w-4 h-4 inline mr-2" />
                                    From Library
                                </button>
                            </div>

                            {!uploadedImage ? (
                                uploadMode === 'upload' ? (
                                    <div
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-zinc-700 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-zinc-900/50 transition-all"
                                    >
                                        <Upload className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                        <p className="text-zinc-400 mb-2">Click to upload or drag & drop</p>
                                        <p className="text-xs text-zinc-500">PNG, JPG, WEBP up to 10MB</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setShowLibraryModal(true)}
                                        className="border-2 border-dashed border-zinc-700 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-zinc-900/50 transition-all"
                                    >
                                        <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                        <p className="text-zinc-400 mb-2">Click to select from library</p>
                                        <p className="text-xs text-zinc-500">My Creations</p>
                                    </div>
                                )
                            ) : (
                                <div className="relative rounded-xl overflow-hidden bg-zinc-900">
                                    <img
                                        src={uploadedImage}
                                        alt="Uploaded"
                                        className="w-full h-auto"
                                    />
                                    <button
                                        onClick={() => {
                                            setUploadedImage('');
                                            setGeneratedPrompt('');
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                    >
                                        <Upload className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}

                            {uploadedImage && (
                                <button
                                    onClick={handleGeneratePrompt}
                                    disabled={isGenerating}
                                    className="w-full mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Analyzing Image...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Generate Detailed Prompt
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-emerald-400 mb-3">How it works</h3>
                            <ol className="space-y-2 text-sm text-zinc-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400 font-bold">1.</span>
                                    <span>Upload any image you want to analyze</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400 font-bold">2.</span>
                                    <span>AI analyzes every detail - lighting, composition, style, colors, mood</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400 font-bold">3.</span>
                                    <span>Get a comprehensive prompt that captures the entire image</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400 font-bold">4.</span>
                                    <span>Use the prompt to generate similar images anywhere</span>
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* Right Column - Generated Prompt */}
                    <div className="space-y-4">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 min-h-[500px] flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                    <h2 className="text-lg font-semibold text-white">Generated Prompt</h2>
                                </div>
                                {generatedPrompt && (
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check className="w-4 h-4 text-emerald-400" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {!generatedPrompt ? (
                                <div className="flex-1 flex items-center justify-center text-center">
                                    <div>
                                        <Sparkles className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                        <p className="text-zinc-500">Upload an image and click "Generate Prompt"</p>
                                        <p className="text-xs text-zinc-600 mt-2">Your detailed prompt will appear here</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                                    <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">{generatedPrompt}</p>
                                </div>
                            )}
                        </div>

                        {/* Tips */}
                        {generatedPrompt && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-emerald-400 mb-2">💡 Pro Tip</h3>
                                <p className="text-sm text-zinc-400">
                                    Use this prompt in any AI image generator (MidJourney, Stable Diffusion, DALL-E) to create images with the same style, composition, and mood!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Image Library Modal */}
            <ImageLibraryModal
                isOpen={showLibraryModal}
                onClose={() => setShowLibraryModal(false)}
                onSelect={(imageUrl) => setUploadedImage(imageUrl)}
                title="Select from My Creations"
            />
        </div>
    );
};
