import React from 'react';
import { ModelInfo } from './ModelInfo';
import { DownloadIcon, CopyIcon, DeleteIcon, EditIcon } from './icons';
import { Video } from 'lucide-react';

import { UserImage } from '../../services/storageService';

interface ImageGridProps {
  images: UserImage[];
  isLoading: boolean;
  error: string | null;
  imageCount: number;
  onDeleteImage: (index: number) => void;
  onEditImage: (src: string) => void;
  onVideoGenerate?: (src: string) => void;
}

const SkeletonLoader: React.FC = () => (
  <div className="aspect-[2/3] bg-[#1a1a1a] rounded-lg flex items-center justify-center animate-pulse">
    <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="col-span-full h-full flex flex-col items-center justify-center text-center text-gray-500">
    <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <h2 className="text-xl font-semibold text-gray-400">Your gallery is empty</h2>
    <p className="mt-1">Generated images will appear here.</p>
  </div>
);

export const ImageGrid: React.FC<ImageGridProps> = ({ images, isLoading, error, imageCount, onDeleteImage, onEditImage, onVideoGenerate }) => {
  const handleDownload = (src: string, index: number) => {
    const a = document.createElement('a');
    a.href = src;
    a.download = `generated-image-${index}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async (src: string) => {
    try {
      // FIX: Manually convert data URL to Blob to fix "unknown is not assignable to Blob" error,
      // which can occur due to environment or typing issues with fetch() on data URLs.
      const parts = src.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (!mimeMatch || !parts[1]) {
        // If it's a URL (not data URL), try fetching it
        if (src.startsWith('http')) {
          const response = await fetch(src);
          const blob = await response.blob();
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          alert('Image copied to clipboard!');
          return;
        }
        throw new Error('Invalid data URL format for copying.');
      }
      const mimeType = mimeMatch[1];
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mimeType });

      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      // Consider a more subtle notification system in a real app
      alert('Image copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy image: ', err);
      alert('Failed to copy image.');
    }
  };


  return (
    <div className="w-full h-full max-w-7xl mx-auto overflow-y-auto pr-2">
      {error && (
        <div className="col-span-full flex items-center justify-center text-red-400 bg-red-900/50 p-3 rounded-lg mb-4">
          <p>Error: {error}</p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading && Array.from({ length: imageCount }).map((_, index) => <SkeletonLoader key={`loading-${index}`} />)}

        {images.length > 0 ? images.map((image, index) => (
          <div key={image.id || `${index}-${image.cloudinary_url?.slice(-10)}`} className="relative group aspect-[2/3] cursor-pointer" onClick={() => onEditImage(image.cloudinary_url)}>
            <img
              src={image.cloudinary_url}
              alt={`Generated art ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                console.error('❌ Failed to load image:', image.cloudinary_url);
                
                // Try to fix common Cloudinary URL issues
                if (image.cloudinary_url && image.cloudinary_url.includes('res.cloudinary.com')) {
                  // Ensure HTTPS
                  const fixedUrl = image.cloudinary_url.replace('http://', 'https://');
                  if (fixedUrl !== image.cloudinary_url) {
                    target.src = fixedUrl;
                    return;
                  }
                  // Try adding transformation for better compatibility
                  if (image.cloudinary_url.includes('/upload/')) {
                    const parts = image.cloudinary_url.split('/upload/');
                    if (parts.length === 2 && !image.cloudinary_url.includes('/f_')) {
                      target.src = `${parts[0]}/upload/f_auto/${parts[1]}`;
                      return;
                    }
                  }
                }
                
                // Fallback placeholder
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Crect fill="%23171717" width="400" height="600"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
                target.parentElement?.classList.add('image-error');
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 rounded-lg flex items-end justify-between p-3">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-full">
                <ModelInfo quality={image.metadata?.quality} feature={image.metadata?.feature} />
              </div>
              <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={(e) => { e.stopPropagation(); onEditImage(image.cloudinary_url); }} className="p-1.5 bg-black/50 rounded-md hover:bg-black/80" aria-label="Edit image"><EditIcon /></button>
                {onVideoGenerate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onVideoGenerate(image.cloudinary_url); }}
                    className="p-1.5 bg-emerald-900/60 hover:bg-emerald-900/80 backdrop-blur-md border border-emerald-500/30 text-emerald-100 hover:text-white rounded-md transition-all shadow-lg shadow-emerald-900/20"
                    aria-label="Generate video"
                    title="Generate Video"
                  >
                    <Video size={16} />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleDownload(image.cloudinary_url, index); }} className="p-1.5 bg-black/50 rounded-md hover:bg-black/80" aria-label="Download image"><DownloadIcon /></button>
                <button onClick={(e) => { e.stopPropagation(); handleCopy(image.cloudinary_url); }} className="p-1.5 bg-black/50 rounded-md hover:bg-black/80" aria-label="Copy image"><CopyIcon /></button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteImage(index); }} className="p-1.5 bg-black/50 rounded-md hover:bg-black/80" aria-label="Delete image"><DeleteIcon /></button>
              </div>
            </div>
          </div>
        )) : !isLoading && <EmptyState />}
      </div>
    </div>
  );
};

