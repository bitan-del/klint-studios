import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Trash2, 
  Download, 
  Filter, 
  Search,
  X,
  Loader2,
  HardDrive,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService, type UserImage } from '../../services/storageService';
import { getPlanDisplayName } from '../../services/permissionsService';

interface MyCreationsProps {
  onBack?: () => void;
  onRefresh?: () => void;
}

type FilterType = 'all' | 'ai-photoshoot' | 'product-photography' | 'virtual-tryon' | 'photo-editor' | 'storyboard' | 'social-media-posts' | 'style-transfer' | 'upscale' | 'video';

const WORKFLOW_NAMES: Record<string, string> = {
  'ai-photoshoot': 'AI Photoshoot',
  'product-photography': 'Product Photography',
  'virtual-tryon': 'Virtual Try-On',
  'photo-editor': 'Photo Editor',
  'storyboard': 'Photo to Prompt',
  'social-media-posts': 'Social Media Posts',
  'style-transfer': 'Style Transfer',
  'upscale': 'Image Upscale',
  'video': 'Video',
};

export const MyCreations: React.FC<MyCreationsProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [images, setImages] = useState<UserImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<UserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [storageInfo, setStorageInfo] = useState({ images_stored: 0, storage_limit: 10, usage_percentage: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showCanvaInstructions, setShowCanvaInstructions] = useState(false);
  const [canvaImageUrl, setCanvaImageUrl] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadImages();
      loadStorageInfo();
    }
  }, [user]);

  // Reload images when component becomes visible (user navigates to this page)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadImages();
        loadStorageInfo();
      }
    };
    
    // Reload when window gains focus
    window.addEventListener('focus', handleFocus);
    
    // Also reload on mount/visibility change
    if (document.visibilityState === 'visible' && user) {
      loadImages();
      loadStorageInfo();
    }
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  useEffect(() => {
    filterImages();
  }, [images, selectedFilter, searchQuery]);

  const loadImages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userImages = await storageService.getUserImages(user.id);
      setImages(userImages);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    if (!user) return;
    
    try {
      const info = await storageService.getStorageInfo(user.id);
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const filterImages = () => {
    let filtered = [...images];

    // Filter by workflow
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(img => img.workflow_id === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(img => 
        img.prompt?.toLowerCase().includes(query) ||
        img.workflow_id?.toLowerCase().includes(query) ||
        WORKFLOW_NAMES[img.workflow_id || '']?.toLowerCase().includes(query)
      );
    }

    setFilteredImages(filtered);
  };

  const handleDelete = async (imageId: string) => {
    if (!user) return;

    setDeleting(imageId);
    try {
      await storageService.deleteImage(imageId, user.id);
      // Remove from local state
      setImages(images.filter(img => img.id !== imageId));
      // Reload storage info
      await loadStorageInfo();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    } finally {
      setDeleting(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleDownload = (imageUrl: string, imageId: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `klint_${imageId}.${imageUrl.split('.').pop()?.split('?')[0] || 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getWorkflowOptions = () => {
    const workflows = Array.from(new Set(images.map(img => img.workflow_id).filter(Boolean)));
    return workflows.map(wf => ({
      value: wf as FilterType,
      label: WORKFLOW_NAMES[wf || ''] || wf,
    }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-400">Please log in to view your creations</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-4 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={20} />
              <span>Back</span>
            </button>
          )}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="text-emerald-400" size={32} />
                My Creations
              </h1>
              <p className="text-zinc-400">View and manage all your generated images</p>
            </div>
          </div>

          {/* Storage Info */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="text-emerald-400" size={20} />
                <span className="text-sm font-medium text-zinc-300">Storage Usage</span>
              </div>
              <span className="text-sm text-zinc-400">
                {storageInfo.images_stored} / {storageInfo.storage_limit} images
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  storageInfo.usage_percentage >= 90
                    ? 'bg-red-500'
                    : storageInfo.usage_percentage >= 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${storageInfo.usage_percentage}%` }}
              />
            </div>
            {storageInfo.usage_percentage >= 90 && (
              <div className="flex items-center gap-2 text-amber-400 text-xs mt-2">
                <AlertCircle size={14} />
                <span>Storage almost full! Delete old images to free up space.</span>
              </div>
            )}
            <p className="text-xs text-zinc-500 mt-2">
              {getPlanDisplayName(user.plan)} Plan • {storageInfo.storage_limit} image limit
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search by prompt or workflow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
              className="pl-10 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
            >
              <option value="all">All Workflows</option>
              {getWorkflowOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Images Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="mx-auto text-zinc-700 mb-4" size={64} />
            <p className="text-zinc-400 text-lg mb-2">No images found</p>
            <p className="text-zinc-500 text-sm">
              {images.length === 0
                ? "You haven't created any images yet. Start creating to see them here!"
                : "Try adjusting your filters or search query."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-emerald-500/50 transition-all"
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden bg-zinc-950">
                  <img
                    src={image.cloudinary_url}
                    alt={image.prompt || 'Generated image'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 px-4">
                    {/* Canva Button */}
                    <button
                      onClick={async () => {
                        try {
                          // Copy image URL to clipboard
                          await navigator.clipboard.writeText(image.cloudinary_url);
                          
                          // Try to use Canva API to import image
                          const { importImageToCanva, isCanvaAuthenticated } = await import('../../services/canvaService');
                          
                          if (isCanvaAuthenticated()) {
                            const result = await importImageToCanva(image.cloudinary_url);
                            if (result.method === 'api' && result.designId) {
                              // API method: Open the design directly in editor
                              window.open(result.editUrl, '_blank');
                              return;
                            }
                          }
                          
                          // Fallback: Open Canva and show instructions modal
                          setCanvaImageUrl(image.cloudinary_url);
                          window.open('https://www.canva.com/create', '_blank');
                          setShowCanvaInstructions(true);
                        } catch (err) {
                          console.error('Error opening Canva:', err);
                          // Final fallback
                          try {
                            await navigator.clipboard.writeText(image.cloudinary_url);
                            setCanvaImageUrl(image.cloudinary_url);
                            window.open('https://www.canva.com/create', '_blank');
                            setShowCanvaInstructions(true);
                          } catch (e) {
                            console.error('Failed to copy URL:', e);
                            alert('Failed to copy URL. Please manually copy the image URL and upload it to Canva.');
                          }
                        }
                      }}
                      className="flex-1 px-2 py-0.5 bg-gray-900/80 hover:bg-gray-800/90 border border-gray-600/50 rounded-lg transition-all flex items-center justify-center backdrop-blur-sm shadow-lg h-[34px]"
                      title="Edit image in Canva"
                    >
                      {/* Canva Logo */}
                      <img 
                        src="/icons/canva-logo.png" 
                        alt="Canva" 
                        className="w-9 h-9 rounded-full flex-shrink-0 object-contain brightness-0 invert"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    </button>
                    
                    <button
                      onClick={() => handleDownload(image.cloudinary_url, image.id)}
                      className="flex-1 p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center justify-center h-[34px]"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(image.id)}
                      className="flex-1 p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center justify-center h-[34px]"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  {image.workflow_id && (
                    <div className="text-xs text-emerald-400 mb-1 font-medium">
                      {WORKFLOW_NAMES[image.workflow_id] || image.workflow_id}
                    </div>
                  )}
                  {image.prompt && (
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                      {image.prompt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(image.created_at)}
                    </div>
                    {image.compressed_size && (
                      <span>{formatFileSize(image.compressed_size)}</span>
                    )}
                  </div>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === image.id && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10 p-4">
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 max-w-xs w-full">
                      <p className="text-white mb-4 text-sm">
                        Are you sure you want to delete this image?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(image.id)}
                          disabled={deleting === image.id}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {deleting === image.id ? (
                            <Loader2 className="animate-spin mx-auto" size={16} />
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More (if needed) */}
        {filteredImages.length > 0 && filteredImages.length % 50 === 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Canva Instructions Modal */}
      {showCanvaInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <img 
                  src="https://static.canva.com/web/images/12487a1e0770d29351bd4ce9622e97db.ico" 
                  alt="Canva" 
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                How to Add Image to Canva
              </h3>
              <button
                onClick={() => setShowCanvaInstructions(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                  <ImageIcon size={16} />
                  Image URL copied to clipboard! 📋
                </p>
              </div>
              <div className="space-y-3 text-zinc-300">
                <p className="text-sm">Follow these steps in Canva:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Click <strong className="text-white">"Uploads"</strong> in the left sidebar</li>
                  <li>Click <strong className="text-white">"Upload an image or video"</strong></li>
                  <li>Click <strong className="text-white">"Paste image URL"</strong> or paste the URL (Ctrl+V / Cmd+V)</li>
                  <li>Click <strong className="text-white">"Add to design"</strong></li>
                </ol>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={async () => {
                    if (canvaImageUrl) {
                      await navigator.clipboard.writeText(canvaImageUrl);
                    }
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Copy URL Again
                </button>
                <button
                  onClick={() => setShowCanvaInstructions(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

