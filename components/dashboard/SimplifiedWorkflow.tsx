import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Wand2, Download, Image as ImageIcon, Sparkles, X, Check, Zap, Loader2, ChevronDown, FolderOpen, XCircle, Bot, Send, Download as DownloadIcon, Video, Menu } from 'lucide-react';
import { vertexService } from "../../services/vertexService";
import { useAuth } from '../../context/AuthContext';
import { useClipboardPaste } from '../../hooks/useClipboardPaste';
import { storageService } from '../../services/storageService';
import { ImageLibraryModal } from '../common/ImageLibraryModal';
import { useStudio } from '../../context/StudioContext';
import { ChatMessage } from '../../types';
import { QualitySelector } from '../shared/QualitySelector';
import { SimpleModeSidebar } from './SimpleModeSidebar';
import { StyleLibraryModal } from './StyleLibraryModal';
import type { ImageQuality, QualityUsage } from '../../types/quality';
import { VideoGenerationModal } from '../shared/VideoGenerationModal';
import type { VideoGenerationConfig } from '../../types/video';
import { videoService } from '../../services/videoService';
import { falService } from '../../services/falService';

interface SimplifiedWorkflowProps {
    workflowId: string;
    onBack: () => void;
    onOpenDailyLimitModal?: () => void;
}

type AspectRatioType = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

const ASPECT_RATIOS: { value: AspectRatioType; label: string; css: string }[] = [
    { value: '1:1', label: 'Square (1:1)', css: 'aspect-square' },
    { value: '3:4', label: 'Portrait (3:4)', css: 'aspect-[3/4]' },
    // { value: '4:3', label: 'Landscape (4:3)', css: 'aspect-[4/3]' }, // Removed as requested
    { value: '9:16', label: 'Stories (9:16)', css: 'aspect-[9/16]' },
    { value: '16:9', label: 'Wide (16:9)', css: 'aspect-[16/9]' },
];

