import React from 'react';
import { ModelInfo } from './ModelInfo';
import { DownloadIcon, CopyIcon, DeleteIcon, EditIcon } from './icons';

interface ImageGridProps {
  images: string[];
  isLoading: boolean;
  error: string | null;
  imageCount: number;
  onDeleteImage: (index: number) => void;
  onEditImage: (src: string) => void;
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


export const ImageGrid: React.FC<ImageGridProps> = ({ images, isLoading, error, imageCount, onDeleteImage, onEditImage }) => {
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
        
        {images.length > 0 ? images.map((src, index) => (
          <div key={`${index}-${src.slice(-10)}`} className="relative group aspect-[2/3] cursor-pointer" onClick={() => onEditImage(src)}>
            <img src={src} alt={`Generated art ${index + 1}`} className="w-full h-full object-cover rounded-lg" loading="lazy" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 rounded-lg flex items-end justify-between p-3">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-full">
                  <ModelInfo />
              </div>
              <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button onClick={(e) => { e.stopPropagation(); onEditImage(src); }} className="p-1.5 bg-black/50 rounded-md hover:bg-black/80" aria-label="Edit image"><EditIcon /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDownload(src, index); }} className="p-1.5 bg-black/50 rounded-md hover:bg-black/80" aria-label="Download image"><DownloadIcon /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleCopy(src); }} className="p-1.5 bg-black/50 rounded-md hover:bg-black/80" aria-label="Copy image"><CopyIcon /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteImage(index); }} className="p-1.5 bg-black/50 rounded-md hover:bg-black/80" aria-label="Delete image"><DeleteIcon /></button>
              </div>
            </div>
          </div>
        )) : !isLoading && <EmptyState />}
      </div>
    </div>
  );
};

