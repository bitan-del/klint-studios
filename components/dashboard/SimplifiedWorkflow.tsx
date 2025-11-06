import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Wand2, Download, Image as ImageIcon, Sparkles, X, Check, Zap, Loader2, ChevronDown } from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';

interface SimplifiedWorkflowProps {
    workflowId: string;
    onBack: () => void;
}

type AspectRatioType = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

const ASPECT_RATIOS: { value: AspectRatioType; label: string; css: string }[] = [
    { value: '1:1', label: 'Square (1:1)', css: 'aspect-square' },
    { value: '3:4', label: 'Portrait (3:4)', css: 'aspect-[3/4]' },
    { value: '4:3', label: 'Landscape (4:3)', css: 'aspect-[4/3]' },
    { value: '9:16', label: 'Stories (9:16)', css: 'aspect-[9/16]' },
    { value: '16:9', label: 'Wide (16:9)', css: 'aspect-[16/9]' },
];

export const SimplifiedWorkflow: React.FC<SimplifiedWorkflowProps> = ({ workflowId, onBack }) => {
    const [prompt, setPrompt] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedImage2, setUploadedImage2] = useState<string | null>(null); // For dual-upload workflows
    const [isDragging, setIsDragging] = useState(false);
    const [isDragging2, setIsDragging2] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('3:4');
    const [showAspectRatioDropdown, setShowAspectRatioDropdown] = useState(false);
    const [imageCount, setImageCount] = useState(4);
    const [showImageCountDropdown, setShowImageCountDropdown] = useState(false);
    const { user, incrementGenerationsUsed } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef2 = useRef<HTMLInputElement>(null);

    // Check for gallery image from localStorage on mount
    useEffect(() => {
        const galleryImage = localStorage.getItem('gallery_image_for_feature');
        const galleryFeature = localStorage.getItem('gallery_feature');
        
        // Only load if it's for this workflow
        if (galleryImage && galleryFeature === workflowId) {
            setUploadedImage(galleryImage);
            // Clear localStorage after loading
            localStorage.removeItem('gallery_image_for_feature');
            localStorage.removeItem('gallery_feature');
        }
    }, [workflowId]);

    const getWorkflowConfig = () => {
        switch (workflowId) {
            case 'ai-photoshoot':
                return {
                    title: 'AI Photoshoot',
                    subtitle: 'Create stunning fashion and lifestyle imagery',
                    gradient: 'from-emerald-600 to-teal-600',
                    presets: [
                        { id: 'urban', label: 'Urban Street', description: 'Modern city vibes, concrete jungle aesthetic' },
                        { id: 'natural', label: 'Natural Light', description: 'Soft outdoor lighting, organic feel' },
                        { id: 'studio', label: 'Studio Pro', description: 'Clean backdrop, professional lighting' },
                        { id: 'golden', label: 'Golden Hour', description: 'Warm sunset glow, cinematic mood' },
                        { id: 'editorial', label: 'Fashion Editorial', description: 'High-fashion magazine style' },
                        { id: 'lifestyle', label: 'Lifestyle', description: 'Candid, authentic moments' },
                    ],
                };
            case 'product-photography':
                return {
                    title: 'Product Photography',
                    subtitle: 'Studio-grade product visuals',
                    gradient: 'from-emerald-600 to-teal-600',
                    presets: [
                        { id: 'white-bg', label: 'Clean White', description: 'Pure white background, e-commerce ready' },
                        { id: 'lifestyle', label: 'Lifestyle Scene', description: 'Product in use, contextual setting' },
                        { id: 'minimal', label: 'Minimal Aesthetic', description: 'Simple, elegant presentation' },
                        { id: 'luxury', label: 'Luxury Display', description: 'Premium materials, sophisticated' },
                        { id: 'unboxing', label: 'Unboxing', description: 'Fresh out of box presentation' },
                        { id: 'flatlay', label: 'Flat Lay', description: 'Top-down arrangement view' },
                    ],
                };
            case 'virtual-tryon':
                return {
                    title: 'Virtual Try-On',
                    subtitle: 'See products on different models',
                    gradient: 'from-emerald-600 to-teal-600',
                    dualUpload: true,
                    upload1Label: 'Upload Model Image',
                    upload2Label: 'Upload Clothing/Product',
                    presets: [
                        { id: 'casual', label: 'Casual Wear', description: 'Everyday, relaxed styling' },
                        { id: 'formal', label: 'Professional', description: 'Business and formal attire' },
                        { id: 'athleisure', label: 'Athleisure', description: 'Active lifestyle, sporty vibe' },
                        { id: 'street', label: 'Streetwear', description: 'Urban fashion, trendy style' },
                        { id: 'elegant', label: 'Elegant Evening', description: 'Sophisticated, upscale look' },
                        { id: 'summer', label: 'Summer Casual', description: 'Light, breezy, seasonal' },
                    ],
                };
            case 'style-transfer':
                return {
                    title: 'Style Transfer',
                    subtitle: 'Cinematic color grading',
                    gradient: 'from-emerald-600 to-teal-600',
                    dualUpload: true,
                    upload1Label: 'Upload Reference Style',
                    upload2Label: 'Upload Your Image',
                    presets: [
                        { id: 'cinematic', label: 'Cinematic', description: 'Film-grade color grading' },
                        { id: 'vintage', label: 'Vintage Film', description: 'Retro analog aesthetic' },
                        { id: 'moody', label: 'Moody Dark', description: 'Deep shadows, rich tones' },
                        { id: 'bright', label: 'Bright & Airy', description: 'Light, ethereal feel' },
                        { id: 'vibrant', label: 'Vibrant Pop', description: 'Saturated, punchy colors' },
                        { id: 'monochrome', label: 'Monochrome', description: 'Black and white elegance' },
                    ],
                };
            case 'upscale':
                return {
                    title: 'Image Upscale',
                    subtitle: 'AI-powered resolution enhancement',
                    gradient: 'from-emerald-600 to-teal-600',
                    singleOutput: true, // Only 1 output
                    hideImageCount: true, // Don't show image count dropdown
                    hideAspectRatio: true, // Don't show aspect ratio dropdown (use source dimensions)
                    presets: [
                        { id: '2x', label: '2× Enhancement', description: 'Double resolution with AI detail' },
                        { id: '4x', label: '4× Enhancement', description: 'Quadruple resolution, maximum quality' },
                        { id: 'detail', label: 'Detail Boost', description: 'Enhance sharpness and clarity' },
                        { id: 'denoise', label: 'Denoise & Upscale', description: 'Remove noise while enhancing' },
                    ],
                };
            default:
                return {
                    title: workflowId,
                    subtitle: 'AI-powered creative workflow',
                    gradient: 'from-emerald-600 to-teal-600',
                    dualUpload: false,
                    presets: [],
                };
        }
    };

    const config = getWorkflowConfig();

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setShowAspectRatioDropdown(false);
            setShowImageCountDropdown(false);
        };
        
        if (showAspectRatioDropdown || showImageCountDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showAspectRatioDropdown, showImageCountDropdown]);

    // Clear generated images when aspect ratio or image count changes
    // This provides visual feedback that user needs to regenerate
    useEffect(() => {
        setGeneratedImages([]);
    }, [aspectRatio, imageCount]);

    const handleOptimizePrompt = async () => {
        if (!prompt.trim()) return;
        
        setIsOptimizing(true);
        try {
            const context = `${config.title} - ${config.subtitle}`;
            const optimized = await geminiService.optimizePrompt(prompt, context);
            setPrompt(optimized);
        } catch (error) {
            console.error('Failed to optimize prompt:', error);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleFileSelect = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleGenerate = async () => {
        // For upscale, require an uploaded image
        if (workflowId === 'upscale' && !uploadedImage) {
            alert('Please upload an image to upscale');
            return;
        }
        
        if (!prompt || isGenerating) return;
        
        setIsGenerating(true);
        setGeneratedImages([]);
        
        try {
            // Special handling for upscale workflow
            if (workflowId === 'upscale' && uploadedImage) {
                console.log('🚀 Starting intelligent upscaling process...');
                const upscaledImage = await geminiService.upscaleImage(uploadedImage, prompt);
                setGeneratedImages([upscaledImage]);
                
                // Increment user's generation count (1 image)
                if (user) {
                    await incrementGenerationsUsed(1);
                }
            } else {
                // Standard generation for all other workflows
                const imagePromises = Array.from({ length: config.singleOutput ? 1 : imageCount }).map(async (_, index) => {
                    try {
                        const imageB64 = await geminiService.generateSimplifiedPhotoshoot(
                            prompt,
                            aspectRatio,
                            uploadedImage // Pass the uploaded image (can be null)
                        );
                        return imageB64;
                    } catch (error) {
                        console.error(`Failed to generate image ${index + 1}:`, error);
                        return null;
                    }
                });
                
                const results = await Promise.all(imagePromises);
                const validImages = results.filter((img): img is string => img !== null);
                
                setGeneratedImages(validImages);
                
                // Increment user's generation count
                if (user) {
                    await incrementGenerationsUsed(validImages.length);
                }
            }
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Failed to generate images. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = (imageB64: string, index: number) => {
        const link = document.createElement('a');
        link.href = imageB64;
        link.download = `klint-studios-${Date.now()}-${index + 1}.png`;
        link.click();
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Animated background */}
            <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/20 via-zinc-950 to-teal-950/20 pointer-events-none" />
            
            {/* Header */}
            <div className="relative z-10 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl sticky top-0">
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                            <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-100">{config.title}</h2>
                            <p className="text-xs text-zinc-400">{config.subtitle}</p>
                        </div>
                    </div>

                    <div className="w-20" /> {/* Spacer for alignment */}
                </div>
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Upload & Prompt */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Upload Area - Conditional Single or Dual */}
                        {config.dualUpload ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* First Upload Box */}
                                <div className="group">
                                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                                        {config.upload1Label}
                                    </label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileInputChange}
                                        className="hidden"
                                    />
                                    
                                    {uploadedImage ? (
                                        <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800/50 p-2">
                                            <img 
                                                src={uploadedImage} 
                                                alt="Uploaded 1" 
                                                className="w-full h-64 object-contain rounded-xl bg-zinc-900"
                                            />
                                            <button
                                                onClick={() => setUploadedImage(null)}
                                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center hover:bg-zinc-800 transition-colors border border-zinc-700"
                                            >
                                                <X className="w-4 h-4 text-zinc-300" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`
                                                relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                                                h-64 flex flex-col items-center justify-center
                                                ${isDragging 
                                                    ? 'border-emerald-500 bg-emerald-500/10' 
                                                    : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-all duration-300
                                                ${isDragging 
                                                    ? `bg-gradient-to-br ${config.gradient}` 
                                                    : 'bg-zinc-800 group-hover:bg-zinc-700'
                                                }
                                            `}>
                                                <Upload className="w-6 h-6 text-zinc-400" />
                                            </div>
                                            <p className="text-sm font-medium mb-2 text-zinc-300">
                                                {isDragging ? 'Drop here' : 'Click to upload'}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                PNG, JPG, WEBP
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Second Upload Box */}
                                <div className="group">
                                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                                        {config.upload2Label}
                                    </label>
                                    <input
                                        ref={fileInputRef2}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file && file.type.startsWith('image/')) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    setUploadedImage2(event.target?.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    
                                    {uploadedImage2 ? (
                                        <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800/50 p-2">
                                            <img 
                                                src={uploadedImage2} 
                                                alt="Uploaded 2" 
                                                className="w-full h-64 object-contain rounded-xl bg-zinc-900"
                                            />
                                            <button
                                                onClick={() => setUploadedImage2(null)}
                                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center hover:bg-zinc-800 transition-colors border border-zinc-700"
                                            >
                                                <X className="w-4 h-4 text-zinc-300" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef2.current?.click()}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setIsDragging2(true);
                                            }}
                                            onDragLeave={() => setIsDragging2(false)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setIsDragging2(false);
                                                const file = e.dataTransfer.files[0];
                                                if (file && file.type.startsWith('image/')) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        setUploadedImage2(event.target?.result as string);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className={`
                                                relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                                                h-64 flex flex-col items-center justify-center
                                                ${isDragging2 
                                                    ? 'border-emerald-500 bg-emerald-500/10' 
                                                    : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-all duration-300
                                                ${isDragging2 
                                                    ? `bg-gradient-to-br ${config.gradient}` 
                                                    : 'bg-zinc-800 group-hover:bg-zinc-700'
                                                }
                                            `}>
                                                <Upload className="w-6 h-6 text-zinc-400" />
                                            </div>
                                            <p className="text-sm font-medium mb-2 text-zinc-300">
                                                {isDragging2 ? 'Drop here' : 'Click to upload'}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                PNG, JPG, WEBP
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="group">
                                <label className="block text-sm font-medium text-zinc-300 mb-3">
                                    Upload Image {workflowId === 'upscale' ? '(Required)' : (workflowId === 'ai-photoshoot' || workflowId === 'virtual-tryon' ? '(Recommended)' : '(Optional)')}
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />
                                
                                {uploadedImage ? (
                                    <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800/50 p-2">
                                        <img 
                                            src={uploadedImage} 
                                            alt="Uploaded" 
                                            className="w-full h-80 object-contain rounded-xl bg-zinc-900"
                                        />
                                        <button
                                            onClick={() => setUploadedImage(null)}
                                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center hover:bg-zinc-800 transition-colors border border-zinc-700"
                                        >
                                            <X className="w-4 h-4 text-zinc-300" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`
                                            relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                                            h-80 flex flex-col items-center justify-center
                                            ${isDragging 
                                                ? 'border-emerald-500 bg-emerald-500/10' 
                                                : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-16 h-16 rounded-2xl mb-6 flex items-center justify-center transition-all duration-300
                                            ${isDragging 
                                                ? `bg-gradient-to-br ${config.gradient}` 
                                                : 'bg-zinc-800 group-hover:bg-zinc-700'
                                            }
                                        `}>
                                            <Upload className="w-8 h-8 text-zinc-400" />
                                        </div>
                                        <p className="text-base font-medium mb-2 text-zinc-300">
                                            {isDragging ? 'Drop your image here' : 'Click to upload or drag and drop'}
                                        </p>
                                        <p className="text-sm text-zinc-500">
                                            PNG, JPG, WEBP up to 10MB
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Prompt Input */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-zinc-300">Describe Your Vision</label>
                                <button
                                    onClick={handleOptimizePrompt}
                                    disabled={!prompt.trim() || isOptimizing}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {isOptimizing ? 'Optimizing...' : 'AI Enhance'}
                                </button>
                            </div>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the style, mood, lighting, and composition you want..."
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-all"
                                rows={4}
                            />
                        </div>

                        {/* Generate Button */}
                        <button 
                            onClick={handleGenerate}
                            className={`
                                w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300
                                bg-emerald-500 hover:bg-emerald-600 text-black hover:shadow-2xl hover:shadow-emerald-500/30 hover:scale-[1.02]
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                            `}
                            disabled={!prompt || isGenerating}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5" />
                                        <span>Generate</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </div>

                    {/* Right Column - Presets */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-3">Quick Styles</label>
                            <div className="space-y-2">
                                {config.presets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => {
                                            setSelectedPreset(preset.id);
                                            setPrompt(preset.description);
                                        }}
                                        className={`
                                            w-full text-left px-4 py-3 rounded-xl transition-all duration-300 group
                                            ${selectedPreset === preset.id
                                                ? `bg-gradient-to-r ${config.gradient} shadow-lg border-transparent`
                                                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-sm font-medium ${selectedPreset === preset.id ? 'text-white' : 'text-zinc-300'}`}>
                                                {preset.label}
                                            </span>
                                            {selectedPreset === preset.id && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <p className={`text-xs leading-relaxed ${selectedPreset === preset.id ? 'text-white/80' : 'text-zinc-500'}`}>
                                            {preset.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
                            <h4 className="text-sm font-semibold mb-3 text-zinc-300 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                Pro Tips
                            </h4>
                            <ul className="space-y-3 text-xs text-zinc-400">
                                <li className="flex gap-2">
                                    <span className="text-emerald-400">→</span>
                                    <span>Use high-resolution images for best results</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-400">→</span>
                                    <span>Be specific about lighting and atmosphere</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-400">→</span>
                                    <span>Experiment with different presets</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Results Area - Higgsfield Style Grid */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-zinc-100">
                            Generated Results
                            {generatedImages.length > 0 && (
                                <span className="ml-3 text-sm text-emerald-400">({generatedImages.length} images)</span>
                            )}
                        </h3>
                        <div className="flex items-center gap-2">
                            {/* Aspect Ratio Dropdown - Hide for certain workflows */}
                            {!config.hideAspectRatio && (
                                <div className="relative">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAspectRatioDropdown(!showAspectRatioDropdown);
                                        }}
                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-all border border-zinc-700 flex items-center gap-2"
                                    >
                                        <span>{aspectRatio}</span>
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                    {showAspectRatioDropdown && (
                                        <div className="absolute top-full mt-1 right-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[140px]">
                                            {ASPECT_RATIOS.map((ar) => (
                                                <button
                                                    key={ar.value}
                                                    onClick={() => {
                                                        setAspectRatio(ar.value);
                                                        setShowAspectRatioDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                                        aspectRatio === ar.value
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'text-zinc-300 hover:bg-zinc-800'
                                                    }`}
                                                >
                                                    {ar.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Image Count Dropdown - Hide for certain workflows */}
                            {!config.hideImageCount && (
                                <div className="relative">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowImageCountDropdown(!showImageCountDropdown);
                                        }}
                                        className="px-3 py-1.5 bg-emerald-500/20 rounded-lg text-xs text-emerald-400 font-medium border border-emerald-500/50 flex items-center gap-2"
                                    >
                                        <span>{imageCount} images</span>
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                    {showImageCountDropdown && (
                                        <div className="absolute top-full mt-1 right-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50">
                                            {[1, 2, 4, 6, 8].map((count) => (
                                                <button
                                                    key={count}
                                                    onClick={() => {
                                                        setImageCount(count);
                                                        setShowImageCountDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                                        imageCount === count
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'text-zinc-300 hover:bg-zinc-800'
                                                    }`}
                                                >
                                                    {count} {count === 1 ? 'image' : 'images'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Higgsfield-style Dynamic Grid */}
                    <div className={`grid gap-4 ${config.singleOutput ? 'grid-cols-1' : (imageCount <= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2')}`}>
                        {Array.from({ length: config.singleOutput ? 1 : imageCount }).map((_, i) => {
                            const currentAspectRatio = ASPECT_RATIOS.find(ar => ar.value === aspectRatio);
                            return (
                            <div 
                                key={i}
                                className={`${currentAspectRatio?.css || 'aspect-[3/4]'} rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group hover:border-emerald-500 transition-all relative overflow-hidden`}
                            >
                                {/* Show generated image or placeholder */}
                                {generatedImages[i] ? (
                                    <>
                                        <img 
                                            src={generatedImages[i]} 
                                            alt={`Generated ${i + 1}`}
                                            className="w-full h-full object-cover rounded-2xl"
                                        />
                                        {/* Hover overlay with actions */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                            <div className="flex gap-2 w-full">
                                                <button 
                                                    onClick={() => handleDownload(generatedImages[i], i)}
                                                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs text-black font-medium backdrop-blur-sm transition-all flex items-center justify-center gap-1"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : isGenerating ? (
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
                                        <p className="text-xs text-zinc-400">Generating...</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/10 transition-all">
                                            <ImageIcon className="w-6 h-6 text-zinc-600 group-hover:text-emerald-400 transition-all" />
                                        </div>
                                        <p className="text-xs text-zinc-500">Image {i + 1}</p>
                                    </div>
                                )}
                            </div>
                        );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
