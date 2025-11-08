import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2, Search, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService, type UserImage } from '../../services/storageService';

interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  title?: string;
  workflowId?: string; // Optional: filter by workflow
}

export const ImageLibraryModal: React.FC<ImageLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select from My Creations',
  workflowId
}) => {
  const { user } = useAuth();
  const [images, setImages] = useState<UserImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<UserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadImages();
    }
  }, [isOpen, user, workflowId]);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = images.filter(img => 
        img.prompt?.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredImages(filtered);
    } else {
      setFilteredImages(images);
    }
  }, [searchQuery, images]);

  const loadImages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Don't filter by workflowId - show all user images
      // Users should be able to use any of their creations in any workflow
      const userImages = await storageService.getUserImages(user.id);
      setImages(userImages);
      setFilteredImages(userImages);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (image: UserImage) => {
    setSelectedImageId(image.id);
    onSelect(image.cloudinary_url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-6xl max-h-[90vh] flex flex-col z-[10001]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by prompt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 pl-10 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
              <p className="text-zinc-400">Loading your creations...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-semibold">No images found</p>
              <p className="text-sm">Start creating to see your images here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  onClick={() => handleSelect(image)}
                  className={`
                    relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                    ${selectedImageId === image.id 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/50' 
                      : 'border-zinc-800 hover:border-zinc-700'
                    }
                  `}
                >
                  <img
                    src={image.cloudinary_url}
                    alt={image.prompt || 'Generated Image'}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {selectedImageId === image.id ? (
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <p className="text-white text-sm text-center px-2 line-clamp-2">
                        {image.prompt || 'No prompt'}
                      </p>
                    )}
                  </div>
                  {image.prompt && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-xs truncate">{image.prompt}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''} found
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

