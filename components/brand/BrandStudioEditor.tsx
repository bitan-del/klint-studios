import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Image as ImageIcon, Sparkles, MessageSquare, Settings, X, Loader2, Check, Download, RefreshCw, Save, Copy, Edit2, Trash2, FileDown } from 'lucide-react';
import { updateBrandProfile, analyzeBrandStyle } from '../../services/brandService';
import type { BrandProfile } from '../../types/brand';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import JSZip from 'jszip';

interface BrandStudioEditorProps {
  profile: BrandProfile;
  onBack: () => void;
  onUpdate: (profile: BrandProfile) => void;
}

export const BrandStudioEditor: React.FC<BrandStudioEditorProps> = ({
  profile,
  onBack,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'train' | 'generate'>('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>(profile.reference_images || []);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedCopies, setGeneratedCopies] = useState<string[]>([]); // Text/copy for each image
  const [editingCopyIndex, setEditingCopyIndex] = useState<number | null>(null); // Which copy is being edited
  const [hasGenerated, setHasGenerated] = useState(false); // Track if generation has been attempted
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('1:1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      
      // Get user ID for upload
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use existing storage service (handles Cloudinary upload with admin credentials)
      const { storageService } = await import('../../services/storageService');
      
      // Upload each file using storage service (uses existing 2000 image limit)
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Upload using storage service - it handles Cloudinary automatically
          // Metadata includes brand profile ID for reference
          const imageData = await storageService.uploadImage(
            file,
            user.id,
            'brand-studios', // workflow_id
            `Brand reference for ${profile.name}`, // prompt/description
            {
              brand_profile_id: profile.id,
              brand_name: profile.name,
              type: 'brand_reference'
            }
          );
          
          console.log('✅ Brand reference image uploaded:', imageData.cloudinary_url);
          return imageData.cloudinary_url; // Return Cloudinary URL
        } catch (error) {
          console.error('Error uploading image:', error);
          throw error;
        }
      });

      const urls = await Promise.all(uploadPromises);
      const newImages = [...uploadedImages, ...urls];
      setUploadedImages(newImages);

      // Update profile with new reference images
      const updated = await updateBrandProfile(profile.id, {
        reference_images: newImages,
      });
      onUpdate(updated);

      // Analyze brand style if we have images
      if (newImages.length > 0) {
        setIsAnalyzing(true);
        try {
          const analysis = await analyzeBrandStyle(profile.id, newImages);
          const finalUpdate = await updateBrandProfile(profile.id, {
            ...analysis,
            training_completeness: Math.min(100, newImages.length * 10),
          });
          onUpdate(finalUpdate);
        } catch (error) {
          console.error('Error analyzing brand style:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = uploadedImages[index];
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    
    // Delete from storage service if it's stored in user_images table
    if (imageToRemove && imageToRemove.includes('cloudinary.com')) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { storageService } = await import('../../services/storageService');
          
          // Find the image in user_images table by cloudinary_url
          const { data: imageData } = await supabase
            .from('user_images')
            .select('id, cloudinary_url')
            .eq('user_id', user.id)
            .eq('cloudinary_url', imageToRemove)
            .eq('workflow_id', 'brand-studios')
            .single();
          
          if (imageData?.id) {
            // Delete using storage service (handles Cloudinary deletion)
            await storageService.deleteImage(imageData.id, user.id);
            console.log('✅ Brand reference image deleted');
          } else {
            console.warn('⚠️ Image not found in user_images table, removing from profile only');
          }
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        // Continue even if deletion fails - image is already removed from array
      }
    }
    
    const updated = await updateBrandProfile(profile.id, {
      reference_images: newImages,
      training_completeness: Math.min(100, newImages.length * 10),
    });
    onUpdate(updated);
  };

  const handleGenerate = async () => {
    if (!generationPrompt.trim()) {
      alert('Please enter what you want to generate');
      return;
    }

    if (profile.training_completeness < 50) {
      alert('Training is incomplete. Please upload more reference images first.');
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedImages([]); // Clear previous results
      setHasGenerated(false); // Reset flag
      
      // Parse prompt to extract number of images
      const promptLower = generationPrompt.toLowerCase();
      const numberMatch = promptLower.match(/(\d+)/);
      const numberOfImages = numberMatch ? parseInt(numberMatch[1], 10) : 1;
      const finalCount = Math.min(Math.max(numberOfImages, 1), 10); // Limit to 1-10 images
      
      console.log('🎨 Generating content for brand:', profile.name);
      console.log('📝 Prompt:', generationPrompt);
      console.log('🔢 Number of images:', finalCount);
      console.log('🎨 Brand style:', {
        colors: profile.color_palette,
        style: profile.style_description,
        composition: profile.composition_style,
        lighting: profile.lighting_style,
      });
      
      console.log('🎨 Generating content for brand:', profile.name);
      console.log('📝 User prompt:', generationPrompt);
      console.log('🔢 Number of images:', finalCount);
      console.log('📸 Reference images available:', profile.reference_images?.length || 0);
      
      // Import generation service
      const geminiModule = await import('../../services/geminiService');
      const { geminiService } = geminiModule;
      
      // Get AI instance for text generation
      const getAI = async () => {
        // Use the same method as geminiService uses internally
        const { GoogleGenAI } = await import('@google/genai');
        // Fetch API key from database
        const { databaseService } = await import('../../services/databaseService');
        const apiKey = await databaseService.getAdminSetting('gemini_api_key');
        if (!apiKey) return null;
        return new GoogleGenAI({ apiKey });
      };
      
      // Helper to parse data URL (same as geminiService uses)
      const parseDataUrl = (dataUrl: string) => {
        const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
        if (!match) {
          throw new Error("Invalid data URL");
        }
        return {
          mimeType: match[1],
          data: match[2]
        };
      };
      
      // Generate batch ID for grouping
      const batchId = crypto.randomUUID();
      
      // Get reference images - these are the brand's uploaded training images
      const referenceImageUrls = profile.reference_images || [];
      if (referenceImageUrls.length === 0) {
        throw new Error('No reference images found. Please upload reference images in the Train tab first.');
      }
      
      console.log(`📸 Using ${referenceImageUrls.length} reference images for style matching`);
      
      // Convert Cloudinary URLs to base64 data URLs for the AI model
      // Limit to first 5 images to avoid token limits
      const imagesToUse = referenceImageUrls.slice(0, 5);
      const referenceImages: string[] = [];
      
      for (const imageUrl of imagesToUse) {
        try {
          // If it's already a data URL, use it directly
          if (imageUrl.startsWith('data:')) {
            referenceImages.push(imageUrl);
          } else {
            // Convert Cloudinary URL to base64 data URL
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            referenceImages.push(dataUrl);
          }
        } catch (error) {
          console.error('Error converting image URL to data URL:', error);
          // Skip this image if conversion fails
        }
      }
      
      if (referenceImages.length === 0) {
        throw new Error('Failed to load reference images. Please check your image URLs.');
      }
      
      console.log(`✅ Loaded ${referenceImages.length} reference images for style matching`);
      
      // Generate images and text/copy in parallel
      const contentPromises = Array.from({ length: finalCount }).map(async (_, index) => {
        try {
          console.log(`🔄 Generating content ${index + 1}/${finalCount}...`);
          
          // First, analyze the reference images to understand their exact style
          const analysisPrompt = `Analyze the reference images provided. These are ${profile.name}'s brand reference images that define their visual identity.

**YOUR TASK:** Study these images carefully and describe:
1. Photography style (e.g., close-up product shots, lifestyle photography, studio photography)
2. Composition approach (e.g., centered product, close-up details, full product view)
3. Background style (e.g., solid dark colors, textured surfaces, natural materials)
4. Lighting style (e.g., soft natural light, dramatic shadows, even studio lighting)
5. Color palette (extract the exact dominant colors you see)
6. Overall aesthetic (e.g., elegant, minimalist, luxurious, bold)

Return a detailed description of the visual style you observe. Be specific about photography techniques, not graphic design.`;

          // Analyze reference images first to extract style
          let styleAnalysis = '';
          try {
            const ai = await getAI();
            if (ai && referenceImages.length > 0) {
              const analysisParts: any[] = [];
              // Add first 3 reference images for analysis
              for (const img of referenceImages.slice(0, 3)) {
                const { mimeType, data } = parseDataUrl(img);
                analysisParts.push({ inlineData: { mimeType, data } });
              }
              analysisParts.push({ text: analysisPrompt });
              
              const analysisResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: analysisParts },
              });
              styleAnalysis = analysisResponse.text.trim();
              console.log('📊 Style analysis:', styleAnalysis);
            }
          } catch (error) {
            console.error('Error analyzing reference images:', error);
          }

          // Build prompt that STRICTLY matches the reference image style
          const stylePrompt = `Create a single social media post image for ${profile.name} brand.

**ABSOLUTELY CRITICAL - EXACT STYLE MATCHING:**
You have been provided with reference images that show ${profile.name}'s EXACT brand photography style. 

**YOU MUST:**
1. Match the EXACT photography style from the reference images (e.g., if they show close-up product photography, create close-up product photography - NOT graphic design, NOT collages, NOT multi-panel layouts)
2. Match the EXACT composition approach (e.g., if reference images show centered products on solid backgrounds, use the same approach)
3. Match the EXACT background style (e.g., if reference images use dark blue/beige textured surfaces, use the same)
4. Match the EXACT lighting style (e.g., if reference images have soft natural lighting, use the same)
5. Match the EXACT color palette from the reference images (use the same dominant colors you see)
6. Match the EXACT overall aesthetic (e.g., if reference images are elegant and luxurious, create elegant and luxurious - NOT bold graphic design)

**STYLE ANALYSIS FROM REFERENCE IMAGES:**
${styleAnalysis || 'Study the reference images carefully to match their exact photography style, composition, colors, and aesthetic.'}

**CONTENT TO CREATE:**
${generationPrompt}

**ABSOLUTE REQUIREMENTS:**
- ONE single photograph/image (NOT a graphic design, NOT a collage, NOT multiple panels, NOT text overlays)
- Must be the SAME TYPE of photography as the reference images (product photography, lifestyle photography, etc.)
- Must use the SAME color palette as seen in reference images
- Must use the SAME composition style as reference images
- Must use the SAME background style as reference images
- Must use the SAME lighting style as reference images
- The generated image should look like it was photographed in the same session as the reference images
- Aspect ratio: ${selectedAspectRatio}

**DO NOT CREATE:**
- Graphic design layouts
- Multi-panel collages or grids
- Text overlays or typography designs
- Marketing poster styles
- Anything that doesn't match the photography style of the reference images`;
          
          // Generate image using reference images for style matching
          const imageB64 = await geminiService.generateStyledImage(stylePrompt, referenceImages);
          console.log(`✅ Image ${index + 1} generated successfully with brand style matching`);
          
          // Generate text/copy for the post
          // IMPORTANT: Generate ONE single post copy, not multiple variations
          let postCopy = '';
          try {
            const copyPrompt = `Generate ONE single, engaging social media post caption for ${profile.name} brand. 
The post is about: ${generationPrompt}
Brand style: ${profile.style_description || 'professional and on-brand'}
Brand colors: ${profile.color_palette?.slice(0, 3).join(', ') || 'brand colors'}

Generate ONE compelling social media post caption (not multiple variations, not a list, just ONE caption). 
Keep it concise (2-3 sentences max), include relevant hashtags if appropriate, and make it engaging for social media.
Return ONLY the single post copy text, no explanations, no markdown, no bullet points, no numbered list. Just the caption text.`;
            
            const ai = await getAI();
            if (ai) {
              const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: copyPrompt,
              });
              postCopy = response.text.trim();
              console.log(`✅ Copy ${index + 1} generated: ${postCopy.substring(0, 50)}...`);
            } else {
              // Fallback copy if AI is not available
              postCopy = `Check out our latest from ${profile.name}! ${generationPrompt}`;
            }
          } catch (copyError) {
            console.error(`⚠️ Failed to generate copy ${index + 1}:`, copyError);
            postCopy = `New from ${profile.name}! ${generationPrompt}`;
          }
          
          // Store in database
          if (user) {
            try {
              const { error: dbError } = await supabase
                .from('brand_generated_content')
                .insert({
                  brand_profile_id: profile.id,
                  user_id: user.id,
                  image_url: imageB64,
                  post_copy: postCopy,
                  prompt: generationPrompt,
                  aspect_ratio: selectedAspectRatio,
                  generation_index: index,
                  batch_id: batchId,
                });
              
              if (dbError) {
                console.error('Error saving to database:', dbError);
              } else {
                console.log(`✅ Saved content ${index + 1} to database`);
              }
            } catch (dbError) {
              console.error('Error saving to database:', dbError);
            }
          }
          
          return { image: imageB64, copy: postCopy };
        } catch (error) {
          console.error(`❌ Failed to generate content ${index + 1}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(contentPromises);
      const validContent = results.filter((item): item is { image: string; copy: string } => item !== null);
      
      if (validContent.length === 0) {
        throw new Error('Failed to generate any content. Please try again.');
      }
      
      console.log(`✅ Generated ${validContent.length} images and copies successfully`);
      setGeneratedImages(validContent.map(item => item.image));
      setGeneratedCopies(validContent.map(item => item.copy));
      setHasGenerated(true);
      
    } catch (error) {
      console.error('Error generating content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content. Please try again.';
      alert(errorMessage);
      setHasGenerated(true); // Still show results section even on error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${profile.name}-generated-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    if (generatedImages.length === 0) return;
    
    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < generatedImages.length; i++) {
        const imageUrl = generatedImages[i];
        const match = imageUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.*)$/);
        if (match) {
          const mimeType = match[1];
          const base64Data = match[2];
          const extension = mimeType.split('/')[1] || 'png';
          zip.file(`${profile.name}-post-${i + 1}.${extension}`, base64Data, { base64: true });
          
          // Also add copy as text file
          if (generatedCopies[i]) {
            zip.file(`${profile.name}-post-${i + 1}-copy.txt`, generatedCopies[i]);
          }
        }
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${profile.name}-generated-posts.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to create ZIP:', error);
      alert('Failed to download all images. Please try again.');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleSaveToCreations = async () => {
    if (!user || generatedImages.length === 0) {
      alert('Please log in to save images.');
      return;
    }
    
    setIsSaving(true);
    try {
      const { storageService } = await import('../../services/storageService');
      
      // Convert base64 to File and upload
      const base64ToFile = (base64: string, filename: string): File => {
        const match = base64.match(/^data:(image\/(?:png|jpeg|webp));base64,(.*)$/);
        if (!match) throw new Error('Invalid base64 image');
        const mimeType = match[1];
        const base64Data = match[2];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new File([byteArray], filename, { type: mimeType });
      };
      
      let savedCount = 0;
      for (let i = 0; i < generatedImages.length; i++) {
        try {
          const imageFile = base64ToFile(generatedImages[i], `${profile.name}-post-${i + 1}.png`);
          const prompt = generatedCopies[i] 
            ? `${generationPrompt}\n\nPost Copy: ${generatedCopies[i]}`
            : generationPrompt;
          
          await storageService.uploadImage(
            imageFile,
            user.id,
            'brand-studios',
            prompt,
            {
              brand_profile_id: profile.id,
              brand_name: profile.name,
              post_copy: generatedCopies[i] || '',
            }
          );
          savedCount++;
        } catch (error) {
          console.error(`Failed to save image ${i + 1}:`, error);
        }
      }
      
      // Update database to mark as saved
      if (savedCount > 0) {
        const { error } = await supabase
          .from('brand_generated_content')
          .update({ is_saved_to_creations: true, saved_at: new Date().toISOString() })
          .eq('brand_profile_id', profile.id)
          .eq('is_saved_to_creations', false);
        
        if (error) {
          console.error('Error updating saved status:', error);
        }
      }
      
      alert(`✅ ${savedCount} image(s) saved to My Creations!`);
    } catch (error) {
      console.error('Error saving to My Creations:', error);
      alert('Failed to save images. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Post copy copied to clipboard!');
  };

  const handleUpdateCopy = (index: number, newCopy: string) => {
    const updatedCopies = [...generatedCopies];
    updatedCopies[index] = newCopy;
    setGeneratedCopies(updatedCopies);
    setEditingCopyIndex(null);
    
    // Update in database
    if (user) {
      supabase
        .from('brand_generated_content')
        .update({ post_copy: newCopy })
        .eq('brand_profile_id', profile.id)
        .eq('generation_index', index)
        .then(({ error }) => {
          if (error) console.error('Error updating copy:', error);
        });
    }
  };

  const handleRegenerate = () => {
    if (generationPrompt.trim()) {
      handleGenerate();
    }
  };

  const handleQuickAction = (action: string) => {
    setGenerationPrompt(action);
    // Auto-focus the textarea after setting prompt
    setTimeout(() => {
      const textarea = document.querySelector('textarea[placeholder*="generate"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{profile.name}</h1>
                <p className="text-sm text-zinc-400">
                  {profile.client_id && `Client: ${profile.client_id} • `}
                  Training: {profile.training_completeness}%
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {[
              { id: 'overview', label: 'Overview', icon: ImageIcon },
              { id: 'train', label: 'Train', icon: Sparkles },
              { id: 'generate', label: 'Generate', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
              <h2 className="text-lg font-semibold text-white mb-4">Brand Style Profile</h2>
              
              {profile.style_description ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-400 mb-2 block">Style Description</label>
                    <p className="text-zinc-300">{profile.style_description}</p>
                  </div>

                  {profile.color_palette.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-zinc-400 mb-2 block">Color Palette</label>
                      <div className="flex gap-2">
                        {profile.color_palette.map((color, i) => (
                          <div
                            key={i}
                            className="w-12 h-12 rounded-lg border border-zinc-600 flex items-center justify-center"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.composition_style && (
                    <div>
                      <label className="text-sm font-medium text-zinc-400 mb-2 block">Composition Style</label>
                      <p className="text-zinc-300 capitalize">{profile.composition_style}</p>
                    </div>
                  )}

                  {profile.lighting_style && (
                    <div>
                      <label className="text-sm font-medium text-zinc-400 mb-2 block">Lighting Style</label>
                      <p className="text-zinc-300 capitalize">{profile.lighting_style}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-zinc-400">
                  Upload reference images in the Train tab to analyze brand style
                </p>
              )}
            </div>

            <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
              <h2 className="text-lg font-semibold text-white mb-4">Reference Images</h2>
              {uploadedImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400">No reference images uploaded yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'train' && (
          <div className="space-y-6">
            <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
              <h2 className="text-lg font-semibold text-white mb-4">Upload Reference Images</h2>
              <p className="text-zinc-400 mb-4">
                Upload 5-10 images of your client's past campaigns, brand guidelines, or style references.
                The AI will analyze these to learn the brand's visual identity.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-600 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500 transition-colors"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="animate-spin text-emerald-400" />
                    <p className="text-zinc-400">Uploading images...</p>
                  </div>
                ) : isAnalyzing ? (
                  <div className="flex flex-col items-center gap-4">
                    <Sparkles size={32} className="text-emerald-400 animate-pulse" />
                    <p className="text-zinc-400">Analyzing brand style...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Upload size={32} className="text-zinc-400" />
                    <div>
                      <p className="text-white font-medium mb-1">Click to upload images</p>
                      <p className="text-zinc-400 text-sm">or drag and drop</p>
                    </div>
                  </div>
                )}
              </div>

              {uploadedImages.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">
                    Uploaded Images ({uploadedImages.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Training Progress */}
            <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
              <h2 className="text-lg font-semibold text-white mb-4">Training Progress</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Completeness</span>
                  <span className="text-sm font-medium text-emerald-400">
                    {profile.training_completeness}%
                  </span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-3">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${profile.training_completeness}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  {profile.training_completeness < 50
                    ? 'Upload more reference images to improve training'
                    : profile.training_completeness < 80
                    ? 'Good progress! A few more images will complete training'
                    : 'Training complete! Ready to generate content'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="space-y-6">
            <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
              <h2 className="text-lg font-semibold text-white mb-4">Generate Content</h2>
              <p className="text-zinc-400 mb-6">
                Generate content in {profile.name}'s brand style. Use natural language to describe what you want.
              </p>

              {profile.training_completeness < 50 ? (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ Training is incomplete ({profile.training_completeness}%). 
                    Upload more reference images in the Train tab for better results.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      What would you like to generate?
                    </label>
                    <textarea
                      value={generationPrompt}
                      onChange={(e) => setGenerationPrompt(e.target.value)}
                      placeholder="e.g., Create 5 Instagram posts for our new product launch"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Aspect Ratio
                    </label>
                    <div className="flex gap-2">
                      {(['1:1', '3:4', '4:3', '9:16', '16:9'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setSelectedAspectRatio(ratio)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedAspectRatio === ratio
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !generationPrompt.trim()}
                      className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate'
                      )}
                    </button>
                  </div>

                  <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                    <p className="text-sm text-zinc-400 mb-2">Quick Actions:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Create 5 social posts',
                        'E-commerce pack',
                        'Product photography',
                        'Marketing banner',
                      ].map((action) => (
                        <button
                          key={action}
                          onClick={() => handleQuickAction(action)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors cursor-pointer"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Results Section */}
              {(isGenerating || generatedImages.length > 0 || hasGenerated) && (
                <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 mt-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h2 className="text-lg font-semibold text-white">
                      Generated Content
                      {generatedImages.length > 0 && (
                        <span className="text-zinc-400 text-sm ml-2">({generatedImages.length})</span>
                      )}
                    </h2>
                    {generatedImages.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleDownloadAll}
                          disabled={isDownloadingAll}
                          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {isDownloadingAll ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <FileDown size={16} />
                          )}
                          Download All
                        </button>
                        <button
                          onClick={handleSaveToCreations}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          Save to My Creations
                        </button>
                        <button
                          onClick={handleRegenerate}
                          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm transition-colors"
                        >
                          <RefreshCw size={16} />
                          Regenerate
                        </button>
                      </div>
                    )}
                  </div>

                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 size={48} className="animate-spin text-emerald-400 mb-4" />
                      <p className="text-zinc-400">Generating content in {profile.name}'s brand style...</p>
                      <p className="text-zinc-500 text-sm mt-2">This may take a few moments</p>
                    </div>
                  ) : generatedImages.length > 0 ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {generatedImages.map((imageUrl, index) => (
                          <div key={index} className="bg-zinc-900 rounded-xl p-4 border border-zinc-700">
                            {/* Image */}
                            <div className="relative group mb-4">
                              <img
                                src={imageUrl}
                                alt={`Generated ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-lg border border-zinc-700"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleDownload(imageUrl, index)}
                                  className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
                                  title="Download"
                                >
                                  <Download size={20} />
                                </button>
                              </div>
                              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {index + 1}
                              </div>
                            </div>
                            
                            {/* Post Copy */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-zinc-400">Post Copy</label>
                                <div className="flex gap-1">
                                  {editingCopyIndex !== index && (
                                    <>
                                      <button
                                        onClick={() => setEditingCopyIndex(index)}
                                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                                        title="Edit copy"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleCopyCopy(generatedCopies[index] || '')}
                                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                                        title="Copy to clipboard"
                                      >
                                        <Copy size={14} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {editingCopyIndex === index ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={generatedCopies[index] || ''}
                                    onChange={(e) => {
                                      const updated = [...generatedCopies];
                                      updated[index] = e.target.value;
                                      setGeneratedCopies(updated);
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[80px] resize-none"
                                    placeholder="Enter post copy..."
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleUpdateCopy(index, generatedCopies[index] || '')}
                                      className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                                    >
                                      <Check size={14} />
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingCopyIndex(null)}
                                      className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-700 min-h-[80px]">
                                  {generatedCopies[index] ? (
                                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                                      {generatedCopies[index]}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-zinc-500 italic">No copy generated yet</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : hasGenerated && generatedImages.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                      <ImageIcon size={48} className="mx-auto mb-4 text-zinc-600" />
                      <p className="text-zinc-300 mb-2">Generation complete</p>
                      <p className="text-sm">Generated images will appear here once the generation service is implemented.</p>
                      <p className="text-xs text-zinc-500 mt-2">Brand: {profile.name} | Prompt: {generationPrompt}</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-zinc-400">
                      <p>No results yet. Click "Generate" to create content.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

