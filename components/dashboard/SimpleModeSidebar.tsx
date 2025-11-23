import React, { useState, useRef } from 'react';
import {
    Settings, Image as ImageIcon, Upload, X, ChevronDown, ChevronRight,
    Wand2, LayoutTemplate, Layers, Zap, Crown, FolderOpen, ArrowLeft
} from 'lucide-react';
import { QualitySelector } from '../shared/QualitySelector';
import type { ImageQuality, QualityUsage } from '../../types/quality';
import { storageService } from '../../services/storageService';
import { STYLE_PRESETS } from '../pixelmuse/stylePresets';

interface SimpleModeSidebarProps {
    config: any;
    prompt: string;
    setPrompt: (value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    uploadedImage: string | null;
    setUploadedImage: (value: string | null) => void;
    uploadedImage2: string | null;
    setUploadedImage2: (value: string | null) => void;
    aspectRatio: string;
    setAspectRatio: (value: any) => void;
    imageCount: number;
    setImageCount: (value: number) => void;
    selectedQuality: ImageQuality;
    setSelectedQuality: (value: ImageQuality) => void;
    qualityUsage: QualityUsage;
    user: any;
    onUploadClick: (inputRef: React.RefObject<HTMLInputElement>) => void;
    onLibraryClick: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    fileInputRef2?: React.RefObject<HTMLInputElement>;
    uploadMode: 'upload' | 'library';
    setUploadMode: (mode: 'upload' | 'library') => void;
    onBack: () => void;
    uploadedImages: string[];
    setUploadedImages: React.Dispatch<React.SetStateAction<string[]>>;
    multipleImagesInputRef: React.RefObject<HTMLInputElement>;
    selectedStyle: string;
    onStyleClick: () => void;
}

const ASPECT_RATIOS = [
    { value: '1:1', label: 'Square (1:1)', icon: '▢' },
    { value: '3:4', label: 'Portrait (3:4)', icon: '▯' },
    { value: '4:3', label: 'Landscape (4:3)', icon: '▭' },
    { value: '9:16', label: 'Stories (9:16)', icon: '▯' },
    { value: '16:9', label: 'Wide (16:9)', icon: '▭' },
];

export const SimpleModeSidebar: React.FC<SimpleModeSidebarProps> = ({
    config,
    prompt,
    setPrompt,
    onGenerate,
    isGenerating,
    uploadedImage,
    setUploadedImage,
    uploadedImage2,
    setUploadedImage2,
    aspectRatio,
    setAspectRatio,
    imageCount,
    setImageCount,
    selectedQuality,
    setSelectedQuality,
    qualityUsage,
    user,
    onUploadClick,
    onLibraryClick,
    fileInputRef,
    fileInputRef2,
    uploadMode,
    setUploadMode,
    onBack,
    uploadedImages,
    setUploadedImages,
    multipleImagesInputRef,
    selectedStyle,
    onStyleClick
}) => {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        prompt: true,
        upload: true,
        settings: true
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="w-80 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 h-full flex flex-col overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="h-24 px-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Back to Home"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg shadow-emerald-500/20`}>
                            <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-zinc-100">{config.title}</h2>
                            <p className="text-[10px] text-zinc-400 font-medium">AI Generator</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 space-y-6">
                {/* Prompt Section */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prompt</label>
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your image..."
                            className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                        />
                        <button
                            className="absolute bottom-2 right-2 p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-emerald-400 transition-colors"
                            title="Enhance Prompt"
                        >
                            <Wand2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-3">
                    <div
                        className="flex items-center justify-between cursor-pointer group"
                        onClick={() => toggleSection('upload')}
                    >
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer">
                            Reference Image
                        </label>
                        {openSections.upload ? <ChevronDown className="w-3 h-3 text-zinc-600" /> : <ChevronRight className="w-3 h-3 text-zinc-600" />}
                    </div>

                    {openSections.upload && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                            {/* Upload Mode Toggle */}
                            <div className="flex p-1 bg-zinc-950 rounded-lg border border-zinc-800">
                                <button
                                    onClick={() => setUploadMode('upload')}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${uploadMode === 'upload'
                                        ? 'bg-zinc-800 text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    Upload
                                </button>
                                <button
                                    onClick={() => {
                                        setUploadMode('library');
                                        onLibraryClick();
                                    }}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${uploadMode === 'library'
                                        ? 'bg-zinc-800 text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    Library
                                </button>
                            </div>

                            {/* Main Upload */}
                            {!uploadedImage ? (
                                <div
                                    onClick={() => onUploadClick(fileInputRef)}
                                    className="border border-dashed border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Upload className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <p className="text-xs text-zinc-500">Upload Reference</p>
                                </div>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden border border-zinc-800 group">
                                    <img src={uploadedImage} alt="Reference" className="w-full h-40 object-cover" />
                                    <button
                                        onClick={() => setUploadedImage(null)}
                                        className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {/* Dual Upload if enabled */}
                            {config.dualUpload && (
                                <div className="pt-2 border-t border-zinc-800/50">
                                    <label className="text-[10px] text-zinc-500 mb-2 block">{config.upload2Label}</label>
                                    {!uploadedImage2 ? (
                                        <div
                                            onClick={() => fileInputRef2 && onUploadClick(fileInputRef2)}
                                            className="border border-dashed border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer"
                                        >
                                            <Upload className="w-3 h-3 text-zinc-500" />
                                            <p className="text-[10px] text-zinc-500">Upload Second Image</p>
                                        </div>
                                    ) : (
                                        <div className="relative rounded-xl overflow-hidden border border-zinc-800 group">
                                            <img src={uploadedImage2} alt="Reference 2" className="w-full h-32 object-cover" />
                                            <button
                                                onClick={() => setUploadedImage2(null)}
                                                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Additional References & Style Section - Combined */}
                            <div className="pt-2 border-t border-zinc-800/50">
                                {/* Labels on same line with separator - matching Upload/Library spacing */}
                                <div className="flex items-center mb-3">
                                    <label className="flex-1 text-[10px] text-zinc-500 font-medium text-center">Additional References</label>
                                    <div className="h-3 w-px bg-zinc-700"></div>
                                    <label className="flex-1 text-[10px] text-zinc-500 font-medium text-center">Style</label>
                                </div>

                                {/* Two-column layout matching the label spacing */}
                                <div className="flex gap-3">
                                    {/* Left side: Additional References (upload boxes) */}
                                    <div className="flex-1 space-y-2">
                                        {/* Uploaded Reference Images */}
                                        {uploadedImages.map((img, idx) => (
                                            <div key={idx} className="relative h-40 rounded-lg overflow-hidden border border-zinc-800 group">
                                                <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 p-0.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Upload Button */}
                                        <button
                                            onClick={() => multipleImagesInputRef.current?.click()}
                                            className="w-full h-40 rounded-lg border border-dashed border-zinc-800 flex items-center justify-center hover:bg-zinc-800/50 hover:border-zinc-700 transition-all"
                                            title="Add more images"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload className="w-6 h-6 text-zinc-500" />
                                                <span className="text-xs text-zinc-500">Add more images</span>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Right side: Style selector */}
                                    <div className="flex-1 flex items-start justify-center">
                                        <button
                                            onClick={onStyleClick}
                                            className="relative w-full h-40 rounded-lg overflow-hidden border-2 border-emerald-500/50 hover:border-emerald-500 transition-all group bg-zinc-900"
                                            title="Select style"
                                        >
                                            {/* Style Preview Image */}
                                            <img
                                                src={STYLE_PRESETS.find(s => s.id === selectedStyle)?.imageUrl || STYLE_PRESETS[0].imageUrl}
                                                alt={selectedStyle}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Overlay with style name */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center p-2">
                                                <span className="text-xs text-white font-semibold capitalize truncate w-full text-center">
                                                    {selectedStyle}
                                                </span>
                                            </div>
                                            {/* Indicator icon */}
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                <ChevronDown className="w-3 h-3 text-white" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Section */}
                <div className="space-y-3">
                    <div
                        className="flex items-center justify-between cursor-pointer group"
                        onClick={() => toggleSection('settings')}
                    >
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer">
                            Configuration
                        </label>
                        {openSections.settings ? <ChevronDown className="w-3 h-3 text-zinc-600" /> : <ChevronRight className="w-3 h-3 text-zinc-600" />}
                    </div>

                    {openSections.settings && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                            {/* Quality */}
                            <div className="space-y-2">
                                <label className="text-xs text-zinc-500 flex items-center gap-2">
                                    <Zap className="w-3 h-3" /> Model Quality
                                </label>
                                <QualitySelector
                                    selected={selectedQuality}
                                    onChange={setSelectedQuality}
                                    usage={qualityUsage}
                                    limits={storageService.getQualityLimits(user?.plan || 'free')}
                                    disabled={isGenerating}
                                />
                            </div>

                            {/* Aspect Ratio */}
                            {!config.hideAspectRatio && (
                                <div className="space-y-2">
                                    <label className="text-xs text-zinc-500 flex items-center gap-2">
                                        <LayoutTemplate className="w-3 h-3" /> Aspect Ratio
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {ASPECT_RATIOS.map((ratio) => (
                                            <button
                                                key={ratio.value}
                                                onClick={() => setAspectRatio(ratio.value)}
                                                className={`
                                                    p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-all
                                                    ${aspectRatio === ratio.value
                                                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                                    }
                                                `}
                                            >
                                                <span className="text-lg leading-none">{ratio.icon}</span>
                                                <span className="text-[10px]">{ratio.value}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Image Count */}
                            {!config.hideImageCount && (
                                <div className="space-y-2">
                                    <label className="text-xs text-zinc-500 flex items-center gap-2">
                                        <Layers className="w-3 h-3" /> Batch Size
                                    </label>
                                    <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                                        {[1, 2, 4].map((count) => (
                                            <button
                                                key={count}
                                                onClick={() => setImageCount(count)}
                                                className={`
                                                    flex-1 py-1.5 text-xs rounded-md transition-all
                                                    ${imageCount === count
                                                        ? 'bg-zinc-800 text-white shadow-sm'
                                                        : 'text-zinc-500 hover:text-zinc-300'
                                                    }
                                                `}
                                            >
                                                {count}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Generate Button */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky bottom-0">
                <button
                    onClick={onGenerate}
                    disabled={isGenerating || (!prompt.trim() && !uploadedImage)}
                    className={`
                        w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
                        ${isGenerating || (!prompt.trim() && !uploadedImage)
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]'
                        }
                    `}
                >
                    {isGenerating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-4 h-4" />
                            Generate
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
