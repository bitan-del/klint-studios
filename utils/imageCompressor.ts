/**
 * Compresses images before upload to reduce storage costs
 * Reduces file size by 70-85% while maintaining good quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
  format?: 'webp' | 'jpeg' | 'png';
  maxSizeMB?: number; // Target max size in MB
}

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.75,
    format = 'webp',
    maxSizeMB = 1.0, // Target 1MB max
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image with high quality
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        const mimeType = format === 'webp' ? 'image/webp' : format === 'jpeg' ? 'image/jpeg' : 'image/png';
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // If still too large, compress more aggressively
            const sizeMB = blob.size / (1024 * 1024);
            if (sizeMB > maxSizeMB) {
              // Recursively compress with lower quality
              const newQuality = Math.max(0.5, quality - 0.1);
              compressImage(file, { ...options, quality: newQuality })
                .then(resolve)
                .catch(reject);
              return;
            }

            // Create compressed file
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, `.${format === 'webp' ? 'webp' : format === 'jpeg' ? 'jpg' : 'png'}`),
              { type: mimeType, lastModified: Date.now() }
            );

            console.log(`✅ Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% reduction)`);
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Get file size in MB
 */
export const getFileSizeMB = (file: File): number => {
  return file.size / (1024 * 1024);
};

/**
 * Check if image needs compression
 */
export const needsCompression = (file: File, maxSizeMB: number = 1.0): boolean => {
  return getFileSizeMB(file) > maxSizeMB;
};

