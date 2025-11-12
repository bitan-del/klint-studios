import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download, Loader2, RefreshCw, Upload, Image as ImageIcon, X, PenTool, Film, Share2, RotateCcw, ChevronRight } from 'lucide-react';
import { getPixelMuseGenerations, getPixelMuseProfiles, createPixelMuseProfile } from '../../services/pixelMuseService';
import type { PixelMuseProfile, PixelMuseGeneration } from '../../types/pixelMuse';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface PixelMuseEditorProps {
  onBack: () => void;
}

export const PixelMuseEditor: React.FC<PixelMuseEditorProps> = ({
  onBack,
}) => {
  const [profile, setProfile] = useState<PixelMuseProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('9:16');
  const [selectedModel, setSelectedModel] = useState<string>('NANO BANANA');
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [numberOfImages, setNumberOfImages] = useState(4);
  const [pastGenerations, setPastGenerations] = useState<PixelMuseGeneration[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadOrCreateProfile();
  }, []);

  useEffect(() => {
    if (profile?.id) {
      loadPastGenerations();
    }
  }, [profile?.id]);

  const loadOrCreateProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const profiles = await getPixelMuseProfiles();
      
      if (profiles.length > 0) {
        const firstProfile = profiles[0];
        setProfile(firstProfile);
        setReferenceImages(firstProfile.reference_images || []);
      } else {
        const newProfile = await createPixelMuseProfile('My Profile');
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading/creating profile:', error);
      try {
        const newProfile = await createPixelMuseProfile('My Profile');
        setProfile(newProfile);
      } catch (createError) {
        console.error('Failed to create profile:', createError);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadPastGenerations = async () => {
    if (!profile?.id) return;
    
    try {
      const generations = await getPixelMuseGenerations(profile.id);
      setPastGenerations(generations);
      if (generations.length > 0 && activeImageIndex === null && generatedImages.length === 0) {
        setActiveImageIndex(0);
      }
    } catch (error) {
      console.error('Error loading past generations:', error);
    }
  };

  const handleReferenceImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !profile) return;

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { storageService } = await import('../../services/storageService');
      const { updatePixelMuseProfile } = await import('../../services/pixelMuseService');
      
      const uploadPromises = Array.from(files).map(async (file) => {
        const imageData = await storageService.uploadImage(
          file,
          user.id,
          'pixel-muse',
          `PixelMuse reference for ${profile.name}`,
          {
            pixel_muse_profile_id: profile.id,
            profile_name: profile.name,
            type: 'pixel_muse_reference'
          }
        );
        return imageData.cloudinary_url;
      });

      const urls = await Promise.all(uploadPromises);
      const newImages = [...referenceImages, ...urls];
      setReferenceImages(newImages);

      const updated = await updatePixelMuseProfile(profile.id, {
        reference_images: newImages,
      });
      setProfile(updated);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generationPrompt.trim() || !profile) return;

    try {
      setIsGenerating(true);
      setGeneratedImages([]);
      
      const promptLower = generationPrompt.toLowerCase();
      const numberMatch = promptLower.match(/(\d+)/);
      const finalCount = numberMatch ? Math.min(Math.max(parseInt(numberMatch[1], 10), 1), 10) : (isUnlimited ? 10 : numberOfImages);
      
      const geminiModule = await import('../../services/geminiService');
      const { geminiService } = geminiModule;
      
      const batchId = crypto.randomUUID();
      const referenceImageUrls = referenceImages.length > 0 ? referenceImages : profile.reference_images || [];
      const imagesToUse = referenceImageUrls.slice(0, 5);
      const referenceImagesData: string[] = [];
      
      for (const imageUrl of imagesToUse) {
        try {
          if (imageUrl.startsWith('data:')) {
            referenceImagesData.push(imageUrl);
          } else {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            referenceImagesData.push(dataUrl);
          }
        } catch (error) {
          console.error('Error converting image URL to data URL:', error);
        }
      }
      
      const contentPromises = Array.from({ length: finalCount }).map(async (_, index) => {
        try {
          const stylePrompt = referenceImagesData.length > 0
            ? `Create a single social media post image for ${profile.name}. You have been provided with reference images that show ${profile.name}'s EXACT style. Match the photography style, composition, background, lighting, colors, and overall aesthetic from these reference images. Content: ${generationPrompt}. ONE single photograph/image (NOT a graphic design, NOT a collage). Aspect ratio: ${selectedAspectRatio}. Model style: ${selectedModel}`
            : `Create a single social media post image for ${profile.name}. Content: ${generationPrompt}. ONE single photograph/image. Aspect ratio: ${selectedAspectRatio}. Model style: ${selectedModel}`;
          
          const imageB64 = referenceImagesData.length > 0
            ? await geminiService.generateStyledImage(stylePrompt, referenceImagesData)
            : await geminiService.generateWithImagen(stylePrompt, selectedAspectRatio);
          
          if (user) {
            try {
              const { error: dbError } = await supabase
                .from('pixel_muse_generations')
                .insert({
                  profile_id: profile.id,
                  user_id: user.id,
                  image_url: imageB64,
                  post_copy: '',
                  prompt: generationPrompt,
                  aspect_ratio: selectedAspectRatio,
                  generation_index: index,
                  batch_id: batchId,
                  model_name: selectedModel,
                } as any);
              
              if (dbError) {
                console.error('Error saving to database:', dbError);
              }
            } catch (dbError) {
              console.error('Error saving to database:', dbError);
            }
          }
          
          return imageB64;
        } catch (error) {
          console.error(`❌ Failed to generate content ${index + 1}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(contentPromises);
      const validImages = results.filter((img): img is string => img !== null);
      
      if (validImages.length === 0) {
        throw new Error('Failed to generate any images. Please try again.');
      }
      
      setGeneratedImages(validImages);
      setActiveImageIndex(0);
      await loadPastGenerations();
      
    } catch (error) {
      console.error('Error generating content:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Combine current and past generations
  const allImages = [
    ...generatedImages,
    ...pastGenerations.map(gen => gen.image_url),
  ].filter(Boolean);

  const activeImage = activeImageIndex !== null && allImages.length > 0 ? allImages[activeImageIndex] : null;
  const models = ['NANO BANANA', 'STUDIO PRO', 'CREATIVE AI', 'PIXEL MUSE'];

  // Model thumbnail URLs - using actual model images if available
  const getModelThumbnail = (modelName: string) => {
    // For NANO BANANA, you can use an actual thumbnail image
    // For now, using a placeholder that looks like a person
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(modelName)}&background=84cc16&color=000&size=40&bold=true&length=2`;
  };

  if (isLoadingProfile || !profile) {
    return (
      <div className="h-screen bg-[#0a0e27] flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#84cc16]" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0e27] flex flex-col overflow-hidden relative">
      {/* Mystical Pattern Background */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0),
            radial-gradient(circle at 25px 25px, rgba(147, 197, 253, 0.15) 2px, transparent 0),
            radial-gradient(circle at 75px 75px, rgba(147, 197, 253, 0.1) 1px, transparent 0)
          `,
          backgroundSize: '50px 50px, 100px 100px, 150px 150px',
        }}
      />

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-[#0a0e27]/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <button
              onClick={onBack}
              className="text-[#94a3b8] hover:text-white transition-colors p-1"
            >
              <ArrowLeft size={18} />
            </button>
            <button className="flex items-center gap-2 text-[#94a3b8] hover:text-white transition-colors text-sm">
              <PenTool size={15} />
              <span>Edit</span>
            </button>
            <button className="flex items-center gap-2 text-[#94a3b8] hover:text-white transition-colors text-sm">
              <Film size={15} />
              <span>Animate</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {activeImage && (
              <>
                <button className="text-[#94a3b8] hover:text-white transition-colors p-1.5">
                  <Download size={18} />
                </button>
                <button className="text-[#94a3b8] hover:text-white transition-colors p-1.5">
                  <RotateCcw size={18} />
                </button>
                <button className="text-[#94a3b8] hover:text-white transition-colors p-1.5">
                  <Share2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Canvas - Full Screen Image Display */}
      <div 
        className="flex-1 relative overflow-hidden"
        style={{ 
          marginTop: '54px', 
          marginBottom: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        {isGenerating ? (
          <div className="text-center">
            <Loader2 size={72} className="animate-spin text-[#84cc16] mx-auto mb-4" strokeWidth={2} />
            <p className="text-[#cbd5e1] text-base font-medium">Generating...</p>
          </div>
        ) : activeImage ? (
          <img
            src={activeImage}
            alt="Generated"
            className="max-w-full max-h-full object-contain"
            style={{ 
              maxHeight: 'calc(100vh - 254px)',
              borderRadius: '8px'
            }}
          />
        ) : (
          <div className="text-center text-[#94a3b8]">
            <ImageIcon size={72} className="mx-auto mb-4 opacity-20" />
            <p className="text-base">Enter a prompt to generate your image</p>
          </div>
        )}

        {/* Image Counter - Bottom Center */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md rounded-full px-5 py-2.5 border border-white/10">
            <button
              onClick={() => setActiveImageIndex(prev => prev !== null && prev > 0 ? prev - 1 : allImages.length - 1)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight size={16} className="rotate-180 text-white" />
            </button>
            <span className="text-sm text-white font-semibold px-4 min-w-[70px] text-center">
              {(activeImageIndex !== null ? activeImageIndex + 1 : 1)} / {allImages.length}
            </span>
            <button
              onClick={() => setActiveImageIndex(prev => prev !== null && prev < allImages.length - 1 ? prev + 1 : 0)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight size={16} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Control Bar - Higgsfield Style */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-[#161b22]/98 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-[1920px] mx-auto px-8 py-5">
          <div className="flex items-end gap-8">
            {/* Left: Model Selector */}
            <div className="flex-shrink-0">
              <label className="text-xs text-[#8b949e] mb-2.5 block font-medium">Model</label>
              <div 
                className="flex items-center gap-3 bg-[#21262d] rounded-xl p-3 border border-white/10 hover:border-white/15 hover:bg-[#262b33] transition-all cursor-pointer group min-w-[200px]"
                onClick={() => {
                  const currentIndex = models.indexOf(selectedModel);
                  setSelectedModel(models[(currentIndex + 1) % models.length]);
                }}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/15 flex-shrink-0 bg-[#84cc16]/20">
                  <img
                    src={getModelThumbnail(selectedModel)}
                    alt={selectedModel}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm text-white font-semibold flex-1">{selectedModel}</span>
                <Download size={15} className="text-[#8b949e] group-hover:text-white transition-colors" />
              </div>
            </div>

            {/* Center: Prompt and Controls */}
            <div className="flex-1 max-w-5xl">
              {/* Icon Row */}
              <div className="flex items-center gap-2.5 mb-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 hover:bg-[#21262d] rounded-lg transition-colors"
                  title="Upload reference image"
                >
                  <ImageIcon size={17} className="text-[#8b949e]" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleReferenceImageUpload(e.target.files)}
                  className="hidden"
                />
                <button className="p-2.5 hover:bg-[#21262d] rounded-lg transition-colors">
                  <div className="w-4 h-4 rounded border-2 border-[#8b949e]"></div>
                </button>
              </div>
              
              {/* Input and Controls Row */}
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  placeholder="In this area i will be entering the prompt to make the post"
                  className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-[#6e7681] focus:ring-2 focus:ring-[#84cc16]/40 focus:border-[#84cc16]/50 transition-all text-sm font-medium"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
                />
                
                <button className="px-4 py-3 bg-[#21262d] hover:bg-[#30363d] border border-white/10 rounded-xl text-[#c9d1d9] hover:text-white text-sm font-semibold transition-colors flex items-center gap-2">
                  <span>G {selectedModel.split(' ')[0]}</span>
                  <ChevronRight size={13} className="rotate-90" />
                </button>
                
                <button
                  onClick={() => setNumberOfImages(Math.min(10, numberOfImages + 1))}
                  className="px-3.5 py-3 bg-[#21262d] hover:bg-[#30363d] border border-white/10 rounded-xl text-[#c9d1d9] hover:text-white text-sm font-semibold transition-colors"
                >
                  +
                </button>
                
                <div className="px-4 py-3 bg-[#21262d] border border-white/10 rounded-xl text-sm text-[#c9d1d9] font-semibold">
                  {generatedImages.length > 0 ? generatedImages.length : 1}/{isUnlimited ? '∞' : numberOfImages} +
                </div>
                
                <button
                  onClick={() => {
                    const ratios: ('1:1' | '3:4' | '4:3' | '9:16' | '16:9')[] = ['1:1', '3:4', '4:3', '9:16', '16:9'];
                    const currentIndex = ratios.indexOf(selectedAspectRatio);
                    setSelectedAspectRatio(ratios[(currentIndex + 1) % ratios.length]);
                  }}
                  className="px-4 py-3 bg-[#21262d] hover:bg-[#30363d] border border-white/10 rounded-xl text-[#c9d1d9] hover:text-white text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <ImageIcon size={14} />
                  <span>{selectedAspectRatio}</span>
                </button>
                
                <label className="flex items-center gap-2.5 px-4 py-3 bg-[#21262d] hover:bg-[#30363d] border border-white/10 rounded-xl cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={isUnlimited}
                    onChange={(e) => setIsUnlimited(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-transparent checked:bg-[#84cc16] checked:border-[#84cc16] focus:ring-2 focus:ring-[#84cc16]/30"
                  />
                  <span className="text-sm text-[#c9d1d9] font-semibold">Unlimited</span>
                </label>
                
                <button className="px-4 py-3 bg-[#21262d] hover:bg-[#30363d] border border-white/10 rounded-xl text-[#c9d1d9] hover:text-white text-sm font-semibold transition-colors flex items-center gap-2">
                  <PenTool size={14} />
                  <span>Draw</span>
                </button>
              </div>
            </div>

            {/* Right: Generate Button */}
            <div className="flex-shrink-0">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !generationPrompt.trim()}
                className="px-10 py-4 bg-[#84cc16] hover:bg-[#a3e635] disabled:bg-[#30363d] disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all flex items-center gap-2.5 shadow-xl shadow-[#84cc16]/25 hover:shadow-[#84cc16]/35 hover:scale-[1.02] active:scale-[0.98] disabled:shadow-none disabled:hover:scale-100 text-sm uppercase tracking-wide"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>Generate</span>
                    <span className="text-[10px] bg-black/30 px-2 py-1 rounded font-bold">1</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
