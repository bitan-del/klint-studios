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
 * Resizes an image to match a specific aspect ratio
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
      
      let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
      
      // Crop to match target aspect ratio (center crop)
      if (sourceRatio > targetRatio) {
        // Source is wider - crop width
        sourceWidth = img.height * targetRatio;
        sourceX = (img.width - sourceWidth) / 2;
      } else if (sourceRatio < targetRatio) {
        // Source is taller - crop height
        sourceHeight = img.width / targetRatio;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Create canvas with target dimensions
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw cropped and resized image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
          0, 0, targetWidth, targetHeight              // Destination rectangle
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
