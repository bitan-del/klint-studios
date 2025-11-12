import { GoogleGenAI, Modality } from "@google/genai";

// Assume API_KEY is set in the environment.
// Do not add any UI to get the API key.
if (!process.env.API_KEY) {
    // In a real app, you'd want to handle this more gracefully.
    // For this example, we'll throw an error if the key is missing.
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Takes an image data URL and places it on a new canvas with the target aspect ratio,
 * using a white background (letterboxing/pillarboxing).
 * This ensures the image sent to the model has the correct dimensions.
 * @param imageDataUrl The base64 data URL of the image to conform.
 * @param targetAspectRatio The desired aspect ratio as a string (e.g., "16:9").
 * @returns A promise that resolves with the new base64 data URL of the conformed image.
 */
const conformImageToAspectRatio = (imageDataUrl: string, targetAspectRatio: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            const [targetW, targetH] = targetAspectRatio.split(':').map(Number);
            
            // Use original image's largest dimension to set canvas scale, to avoid downscaling.
            // A max cap can be added here if needed, e.g., Math.min(Math.max(image.width, image.height), 1024)
            const maxDim = Math.max(image.width, image.height);
            let canvasWidth: number;
            let canvasHeight: number;

            // Determine canvas size based on target aspect ratio
            if (targetW / targetH > 1) { // Landscape or square
                canvasWidth = maxDim;
                canvasHeight = Math.round((maxDim * targetH) / targetW);
            } else { // Portrait
                canvasHeight = maxDim;
                canvasWidth = Math.round((maxDim * targetW) / targetH);
            }
            
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            // Fill with a white background as requested
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate scaling to fit the source image inside the canvas while maintaining its own aspect ratio
            const imageAspectRatio = image.width / image.height;
            const canvasAspectRatio = canvas.width / canvas.height;
            
            let drawWidth, drawHeight, x, y;

            if (imageAspectRatio > canvasAspectRatio) {
                // Image is wider than the canvas aspect ratio (letterbox)
                drawWidth = canvas.width;
                drawHeight = drawWidth / imageAspectRatio;
                x = 0;
                y = (canvas.height - drawHeight) / 2;
            } else {
                // Image is taller than or same as the canvas aspect ratio (pillarbox)
                drawHeight = canvas.height;
                drawWidth = drawHeight * imageAspectRatio;
                y = 0;
                x = (canvas.width - drawWidth) / 2;
            }

            ctx.drawImage(image, x, y, drawWidth, drawHeight);
            resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = (err) => {
            console.error("Image failed to load for conforming", err);
            reject(new Error('Failed to load image for aspect ratio conforming.'));
        };
        image.src = imageDataUrl;
    });
};


export const enhancePrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `The user wants to generate an image. Enhance this prompt to be more descriptive, vivid, and detailed for a text-to-image AI. Prompt: "${prompt}"`,
      config: {
        systemInstruction: "You are an expert prompt engineer for text-to-image models. You will receive a simple prompt and you must rewrite it to be more descriptive, vivid, and artistic. Return ONLY the enhanced prompt, without any conversational preamble, labels, or explanation.",
      }
    });
    // Clean up potential markdown or quotes
    return response.text.trim().replace(/^"|"$/g, '').replace(/`/g, '');
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    let errorMessage = "Failed to enhance prompt.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

export const generateImage = async (
  prompt: string,
  images: string[] = [],
  imageCount: number,
  aspectRatio: string
): Promise<string[]> => {
  try {
    if (images.length > 0) {
      // For image-to-image tasks, conform all input images to the target aspect ratio.
      const conformedImages = await Promise.all(
          images.map(imgDataUrl => conformImageToAspectRatio(imgDataUrl, aspectRatio))
      );

      const imagePromises = Array(imageCount)
        .fill(0)
        .map(async () => {
          const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
          
          if (prompt) {
            parts.push({ text: prompt });
          }

          // Add the user-provided images that are now conformed to the correct aspect ratio
          conformedImages.forEach(imageString => {
            const [header, data] = imageString.split(',');
            if (!header || !data) return; // Skip invalid data URIs
            const mimeTypeMatch = header.match(/:(.*?);/);
            if (!mimeTypeMatch || !mimeTypeMatch[1]) return;
            const mimeType = mimeTypeMatch[1];
            parts.push({
              inlineData: {
                mimeType,
                data,
              },
            });
          });

          // We need at least one part (prompt or image).
          if (parts.length === 0) {
            throw new Error('A prompt or user image is required to generate content.');
          }

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
              responseModalities: [Modality.IMAGE],
            },
          });

          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return part.inlineData.data;
            }
          }

          throw new Error('No image data found in the response.');
        });
      
      const resolvedImages = await Promise.all(imagePromises);
      return resolvedImages.filter((img): img is string => !!img);

    } else {
      // Use imagen-4.0-generate-001 for text-to-image, as it supports batch generation and aspect ratio.
      if (!prompt) {
        throw new Error('A prompt is required to generate an image.');
      }
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: imageCount,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
        },
      });
      return response.generatedImages.map(img => img.image.imageBytes);
    }
  } catch (error) {
    console.error("Error generating image:", error);
    let errorMessage = "Failed to generate image.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Re-throw a more user-friendly error
    throw new Error(errorMessage);
  }
};
