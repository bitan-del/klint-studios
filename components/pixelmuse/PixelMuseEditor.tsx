import React, { useState, useCallback, useEffect } from 'react';
import { ImageGrid } from './ImageGrid';
import { PromptBar } from './PromptBar';
import { Header } from './Header';
import { ImageEditor } from './ImageEditor';
import { geminiService } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { resizeImageToAspectRatio } from '../../utils/imageResizer';
import type { AspectRatio } from '../../types';

interface PixelMuseEditorProps {
  onBack?: () => void;
}

// Helper function to adapt the new generateImage signature to use existing geminiService
const generateImage = async (
  prompt: string,
  images: string[] = [],
  imageCount: number,
  aspectRatio: string,
  isEdit: boolean = false
): Promise<string[]> => {
  try {
    if (images.length > 0 && isEdit) {
      // For image EDITING with annotations: 
      // 1. Use Gemini Vision to READ annotations
      // 2. Use gemini-2.5-flash-image (nano banana) to EDIT while preserving context
      
      console.log('🎨 Image editing mode: Analyzing annotated image with Gemini Vision...');
      
      const generationPromises = Array(imageCount)
        .fill(0)
        .map(async () => {
          try {
            // Step 1: Use Gemini Vision to analyze and understand annotations
            console.log('📸 Analyzing image - size:', images[0].length, 'bytes');
            
            const visionPrompt = `You are analyzing an image with visual annotations (arrows and text labels).

User instruction: ${prompt}

Your task:
1. Look at the image - identify ALL visible elements (people, objects, jewelry, clothing, background, style, lighting, colors)
2. Read any TEXT written on the image - these are direct instructions
3. Follow any ARROWS - they show what to apply WHERE (arrow from X to Y = apply X to Y)
4. Create an editing instruction that preserves everything EXCEPT what needs to change

Format your response as a clear, concise editing instruction. Example:
"Keep the woman with red hair, white shirt, and ornate celestial background exactly as is. Add the golden tarot card earrings to her ears."

Write ONLY the editing instruction. Be specific about what to keep and what to change.`;

            const editingInstruction = await geminiService.analyzeImage(images[0], visionPrompt);
            
            console.log('📝 Vision analysis result:', editingInstruction);
            console.log('🎨 Now generating with gemini-2.5-flash-image (nano banana)...');
            
            // Step 2: Use gemini-2.5-flash-image with the original image as reference
            // This preserves context while applying changes
            const result = await geminiService.generateStyledImage(editingInstruction, images);
            
            console.log('✅ Generation complete!');
            let base64Data = result.includes(',') ? result.split(',')[1] : result;
            const dataUrl = `data:image/png;base64,${base64Data}`;
            
            // Resize to match aspect ratio
            const aspectRatioMap: Record<string, '1:1' | '4:5' | '16:9' | '9:16' | '3:4' | '4:3'> = {
              '1:1': '1:1',
              '4:5': '4:5',
              '16:9': '16:9',
              '9:16': '9:16',
              '3:4': '3:4',
              '4:3': '4:3',
            };
            const mappedAspectRatio = aspectRatioMap[aspectRatio] || '9:16';
            
            try {
              const resizedDataUrl = await resizeImageToAspectRatio(dataUrl, mappedAspectRatio);
              base64Data = resizedDataUrl.includes(',') ? resizedDataUrl.split(',')[1] : resizedDataUrl;
            } catch (resizeError) {
              console.warn('Failed to resize image to aspect ratio:', resizeError);
            }
            
            return base64Data;
          } catch (error) {
            console.error('Failed to generate edited image:', error);
            throw error;
          }
        });
      
      return await Promise.all(generationPromises);
    } else if (images.length > 0) {
      // Non-edit image-to-image generation (style reference)
      let contextualPrompt = prompt || 'Generate an image based on the reference images, maintaining their style and composition.';
      
      const generationPromises = Array(imageCount)
        .fill(0)
        .map(async () => {
          const result = await geminiService.generateStyledImage(contextualPrompt, images);
          // Extract base64 from data URL
          let base64Data = result.includes(',') ? result.split(',')[1] : result;
          const dataUrl = `data:image/png;base64,${base64Data}`;
          
          // Resize to match aspect ratio for image-to-image generation
          const aspectRatioMap: Record<string, '1:1' | '4:5' | '16:9' | '9:16' | '3:4' | '4:3'> = {
            '1:1': '1:1',
            '4:5': '4:5',
            '16:9': '16:9',
            '9:16': '9:16',
            '3:4': '3:4',
            '4:3': '4:3',
          };
          const mappedAspectRatio = aspectRatioMap[aspectRatio] || '9:16';
          
          try {
            const resizedDataUrl = await resizeImageToAspectRatio(dataUrl, mappedAspectRatio);
            base64Data = resizedDataUrl.includes(',') ? resizedDataUrl.split(',')[1] : resizedDataUrl;
          } catch (resizeError) {
            console.warn('Failed to resize image to aspect ratio:', resizeError);
            // Continue with original image if resize fails
          }
          
          return base64Data;
        });
      
      return await Promise.all(generationPromises);
    } else {
      // Text-to-image generation using generateWithImagen
      if (!prompt) {
        throw new Error('A prompt is required to generate an image.');
      }
      
      const generationPromises = Array(imageCount)
        .fill(0)
        .map(async () => {
          const result = await geminiService.generateWithImagen(prompt, aspectRatio as AspectRatio['value']);
          // Extract base64 from data URL
          const base64Data = result.includes(',') ? result.split(',')[1] : result;
          return base64Data;
        });
      
      return await Promise.all(generationPromises);
    }
  } catch (error) {
    console.error("Error generating image:", error);
    let errorMessage = "Failed to generate image.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

// Helper function to enhance prompt using geminiService
const enhancePrompt = async (prompt: string): Promise<string> => {
  try {
    // Use the chatbot response to enhance the prompt
    const response = await geminiService.getChatbotResponse(
      `Enhance this image generation prompt to be more descriptive, vivid, and detailed for a text-to-image AI. Return ONLY the enhanced prompt, without any conversational preamble, labels, or explanation. Original prompt: "${prompt}"`,
      ''
    );
    
    // Clean up potential markdown or quotes
    return response.trim().replace(/^"|"$/g, '').replace(/`/g, '');
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    let errorMessage = "Failed to enhance prompt.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

export const PixelMuseEditor: React.FC<PixelMuseEditorProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState<string>('');
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [isLoadingCreations, setIsLoadingCreations] = useState<boolean>(true);

  // Clean up old localStorage data on mount to prevent quota errors
  useEffect(() => {
    try {
      // Remove old localStorage data that was causing quota errors
      localStorage.removeItem('pixelmuse_generatedImages');
    } catch (e) {
      // Ignore errors when cleaning up
    }
  }, []);

  // Load user creations from database on mount
  useEffect(() => {
    const loadUserCreations = async () => {
      if (!user?.id) {
        setIsLoadingCreations(false);
        return;
      }

      try {
        setIsLoadingCreations(true);
        // Load all user images (creations from all workflows)
        const userImages = await storageService.getUserImages(user.id, undefined, 100);
        
        // Convert to data URLs for display
        const imageUrls = userImages.map(img => img.cloudinary_url);
        setImages(imageUrls);
      } catch (err) {
        console.error("Failed to load user creations:", err);
        setError("Failed to load your creations.");
      } finally {
        setIsLoadingCreations(false);
      }
    };

    loadUserCreations();
  }, [user?.id]);

  // Note: Images are saved to database/Cloudinary, no need for localStorage backup
  // localStorage has size limits and causes quota errors with many images

  const handleGenerate = useCallback(async () => {
    if ((!prompt && inputImages.length === 0) || isLoading || !user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const resolvedImages = await generateImage(prompt, inputImages, imageCount, aspectRatio);
      const newImages = resolvedImages.map(imageData => `data:image/png;base64,${imageData}`);
      setImages(prevImages => [...newImages, ...prevImages]);
      
      // Save each generated image to database
      for (const imageDataUrl of newImages) {
        try {
          // Convert data URL to Blob
          const response = await fetch(imageDataUrl);
          const blob = await response.blob();
          const file = new File([blob], `pixelmuse-${Date.now()}.png`, { type: 'image/png' });
          
          // Upload to storage service
          await storageService.uploadImage(
            file,
            user.id,
            'pixelmuse', // workflow_id
            prompt || 'PixelMuse generation',
            { aspectRatio, imageCount, inputImagesCount: inputImages.length }
          );
        } catch (saveErr) {
          console.error("Failed to save image to database:", saveErr);
          // Continue even if save fails
        }
      }
      
      setInputImages([]); // Clear input images after generation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error("Generation error:", err);
      // Show user-friendly error message
      alert(`Failed to generate image: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, imageCount, inputImages, aspectRatio, user?.id]);
  
  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt || isEnhancing) return;
    
    setIsEnhancing(true);
    setError(null);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while enhancing prompt.');
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  }, [prompt, isEnhancing]);

  const handleDeleteImage = useCallback((indexToDelete: number) => {
    setImages(prevImages => prevImages.filter((_, index) => index !== indexToDelete));
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      
      const filePromises = files.map((file: File) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('File could not be read as a data URL.'));
            }
          };
          reader.onerror = (error) => {
            console.error("Error reading file:", error);
            reject(error);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises)
        .then(newImages => {
          setInputImages(prev => [...prev, ...newImages]);
        })
        .catch(() => {
          setError("Failed to read one or more images.");
        });
    }
  };

  const handleRemoveInputImage = (indexToRemove: number) => {
    setInputImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleEditImage = async (src: string) => {
    // Convert Cloudinary URL to base64 to avoid CORS issues in the editor
    try {
      if (src.startsWith('http')) {
        console.log('🔄 Converting Cloudinary URL to base64 for editing...', src);
        
        // For Cloudinary URLs, add fetch flag for CORS
        let fetchUrl = src;
        if (src.includes('res.cloudinary.com')) {
          // Add fl_attachment to enable CORS
          fetchUrl = src.replace('/upload/', '/upload/fl_attachment/');
          console.log('🔧 Modified URL for CORS:', fetchUrl);
        }
        
        // Show loading state while converting
        setIsLoading(true);
        
        // Fetch with proper CORS mode
        const response = await fetch(fetchUrl, {
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('📦 Image blob fetched, size:', blob.size);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('✅ Image converted successfully, opening editor');
          setIsLoading(false);
          setEditingImage(reader.result as string);
        };
        reader.onerror = (e) => {
          console.error('❌ FileReader error:', e);
          setIsLoading(false);
          alert('Failed to convert image. Please try again.');
        };
        reader.readAsDataURL(blob);
      } else {
        // Already base64
        console.log('✅ Image already in base64 format, opening editor');
        setEditingImage(src);
      }
    } catch (error) {
      console.error('❌ Failed to load image for editing:', error);
      setIsLoading(false);
      alert(`Failed to load image for editing. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCloseEditor = () => {
    setEditingImage(null);
  };

  const handleGenerateFromEditor = useCallback(async (editPrompt: string, editedImage: string, editorAspectRatio?: string) => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    setEditingImage(null); // Close editor on generation start

    try {
      // Use the editor's aspect ratio if provided, otherwise use the main aspect ratio
      const finalAspectRatio = editorAspectRatio || aspectRatio;
      // We generate a single image from the editor, marking it as an edit for contextual understanding
      const resolvedImages = await generateImage(editPrompt, [editedImage], 1, finalAspectRatio, true);
      const newImages = resolvedImages.map(imageData => `data:image/png;base64,${imageData}`);
      setImages(prevImages => [...newImages, ...prevImages]);
      
      // Save generated image to database
      for (const imageDataUrl of newImages) {
        try {
          const response = await fetch(imageDataUrl);
          const blob = await response.blob();
          const file = new File([blob], `pixelmuse-edited-${Date.now()}.png`, { type: 'image/png' });
          
          await storageService.uploadImage(
            file,
            user.id,
            'pixelmuse',
            editPrompt || 'PixelMuse edited generation',
            { aspectRatio, source: 'editor' }
          );
        } catch (saveErr) {
          console.error("Failed to save edited image to database:", saveErr);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during edit generation.';
      setError(errorMessage);
      console.error("Edit generation error:", err);
      // Show user-friendly error message
      alert(`Failed to generate edited image: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [aspectRatio, user?.id]);

  return (
    <div className="bg-black min-h-screen text-white font-sans flex flex-col">
      {onBack && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#1e1f20] hover:bg-[#2c2d2f] rounded-lg text-gray-300 transition-colors"
          >
            ← Back
          </button>
        </div>
      )}
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
        <ImageGrid 
          images={images} 
          isLoading={isLoading || isLoadingCreations} 
          error={error} 
          imageCount={imageCount}
          onDeleteImage={handleDeleteImage}
          onEditImage={handleEditImage}
        />
      </main>
      <PromptBar
        prompt={prompt}
        setPrompt={setPrompt}
        onGenerate={handleGenerate}
        isLoading={isLoading}
        imageCount={imageCount}
        setImageCount={setImageCount}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        onEnhancePrompt={handleEnhancePrompt}
        isEnhancing={isEnhancing}
        inputImages={inputImages}
        onImageUpload={handleImageUpload}
        onRemoveInputImage={handleRemoveInputImage}
      />
      {editingImage && (
        <ImageEditor 
          imageSrc={editingImage}
          onClose={handleCloseEditor}
          onGenerate={(prompt, image, editorAspectRatio) => handleGenerateFromEditor(prompt, image, editorAspectRatio)}
          aspectRatio={aspectRatio}
        />
      )}
    </div>
  );
};
