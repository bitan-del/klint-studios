import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, MinusIcon, AspectRatioIcon, SparkleIcon, ImageIcon, CloseIcon } from './icons';
import { QualitySelector } from '../shared/QualitySelector';
import type { ImageQuality, QualityUsage } from '../../types/quality';
import { storageService } from '../../services/storageService';
import { STYLE_PRESETS, DEFAULT_STYLE, type StylePreset } from './stylePresets';
import { StyleLibraryModal } from '../dashboard/StyleLibraryModal';

interface PromptBarProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  imageCount: number;
  setImageCount: (count: number) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  onEnhancePrompt: () => void;
  isEnhancing: boolean;
  inputImages: string[];
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveInputImage: (index: number) => void;
  selectedQuality?: ImageQuality;
  onQualityChange?: (quality: ImageQuality) => void;
  qualityUsage?: QualityUsage;
  userPlan?: string;
  selectedStyle?: string;
  onStyleChange?: (style: string) => void;
}

export const PromptBar: React.FC<PromptBarProps> = ({
  prompt, setPrompt, onGenerate, isLoading, imageCount, setImageCount,
  aspectRatio, setAspectRatio, onEnhancePrompt, isEnhancing,
  inputImages, onImageUpload, onRemoveInputImage,
  selectedQuality, onQualityChange, qualityUsage, userPlan,
  selectedStyle = DEFAULT_STYLE.id, onStyleChange
}) => {
  const [isAspectOpen, setIsAspectOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aspectRatios = ["9:16", "16:9", "4:3", "3:4", "1:1"];

  const currentStyle = STYLE_PRESETS.find(s => s.id === selectedStyle) || DEFAULT_STYLE;

  const handleStyleSelect = (style: StylePreset) => {
    if (onStyleChange) {
      onStyleChange(style.id);
    }
    setIsStyleModalOpen(false);
  };

  const handleCountChange = (delta: number) => {
    setImageCount(Math.max(1, Math.min(4, imageCount + delta)));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAspectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasContent = prompt.trim().length > 0 || inputImages.length > 0;

  return (
    <div className="sticky bottom-0 left-0 right-0 p-4">
      <div className="max-w-6xl mx-auto bg-zinc-900/95 backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-zinc-800">
        {/* Single horizontal line layout */}
        <div className="flex items-center gap-3">
          {/* Reference Images */}
          <div className="flex items-center gap-2">
            {inputImages.map((image, index) => (
              <div key={index} className="relative w-12 h-12 flex-shrink-0">
                <img src={image} alt={`input preview ${index}`} className="w-full h-full object-cover rounded-lg border border-zinc-700" />
                <button
                  onClick={() => onRemoveInputImage(index)}
                  className="absolute -top-1 -right-1 bg-zinc-800 rounded-full p-0.5 hover:bg-red-500 transition-colors border border-zinc-700"
                  aria-label="Remove image"
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 bg-zinc-800 border border-dashed border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0 hover:border-zinc-600 hover:bg-zinc-700 transition-colors"
              aria-label="Add reference images"
              title="Add reference images"
            >
              <ImageIcon />
            </button>
          </div>

          {/* Style Selector */}
          {onStyleChange && (
            <button
              onClick={() => setIsStyleModalOpen(true)}
              className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 border-emerald-500/50 hover:border-emerald-500 transition-all group cursor-pointer"
              aria-label="Select style"
              title={`Style: ${currentStyle.label}`}
            >
              <img
                src={currentStyle.imageUrl}
                alt={currentStyle.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-1">
                <span className="text-[8px] font-semibold text-white drop-shadow-lg text-center truncate w-full">
                  {currentStyle.label}
                </span>
              </div>
            </button>
          )}

          {/* Prompt Input */}
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cinematic shot of a lone astronaut..."
            className="flex-1 h-12 bg-zinc-800 border border-zinc-700 rounded-lg px-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm"
            disabled={isLoading || isEnhancing}
          />

          {/* Controls in one line */}
          <div className="flex items-center gap-2">
            {/* Image Count */}
            <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg">
              <button onClick={() => handleCountChange(-1)} className="text-zinc-400 hover:text-white disabled:text-zinc-600" disabled={imageCount <= 1 || isLoading} aria-label="Decrease image count"><MinusIcon /></button>
              <span className="w-6 text-center text-zinc-200 tabular-nums text-xs">{imageCount}/4</span>
              <button onClick={() => handleCountChange(1)} className="text-zinc-400 hover:text-white disabled:text-zinc-600" disabled={imageCount >= 4 || isLoading} aria-label="Increase image count"><PlusIcon /></button>
            </div>

            {/* Aspect Ratio */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsAspectOpen(!isAspectOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
                disabled={isLoading || isEnhancing}
              >
                <AspectRatioIcon />
                <span>{aspectRatio}</span>
              </button>
              {isAspectOpen && (
                <div className="absolute bottom-full mb-2 w-24 bg-zinc-800 border border-zinc-700 rounded-lg p-1 shadow-xl">
                  {aspectRatios.map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => { setAspectRatio(ratio); setIsAspectOpen(false); }}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${aspectRatio === ratio ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
                        }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Selector */}
            {selectedQuality && onQualityChange && qualityUsage && (
              <QualitySelector
                selected={selectedQuality}
                onChange={onQualityChange}
                usage={qualityUsage}
                limits={storageService.getQualityLimits(userPlan || 'free')}
                disabled={isLoading}
              />
            )}

            {/* Enhance Prompt */}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 text-zinc-200 text-xs transition-colors disabled:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onEnhancePrompt}
              disabled={isEnhancing || isLoading || !prompt || inputImages.length > 0}
              title={inputImages.length > 0 ? "Cannot enhance prompt with images" : "Enhance prompt"}
            >
              {isEnhancing ? (
                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : <SparkleIcon />}
              <span>Enhance</span>
            </button>

            {/* Generate Button */}
            <button
              onClick={onGenerate}
              disabled={isLoading || isEnhancing || !hasContent}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg flex items-center gap-2 transition-all hover:scale-105 disabled:bg-zinc-700 disabled:cursor-not-allowed disabled:scale-100 disabled:text-zinc-500 text-sm"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              <span>Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Style Library Modal */}
      {onStyleChange && (
        <StyleLibraryModal
          isOpen={isStyleModalOpen}
          onClose={() => setIsStyleModalOpen(false)}
          onSelect={handleStyleSelect}
          currentStyleId={selectedStyle}
        />
      )}
    </div>
  );
};

