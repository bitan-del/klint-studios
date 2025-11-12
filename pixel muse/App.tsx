import React, { useState, useCallback, useEffect } from 'react';
import { ImageGrid } from './components/ImageGrid';
import { PromptBar } from './components/PromptBar';
import { Header } from './components/Header';
import { ImageEditor } from './components/ImageEditor';
import { generateImage, enhancePrompt } from './services/geminiService';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>(() => {
    try {
      const storedImages = localStorage.getItem('generatedImages');
      // FIX: Add validation for the parsed data from localStorage.
      if (storedImages) {
        const parsed = JSON.parse(storedImages);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          return parsed;
        }
      }
      return [];
    } catch (error) {
      console.error("Failed to parse images from localStorage", error);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [editingImage, setEditingImage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('generatedImages', JSON.stringify(images));
    } catch (error)
 {
      console.error("Failed to save images to localStorage", error);
    }
  }, [images]);

  const handleGenerate = useCallback(async () => {
    if ((!prompt && inputImages.length === 0) || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const resolvedImages = await generateImage(prompt, inputImages, imageCount, aspectRatio);
      const newImages = resolvedImages.map(imageData => `data:image/png;base64,${imageData}`);
      setImages(prevImages => [...newImages, ...prevImages]);
      setInputImages([]); // Clear input images after generation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, imageCount, inputImages, aspectRatio]);
  
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

  // FIX: Refactored to use Promise.all for robust async handling of multiple file uploads.
  // This also fixes a potential TypeScript type inference issue on `file` which could lead to
  // the "Argument of type 'unknown' is not assignable to parameter of type 'Blob'" error.
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

  const handleEditImage = (src: string) => {
    setEditingImage(src);
  };

  const handleCloseEditor = () => {
    setEditingImage(null);
  };

  const handleGenerateFromEditor = useCallback(async (editPrompt: string, editedImage: string) => {
    setIsLoading(true);
    setError(null);
    setEditingImage(null); // Close editor on generation start

    try {
        // We generate a single image from the editor, now respecting the selected aspect ratio
        const resolvedImages = await generateImage(editPrompt, [editedImage], 1, aspectRatio);
        const newImages = resolvedImages.map(imageData => `data:image/png;base64,${imageData}`);
        setImages(prevImages => [...newImages, ...prevImages]);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during edit generation.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [aspectRatio]);


  return (
    <div className="bg-black min-h-screen text-white font-sans flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
        <ImageGrid 
          images={images} 
          isLoading={isLoading} 
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
          onGenerate={handleGenerateFromEditor}
          aspectRatio={aspectRatio}
        />
      )}
    </div>
  );
};

export default App;
