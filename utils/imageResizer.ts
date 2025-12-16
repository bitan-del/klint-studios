/**
 * Resizes a base64 encoded image to a new scale using a canvas for high-quality downsampling.
 * If the scale is 100% or more, it returns the original image to avoid upscaling.
 * @param {string} base64Str - The base64 encoded image string.
 * @param {number} scale - The target scale percentage (e.g., 50 for 50%).
 * @returns {Promise<string>} A promise that resolves to the new, resized base64 string.
 */
export const resizeImage = (base64Str: string, scale: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If we're not downscaling, return the original to prevent quality loss from upscaling.
    if (scale >= 100) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      const newWidth = Math.floor(img.width * (scale / 100));
      const newHeight = Math.floor(img.height * (scale / 100));

      // Ensure dimensions are at least 1px
      canvas.width = Math.max(1, newWidth);
      canvas.height = Math.max(1, newHeight);

      // Draw the image onto the canvas with the new dimensions.
      // This step performs the high-quality downsampling.
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Export the canvas content back to a base64 string.
      // Use PNG to preserve transparency.
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (err) => {
      reject(new Error(`Image could not be loaded for resizing: ${err}`));
    };
  });
};

/**
 * Resizes an image to match a specific aspect ratio by PADDING (no cropping)
 * Preserves the entire image content by adding white padding
 */
export const resizeImageToAspectRatio = async (
  imageDataUrl: string,
  aspectRatio: '1:1' | '4:5' | '16:9' | '9:16' | '3:4' | '4:3'
): Promise<string> => {
  const dimensions: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '4:5': { width: 1024, height: 1280 },
    '9:16': { width: 720, height: 1280 },
    '16:9': { width: 1280, height: 720 },
    '3:4': { width: 1024, height: 1365 },
    '4:3': { width: 1024, height: 768 },
  };

  const { width: targetWidth, height: targetHeight } = dimensions[aspectRatio] || dimensions['4:5'];
  const targetRatio = targetWidth / targetHeight;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const sourceRatio = img.width / img.height;

      // Calculate dimensions to fit image inside target canvas (preserve full image)
      let drawWidth = targetWidth;
      let drawHeight = targetHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (sourceRatio > targetRatio) {
        // Source is wider - fit to width, add padding top/bottom
        drawHeight = targetWidth / sourceRatio;
        offsetY = (targetHeight - drawHeight) / 2;
      } else if (sourceRatio < targetRatio) {
        // Source is taller - fit to height, add padding left/right
        drawWidth = targetHeight * sourceRatio;
        offsetX = (targetWidth - drawWidth) / 2;
      }

      // Create canvas with target dimensions
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fill with white background (padding)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw image centered with padding (preserves full image, no cropping)
        ctx.drawImage(
          img,
          offsetX, offsetY, drawWidth, drawHeight
        );
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
};

/**
 * Resizes an image to fit within max dimensions while preserving aspect ratio.
 * Does NOT add padding. Use this for reference images where context matters.
 */
export const resizeImageToMaxDimension = async (
  imageDataUrl: string,
  maxWidth: number = 1024,
  maxHeight: number = 1024
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      } else {
        // No resize needed
        resolve(imageDataUrl);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
};
