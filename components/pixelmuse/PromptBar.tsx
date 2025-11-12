import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, MinusIcon, AspectRatioIcon, SparkleIcon, ImageIcon, CloseIcon } from './icons';

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
}

export const PromptBar: React.FC<PromptBarProps> = ({ 
  prompt, setPrompt, onGenerate, isLoading, imageCount, setImageCount,
  aspectRatio, setAspectRatio, onEnhancePrompt, isEnhancing,
  inputImages, onImageUpload, onRemoveInputImage
}) => {
  const [isAspectOpen, setIsAspectOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aspectRatios = ["9:16", "16:9", "4:3", "3:4", "1:1"];
  
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
    <div className="sticky bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-lg">
      <div className="max-w-4xl mx-auto bg-[#1e1f20] rounded-2xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start space-x-4">
          <div className="flex items-center space-x-2">
              {inputImages.map((image, index) => (
                  <div key={index} className="relative w-16 h-16 flex-shrink-0">
                      <img src={image} alt={`input preview ${index}`} className="w-full h-full object-cover rounded-lg"/>
                      <button 
                          onClick={() => onRemoveInputImage(index)}
                          className="absolute -top-1 -right-1 bg-gray-800 rounded-full p-0.5 hover:bg-red-500 transition-colors"
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
                  className="w-16 h-16 bg-[#2c2d2f] border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center flex-shrink-0 hover:border-gray-400 transition-colors"
                  aria-label="Add images"
              >
                  <ImageIcon />
              </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cinematic shot of a lone astronaut..."
            className="w-full h-16 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none resize-none text-base"
            disabled={isLoading || isEnhancing}
          />
          <button
            onClick={onGenerate}
            disabled={isLoading || isEnhancing || !hasContent}
            className="self-end px-6 py-3 bg-[#a2ff00] text-black font-semibold rounded-xl flex items-center space-x-2 transition-transform duration-200 ease-in-out hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span>Generate</span>
            )}
          </button>
        </div>
        <div className="flex items-center space-x-2 mt-4 text-sm text-gray-400">
          <div 
            className="flex items-center space-x-1 px-3 py-1.5 bg-[#2c2d2f] rounded-lg"
            title="Batch select"
          >
            <button onClick={() => handleCountChange(-1)} className="hover:text-white disabled:text-gray-600" disabled={imageCount <= 1 || isLoading} aria-label="Decrease image count"><MinusIcon /></button>
            <span className="w-8 text-center text-white tabular-nums">{imageCount}/4</span>
            <button onClick={() => handleCountChange(1)} className="hover:text-white disabled:text-gray-600" disabled={imageCount >= 4 || isLoading} aria-label="Increase image count"><PlusIcon /></button>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsAspectOpen(!isAspectOpen)} 
              className="flex items-center space-x-2 px-3 py-1.5 bg-[#2c2d2f] rounded-lg hover:bg-[#3a3b3d]"
              disabled={isLoading || isEnhancing}
            >
              <AspectRatioIcon />
              <span>{aspectRatio}</span>
            </button>
            {isAspectOpen && (
              <div className="absolute bottom-full mb-2 w-28 bg-[#3a3b3d] rounded-lg p-1 shadow-lg border border-white/10">
                {aspectRatios.map(ratio => (
                    <button 
                        key={ratio}
                        onClick={() => { setAspectRatio(ratio); setIsAspectOpen(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-[#4c4d4f] ${aspectRatio === ratio ? 'text-white bg-[#4c4d4f]' : 'text-gray-300'}`}
                    >
                        {ratio}
                    </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#2c2d2f] rounded-lg">
            <span>Unlimited</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" defaultChecked/>
              <div className="w-9 h-5 bg-gray-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#a2ff00]"></div>
            </label>
          </div>
          
          <button 
            className="flex items-center space-x-2 px-3 py-1.5 bg-[#2c2d2f] rounded-lg hover:bg-[#3a3b3d] disabled:text-gray-600 disabled:cursor-not-allowed"
            onClick={onEnhancePrompt}
            disabled={isEnhancing || isLoading || !prompt || inputImages.length > 0}
            title={inputImages.length > 0 ? "Cannot enhance prompt with images" : "Enhance prompt"}
          >
            {isEnhancing ? (
               <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : <SparkleIcon />}
            <span>Enhance prompt</span>
          </button>
        </div>
      </div>
    </div>
  );
};