export const SimplifiedWorkflow: React.FC<SimplifiedWorkflowProps> = ({ workflowId, onBack, onOpenDailyLimitModal }) => {
    const [prompt, setPrompt] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedImage2, setUploadedImage2] = useState<string | null>(null); // For dual-upload workflows
    const [uploadedImages, setUploadedImages] = useState<string[]>([]); // For multiple reference images
    const [isDragging, setIsDragging] = useState(false);
    const [isDragging2, setIsDragging2] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('3:4');
    const [showAspectRatioDropdown, setShowAspectRatioDropdown] = useState(false);
    const [imageCount, setImageCount] = useState(1);
    const [showImageCountDropdown, setShowImageCountDropdown] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState<ImageQuality>('regular');
    const [qualityUsage, setQualityUsage] = useState<QualityUsage>({ hd: 0, qhd: 0 });
    const [selectedStyle, setSelectedStyle] = useState<string>('realistic');
    const [showStyleModal, setShowStyleModal] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [showLibraryModal2, setShowLibraryModal2] = useState(false);
    const [uploadMode, setUploadMode] = useState<'upload' | 'library'>('upload');
    const [uploadMode2, setUploadMode2] = useState<'upload' | 'library'>('upload');
    const { user, incrementGenerationsUsed } = useAuth();
    const { chatHistory, askChatbot, isBotReplying, addReferenceImages, resetChat } = useStudio();
    const [chatInput, setChatInput] = useState('');
    const [selectedChatImages, setSelectedChatImages] = useState<string[]>([]);
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef2 = useRef<HTMLInputElement>(null);
    const multipleImagesInputRef = useRef<HTMLInputElement>(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [selectedImageForVideo, setSelectedImageForVideo] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                    title: 'AI Generator',
                    subtitle: 'Create amazing images with AI',
                    gradient: 'from-emerald-600 to-teal-600',
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

    // Load quality usage on mount
    useEffect(() => {
        const loadQualityUsage = async () => {
            if (user?.id) {
                try {
                    const usage = await storageService.getQualityUsage(user.id);
                    setQualityUsage(usage);
                } catch (error) {
                    console.error('Failed to load quality usage:', error);
                }
            }
        };
        loadQualityUsage();
    }, [user?.id]);

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
            const optimized = await vertexService.optimizePrompt(prompt, context);
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

    // Enable clipboard paste (Ctrl+V / Cmd+V)
    useClipboardPaste({
        onPaste: (file) => {
            handleFileSelect(file);
        },
        enabled: true,
        accept: 'image/*'
    });

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

    // Handle multiple image uploads for reference images
    const handleReferenceImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        console.log('📸 [REFERENCE] Image select triggered, files:', files?.length || 0);

        if (files && files.length > 0) {
            const fileArray = Array.from(files) as File[];
            const loadPromises = fileArray.map((file) => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.result) {
                            console.log('✅ [REFERENCE] Image loaded:', file.name);
                            resolve(reader.result as string);
                        } else {
                            console.error('❌ [REFERENCE] No result for:', file.name);
                            reject(new Error(`Failed to load ${file.name}`));
                        }
                    };
                    reader.onerror = () => {
                        console.error('❌ [REFERENCE] Read error for:', file.name);
                        reject(new Error(`Failed to read ${file.name}`));
                    };
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(loadPromises)
                .then((loadedImages) => {
                    console.log('✅ [REFERENCE] All images loaded:', loadedImages.length);
                    setUploadedImages(prev => {
                        const updated = [...prev, ...loadedImages];
                        console.log('📸 [REFERENCE] Total reference images:', updated.length);
                        return updated;
                    });
                })
                .catch((error) => {
                    console.error('❌ [REFERENCE] Error loading images:', error);
                    // Still add successfully loaded images
                    Promise.allSettled(loadPromises)
                        .then((results) => {
                            const successful = results
                                .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
                                .map(r => r.value);
                            console.log('✅ [REFERENCE] Successfully loaded:', successful.length, 'images');
                            if (successful.length > 0) {
                                setUploadedImages(prev => [...prev, ...successful]);
                            }
                        });
                });
        } else {
            console.warn('⚠️ [REFERENCE] No files selected');
        }

        // Reset input to allow selecting same files again
        if (multipleImagesInputRef.current) {
            multipleImagesInputRef.current.value = '';
        }
    };

    const removeReferenceImage = (index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    // Chatbot handlers
    const handleChatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newImages: string[] = [];
            (Array.from(files) as File[]).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    newImages.push(dataUrl);
                    if (newImages.length === files.length) {
                        setSelectedChatImages(prev => [...prev, ...newImages]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        if (chatFileInputRef.current) {
            chatFileInputRef.current.value = '';
        }
    };

    const removeChatImage = (index: number) => {
        setSelectedChatImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() || selectedChatImages.length > 0) {
            if (selectedChatImages.length > 0 && addReferenceImages) {
                addReferenceImages(selectedChatImages);
            }
            askChatbot(chatInput, selectedChatImages);
            setChatInput('');
            setSelectedChatImages([]);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isBotReplying]);

    const handleGenerate = async () => {
        // For upscale, require an uploaded image
        if (workflowId === 'upscale' && !uploadedImage) {
            alert('Please upload an image to upscale');
            return;
        }

        // Allow generation if either prompt exists OR an image is uploaded
        if ((!prompt && !uploadedImage) || isGenerating) return;

        setIsGenerating(true);
        setGeneratedImages([]);

        try {
            // Helper function to convert base64 to File
            const base64ToFile = (base64: string, filename: string): File => {
                const arr = base64.split(',');
                const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new File([u8arr], filename, { type: mime });
            };

            // Special handling for upscale workflow
            if (workflowId === 'upscale' && uploadedImage) {
                console.log('🚀 Starting intelligent upscaling process...');
                const upscaledImage = await vertexService.upscaleImage(uploadedImage, prompt);
                setGeneratedImages([upscaledImage]);

                // Save to Cloudinary storage
                if (user) {
                    try {
                        const imageFile = base64ToFile(upscaledImage, `upscale_${Date.now()}.png`);
                        await storageService.uploadImage(imageFile, user.id, workflowId, prompt);
                        console.log('✅ Image saved to Cloudinary');
                    } catch (error) {
                        console.warn('⚠️ Failed to save image to Cloudinary:', error);
                        // Continue even if Cloudinary save fails
                    }

                    // Increment user's generation count (1 image)
                    const result = await incrementGenerationsUsed(1);
                    if (result.dailyLimitHit && onOpenDailyLimitModal) {
                        onOpenDailyLimitModal();
                        return;
                    }
                }
            } else {
                // Standard generation for all other workflows
                const imagePromises = Array.from({ length: config.singleOutput ? 1 : imageCount }).map(async (_, index) => {
                    try {
                        console.log('🎨 [FAL] Generating image with Nano Banana Pro (Flux Pro)...');
                        // Use FAL Service (Nano Banana Pro / Flux Pro)
                        // This replaces the Vertex AI call
                        const falUrl = await falService.generateImage(prompt || '', aspectRatio, 'fal-ai/flux-pro/v1.1');

                        // Convert Fal URL to Base64 to maintain compatibility with existing upload logic
                        // (The rest of the app expects base64 strings for display and upload)
                        const response = await fetch(falUrl);
                        const blob = await response.blob();
                        const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });

                        return base64;
                    } catch (error) {
                        console.error(`Failed to generate image ${index + 1}:`, error);
                        return null;
                    }
                });

                const results = await Promise.all(imagePromises);
                const validImages = results.filter((img): img is string => img !== null);

                setGeneratedImages(validImages);

                // Save to Cloudinary storage
                if (user && validImages.length > 0) {
                    try {
                        // Save all generated images
                        for (const imageB64 of validImages) {
                            const imageFile = base64ToFile(imageB64, `${workflowId}_${Date.now()}.png`);
                            await storageService.uploadImage(imageFile, user.id, workflowId, prompt);
                        }
                        console.log(`✅ ${validImages.length} image(s) saved to Cloudinary`);
                    } catch (error) {
                        console.warn('⚠️ Failed to save images to Cloudinary:', error);
                        // Continue even if Cloudinary save fails
                    }

                    // Track quality usage for HD/QHD
                    if (selectedQuality !== 'regular') {
                        try {
                            for (let i = 0; i < validImages.length; i++) {
                                await storageService.incrementQualityUsage(user.id, selectedQuality);
                            }
                            // Reload usage to update UI
                            const newUsage = await storageService.getQualityUsage(user.id);
                            setQualityUsage(newUsage);
                        } catch (error) {
                            console.error('Failed to track quality usage:', error);
                        }
                    }

                    // Increment user's generation count
                    const result = await incrementGenerationsUsed(validImages.length);
                    if (result.dailyLimitHit && onOpenDailyLimitModal) {
                        onOpenDailyLimitModal();
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Failed to generate images. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = (imageUrl: string, index: number) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-40 flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
            <SimpleModeSidebar
                config={config}
                prompt={prompt}
                setPrompt={setPrompt}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                uploadedImage={uploadedImage}
                setUploadedImage={setUploadedImage}
                uploadedImage2={uploadedImage2}
                setUploadedImage2={setUploadedImage2}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                imageCount={imageCount}
                setImageCount={setImageCount}
                selectedQuality={selectedQuality}
                setSelectedQuality={setSelectedQuality}
                qualityUsage={qualityUsage}
                user={user}
                onUploadClick={(ref) => ref.current?.click()}
                onLibraryClick={() => setShowLibraryModal(true)}
                fileInputRef={fileInputRef}
                fileInputRef2={fileInputRef2}
                uploadMode={uploadMode}
                setUploadMode={setUploadMode}
                onBack={onBack}
                uploadedImages={uploadedImages}
                setUploadedImages={setUploadedImages}
                multipleImagesInputRef={multipleImagesInputRef}
                selectedStyle={selectedStyle}
                onStyleClick={() => setShowStyleModal(true)}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-950">
                {/* Top Navigation Bar */}
                <div className="h-24 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-xl z-10 flex-shrink-0">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-4">
                        {/* User Credits / Profile could go here */}
                    </div>
                </div>

                {/* Scrollable Results Area */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto space-y-8">

                        {/* Results Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-500" />
                                    Generated Results
                                </h3>
                                <p className="text-sm text-zinc-500 mt-1">
                                    {generatedImages.length > 0
                                        ? `Showing ${generatedImages.length} generated image${generatedImages.length !== 1 ? 's' : ''}`
                                        : 'Your generated images will appear here'
                                    }
                                </p>
                            </div>

                            {generatedImages.length > 0 && (
                                <button
                                    onClick={() => setGeneratedImages([])}
                                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {/* Results Grid */}
                        {generatedImages.length > 0 ? (
                            <div className={`grid gap-6 ${aspectRatio === '9:16' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
                                aspectRatio === '16:9' ? 'grid-cols-1 md:grid-cols-2' :
                                    'grid-cols-2 md:grid-cols-3'
                                }`}>
                                {generatedImages.map((img, idx) => (
                                    <div key={idx} className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl transition-all hover:shadow-2xl hover:border-zinc-700">
                                        <img
                                            src={img}
                                            alt={`Generated ${idx + 1}`}
                                            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                            <div className="flex items-center gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                <button
                                                    onClick={() => handleDownload(img, idx)}
                                                    className="flex-1 py-2 bg-white text-black rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                                                >
                                                    <DownloadIcon className="w-3 h-3" />
                                                    Download
                                                </button>
                                                <button
                                                    className="p-2 bg-zinc-800/80 text-white rounded-lg hover:bg-zinc-700 backdrop-blur-sm transition-colors"
                                                    title="Upscale"
                                                >
                                                    <Zap className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedImageForVideo(img);
                                                        setShowVideoModal(true);
                                                    }}
                                                    className="p-2 bg-emerald-900/60 hover:bg-emerald-900/80 backdrop-blur-md border border-emerald-500/30 text-emerald-100 hover:text-white rounded-lg shadow-lg shadow-emerald-900/20 transition-all"
                                                    title="Generate Video"
                                                >
                                                    <Video className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/50 rounded-3xl bg-zinc-900/20">
                                <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6 shadow-inner">
                                    <Wand2 className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h3 className="text-lg font-medium text-zinc-300 mb-2">Ready to Create</h3>
                                <p className="text-sm text-zinc-500 max-w-md text-center">
                                    Configure your settings in the sidebar and click Generate to start creating amazing visuals.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hidden Inputs for Sidebar */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                />
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
                <input
                    ref={multipleImagesInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleReferenceImagesSelect}
                    className="hidden"
                />
            </div>

            {/* Modals */}
            {showLibraryModal && (
                <ImageLibraryModal
                    isOpen={showLibraryModal}
                    onClose={() => setShowLibraryModal(false)}
                    onSelect={(url) => {
                        setUploadedImage(url);
                        setShowLibraryModal(false);
                    }}
                    title="Select from My Creations"
                    workflowId={workflowId}
                    userId={user?.id || ''}
                />
            )}
            {showLibraryModal2 && (
                <ImageLibraryModal
                    isOpen={showLibraryModal2}
                    onClose={() => setShowLibraryModal2(false)}
                    onSelect={(url) => {
                        setUploadedImage2(url);
                        setShowLibraryModal2(false);
                    }}
                    title="Select from My Creations"
                    workflowId={workflowId}
                    userId={user?.id || ''}
                />
            )}
            <StyleLibraryModal
                isOpen={showStyleModal}
                onClose={() => setShowStyleModal(false)}
                onSelect={(style) => {
                    setSelectedStyle(style.id);
                    setShowStyleModal(false);
                }}
                currentStyleId={selectedStyle}
            />
            {showVideoModal && selectedImageForVideo && (
                <VideoGenerationModal
                    isOpen={showVideoModal}
                    onClose={() => {
                        setShowVideoModal(false);
                        setSelectedImageForVideo(null);
                    }}
                    sourceImage={selectedImageForVideo}
                    onGenerate={async (config: VideoGenerationConfig) => {
                        if (!user) return;
                        try {
                            console.log('Generating video with config:', config);
                            const videoUrl = await videoService.generateVideo(user.id, config, user.plan);
                            // Refresh usage
                            const newUsage = await storageService.getVideoUsage(user.id);
                            // You might want to update some local state here if needed

                            // Show success (VideoGenerationModal handles the alert, but we can do more here if needed)
                        } catch (error) {
                            console.error('Video generation failed:', error);
                            throw error; // Re-throw so modal can handle it
                        } finally {
                            setShowVideoModal(false);
                            setSelectedImageForVideo(null);
                        }
                    }}
                    userTier={user?.plan || 'free'}
                />
            )}
        </div>
    );
};
