import type { AspectRatio, ArtDirectorSuggestion, ApparelCategory, AIModel, SceneSuggestion } from "../types";
import { BACKGROUNDS_LIBRARY, LIGHTING_PRESETS, SHOT_TYPES_LIBRARY, EXPRESSIONS, APERTURES_LIBRARY, FOCAL_LENGTHS_LIBRARY, CAMERA_ANGLES_LIBRARY, COLOR_GRADING_PRESETS } from "../constants";

// Get Supabase URL for Edge Function
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const API_BASE_URL = SUPABASE_URL
    ? `${SUPABASE_URL}/functions/v1/vertex-ai`
    : 'http://localhost:54321/functions/v1/vertex-ai'; // Fallback for local Supabase

// Cache for Vertex AI config
let cachedConfig: { projectId: string; location: string; credentialsPath?: string } | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Function to refresh the cached config
export const refreshVertexConfig = () => {
    console.log('🔄 Refreshing Vertex AI config cache...');
    cachedConfig = null;
    cacheTimestamp = 0;

    // Broadcast to other tabs via localStorage
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('vertex_config_updated', Date.now().toString());
            setTimeout(() => {
                localStorage.removeItem('vertex_config_updated');
            }, 100);
        } catch (e) {
            console.warn('Could not broadcast cache invalidation:', e);
        }
    }
};

// Listen for cache invalidation events from other tabs
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === 'vertex_config_updated') {
            console.log('🔄 Vertex config updated in another tab, clearing cache...');
            refreshVertexConfig();
        }
    });
}

// Get Vertex AI config from database or environment
const getVertexConfig = async (forceFresh: boolean = false): Promise<{ projectId: string; location: string; credentialsPath?: string } | null> => {
    const now = Date.now();
    const isCacheExpired = !cachedConfig || (now - cacheTimestamp) > CACHE_TTL;

    if (cachedConfig && !isCacheExpired && !forceFresh) {
        return cachedConfig;
    }

    try {
        // Try to fetch from database first
        const { databaseService } = await import('./databaseService');
        const projectId = await databaseService.getAdminSetting('vertex_project_id');
        const location = await databaseService.getAdminSetting('vertex_location');
        const credentialsPath = await databaseService.getAdminSetting('vertex_credentials_path');

        if (projectId && location) {
            const config = {
                projectId,
                location,
                credentialsPath: credentialsPath || undefined,
            };
            cachedConfig = config;
            cacheTimestamp = Date.now();
            console.log('✅ Using Vertex AI config from database');
            return config;
        }

        // Fallback to environment variables
        const envProjectId = import.meta.env.VITE_VERTEX_PROJECT_ID;
        const envLocation = import.meta.env.VITE_VERTEX_LOCATION || 'us-central1';
        const envCredentialsPath = import.meta.env.VITE_VERTEX_CREDENTIALS_PATH;

        if (envProjectId) {
            const config = {
                projectId: envProjectId,
                location: envLocation,
                credentialsPath: envCredentialsPath || undefined,
            };
            cachedConfig = config;
            cacheTimestamp = Date.now();
            console.log('✅ Using Vertex AI config from environment variables');
            return config;
        }

        return null;
    } catch (error) {
        console.error('Error fetching Vertex AI config:', error);
        return null;
    }
};

// Helper to make API calls to Supabase Edge Function
async function callVertexAPI(endpoint: string, body: any): Promise<any> {
    // Get Supabase client for authentication
    const { supabase } = await import('./supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('Not authenticated. Please log in to use Vertex AI features.');
    }

    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
            endpoint,
            ...body,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API request failed: ${response.statusText}`);
    }

    return response.json();
}

// Helper to process image input
const processImageInput = async (input: string): Promise<{ mimeType: string; data: string }> => {
    const match = input.match(/^data:(.*?);base64,(.*)$/);
    if (match) {
        return {
            mimeType: match[1],
            data: match[2],
        };
    }

    if (input.startsWith('http')) {
        try {
            const response = await fetch(input);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    const match = base64data.match(/^data:(.*?);base64,(.*)$/);
                    if (match) {
                        resolve({
                            mimeType: match[1],
                            data: match[2],
                        });
                    } else {
                        reject(new Error("Failed to convert fetched image to base64"));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Error fetching image URL:", error);
            throw new Error(`Failed to fetch image from URL: ${input}`);
        }
    }

    throw new Error("Invalid image input: must be data URL or http URL");
};

// Mock functions for when Vertex AI is not available
const mockGetChatbotResponse = (question: string, context: string): string => {
    return "I'm currently unavailable, but I can help you with creative projects when the AI service is configured.";
};

const mockAnalyzeImage = (imageB64: string, customPrompt: string): string => {
    return "This is a detailed image with professional composition and lighting.";
};

const mockOptimizePrompt = (prompt: string, context: string): string => {
    return prompt; // Return as-is when service unavailable
};

const mockGenerateWithImagen = async (prompt: string, aspectRatio: AspectRatio['value']): Promise<string> => {
    // Return a placeholder image
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
};

// Main service object
export const vertexService = {
    getChatbotResponse: async (question: string, context: string): Promise<string> => {
        const config = await getVertexConfig();
        if (!config) return mockGetChatbotResponse(question, context);

        const prompt = `CONTEXT:
---
${context}
---
QUESTION: ${question}`;

        try {
            // Try Gemini 3 Pro first (preview), fallback to 2.5 Flash if not available
            let result;
            try {
                result = await callVertexAPI('generate-content', {
                    model: 'gemini-3-pro-preview-11-2025',
                    prompt,
                    systemInstruction: "You are Chason, an expert Creative Director and AI Guide for 'Klint Studios'. Your goal is to actively guide users to the right tools and workflows to achieve their creative vision. \n\nYour Knowledge Base:\nUse the provided CONTEXT (app documentation) to understand features. \n\nKey Behaviors:\n1. **Step-by-Step Guidance:** Do NOT overwhelm the user with long lists. Give ONE instruction at a time. Ask if they are ready for the next step.\n2. **Direct Navigation:** When suggesting a tool, ALWAYS provide a direct link using this format: `[Go to Tool Name](action:mode_name)`. Valid modes are: `apparel`, `product`, `design`, `reimagine`, `video`.\n3. **Be Action-Oriented:** Instead of describing, tell them what to click. Example: 'First, let's go to the [Product Studio](action:product) to upload your image.'\n4. **Be Creative:** If the user's request is vague, suggest specific, high-quality aesthetic ideas.\n5. **Tone:** Professional, encouraging, and sophisticated. You are a top-tier design consultant.\n6. **Formatting:** Use bold text for feature names and UI elements.\n\nIf a user asks something outside the app's scope, politely pivot back to how Klint Studios can help them create visuals.",
                });
            } catch (error: any) {
                // Fallback to Gemini 2.5 Flash if 3 Pro is not available
                if (error.message?.includes('404') || error.message?.includes('NOT_FOUND')) {
                    console.log('⚠️ Gemini 3 Pro not available, falling back to Gemini 2.5 Flash');
                    result = await callVertexAPI('generate-content', {
                        model: 'gemini-2.5-flash',
                        prompt,
                        systemInstruction: "You are Chason, an expert Creative Director and AI Guide for 'Klint Studios'. Your goal is to actively guide users to the right tools and workflows to achieve their creative vision. \n\nYour Knowledge Base:\nUse the provided CONTEXT (app documentation) to understand features. \n\nKey Behaviors:\n1. **Step-by-Step Guidance:** Do NOT overwhelm the user with long lists. Give ONE instruction at a time. Ask if they are ready for the next step.\n2. **Direct Navigation:** When suggesting a tool, ALWAYS provide a direct link using this format: `[Go to Tool Name](action:mode_name)`. Valid modes are: `apparel`, `product`, `design`, `reimagine`, `video`.\n3. **Be Action-Oriented:** Instead of describing, tell them what to click. Example: 'First, let's go to the [Product Studio](action:product) to upload your image.'\n4. **Be Creative:** If the user's request is vague, suggest specific, high-quality aesthetic ideas.\n5. **Tone:** Professional, encouraging, and sophisticated. You are a top-tier design consultant.\n6. **Formatting:** Use bold text for feature names and UI elements.\n\nIf a user asks something outside the app's scope, politely pivot back to how Klint Studios can help them create visuals.",
                    });
                } else {
                    throw error;
                }
            }
            return result.text;
        } catch (error) {
            console.error("Error getting chatbot response from Vertex AI:", error);
            return mockGetChatbotResponse(question, context);
        }
    },

    analyzeImage: async (imageB64: string, customPrompt: string): Promise<string> => {
        const config = await getVertexConfig();
        if (!config) return mockAnalyzeImage(imageB64, customPrompt);

        try {
            const { mimeType, data } = await processImageInput(imageB64);
            // Try Gemini 3 Pro first, fallback to 2.5 Flash
            let result;
            try {
                result = await callVertexAPI('generate-content-with-images', {
                    model: 'gemini-3-pro-preview-11-2025',
                    prompt: customPrompt,
                    images: [{ mimeType, data }],
                });
            } catch (error: any) {
                if (error.message?.includes('404') || error.message?.includes('NOT_FOUND')) {
                    console.log('⚠️ Gemini 3 Pro not available, falling back to Gemini 2.5 Flash');
                    result = await callVertexAPI('generate-content-with-images', {
                        model: 'gemini-2.5-flash',
                        prompt: customPrompt,
                        images: [{ mimeType, data }],
                    });
                } else {
                    throw error;
                }
            }
            return result.text;
        } catch (error) {
            console.error("Error analyzing image with Vertex AI:", error);
            return mockAnalyzeImage(imageB64, customPrompt);
        }
    },

    optimizePrompt: async (prompt: string, context: string): Promise<string> => {
        const config = await getVertexConfig();
        if (!config) return mockOptimizePrompt(prompt, context);

        const fullPrompt = `You are a professional prompt engineer. Your task is to rewrite the user's input to make it more descriptive, detailed, and effective for a generative AI model.
Context: The user is trying to generate an image or text related to "${context}".
User's Input: "${prompt}"

Rewrite the user's input into a professional, high-quality prompt. Return ONLY the rewritten prompt text. Do not add any conversational filler or explanations.`;

        try {
            // Try Gemini 3 Pro first, fallback to 2.5 Flash
            let result;
            try {
                result = await callVertexAPI('generate-content', {
                    model: 'gemini-3-pro-preview-11-2025',
                    prompt: fullPrompt,
                });
            } catch (error: any) {
                if (error.message?.includes('404') || error.message?.includes('NOT_FOUND')) {
                    console.log('⚠️ Gemini 3 Pro not available, falling back to Gemini 2.5 Flash');
                    result = await callVertexAPI('generate-content', {
                        model: 'gemini-2.5-flash',
                        prompt: fullPrompt,
                    });
                } else {
                    throw error;
                }
            }
            return result.text.trim();
        } catch (error) {
            console.error("Error optimizing prompt with Vertex AI:", error);
            return mockOptimizePrompt(prompt, context);
        }
    },

    generateWithImagen: async (prompt: string, aspectRatio: AspectRatio['value']): Promise<string> => {
        const config = await getVertexConfig();
        if (!config) return mockGenerateWithImagen(prompt, aspectRatio);

        try {
            const result = await callVertexAPI('generate-images', {
                prompt,
                aspectRatio,
                numberOfImages: 1,
            });
            // Adjust based on actual API response structure
            if (result.images && result.images.length > 0) {
                return result.images[0];
            }
            throw new Error('No images returned from API');
        } catch (error) {
            console.error("Error generating with Imagen via Vertex AI:", error);
            return mockGenerateWithImagen(prompt, aspectRatio);
        }
    },

    // Placeholder methods - these need to be implemented based on your specific needs
    analyzeApparel: async (imageB64: string): Promise<{ description: string; category: ApparelCategory }> => {
        // Implementation needed
        return { category: 'Uncategorized', description: '' };
    },

    suggestLayering: async (items: { id: string, description: string, category: ApparelCategory }[]): Promise<string[]> => {
        // Implementation needed
        return [];
    },

    describeModel: async (imageB64: string): Promise<string> => {
        // Implementation needed
        return '';
    },

    generateSceneSuggestions: async (imageB64: string): Promise<SceneSuggestion[]> => {
        // Implementation needed
        return [];
    },

    removeBackground: async (imageB64: string): Promise<string> => {
        // Implementation needed
        return imageB64;
    },

    describeImageStyle: async (imageB64: string): Promise<string> => {
        // Implementation needed
        return '';
    },

    generateArtDirectorSuggestions: async (imageB64: string, category: ApparelCategory): Promise<ArtDirectorSuggestion[]> => {
        // Implementation needed
        return [];
    },

    generateConceptSuggestions: async (imageB64: string): Promise<{ name: string; description: string }[]> => {
        // Implementation needed
        return [];
    },

    generatePhotoshootImage: async (
        baseParts: any[],
        aspectRatio: AspectRatio['value'],
        numberOfImages: number,
        negativePrompt: string | undefined,
        onImageGenerated: (imageB64: string, index: number) => void
    ): Promise<void> => {
        // Implementation needed
        console.warn('generatePhotoshootImage not yet implemented for Vertex AI');
    },

    generativeEdit: async (params: {
        originalImageB64: string,
        maskImageB64: string,
        prompt: string,
        apparelImageB64?: string | null
    }): Promise<string> => {
        // Implementation needed
        throw new Error('Generative edit not yet implemented for Vertex AI');
    },

    generatePhotoshootVideo: async (
        prompt: string,
        aspectRatio: '16:9' | '9:16',
        resolution: '720p' | '1080p',
        sourceImageB64?: string | null
    ): Promise<any> => {
        const config = await getVertexConfig();
        if (!config) {
            throw new Error('Vertex AI not configured');
        }

        try {
            const result = await callVertexAPI('generate-video', {
                prompt,
                aspectRatio,
                resolution,
                sourceImage: sourceImageB64,
            });
            return result.operation;
        } catch (error) {
            console.error("Error generating video with Vertex AI:", error);
            throw error;
        }
    },

    getVideoOperationStatus: async (operation: any): Promise<any> => {
        const config = await getVertexConfig();
        if (!config) {
            throw new Error('Vertex AI not configured');
        }

        try {
            const result = await callVertexAPI('video-operation-status', {
                operationName: operation.name,
            });
            return result.operation;
        } catch (error) {
            console.error("Error getting video operation status:", error);
            throw error;
        }
    },

    fetchVideoAsBlobUrl: async (url: string): Promise<string> => {
        // Implementation needed - may require authentication
        const response = await fetch(url);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    },

    // Additional methods that may be needed
    generateStyledImage: async (
        prompt: string,
        imageUrls: string[],
        quality: 'standard' | 'hd' | 'uhd' | 'regular' | 'qhd',
        style: string,
        aspectRatio: AspectRatio['value']
    ): Promise<string> => {
        const config = await getVertexConfig();
        if (!config) {
            throw new Error('Vertex AI not configured. Please set up project ID and location in Admin Panel → Integrations.');
        }

        // Standalone function to handle generation with retry logic
        // This avoids 'this' context issues during recursion
        const executeStyledImageGeneration = async (
            prompt: string,
            imageUrls: string[],
            quality: 'standard' | 'hd' | 'uhd' | 'regular' | 'qhd',
            style: string,
            aspectRatio: AspectRatio['value']
        ): Promise<string> => {
            // Map quality names to API values
            const qualityMap: Record<string, 'standard' | 'hd' | 'uhd'> = {
                'regular': 'standard',
                'standard': 'standard',
                'hd': 'hd',
                'qhd': 'uhd',
                'uhd': 'uhd'
            };

            const mappedQuality = qualityMap[quality] || 'standard';

            // Load style image if needed
            let styleImageUrl = '';
            if (style && style !== 'auto' && style !== 'realistic') {
                try {
                    const { loadStyleImage } = await import('../utils/styleImageLoader');
                    styleImageUrl = await loadStyleImage(style);

                    // Resize style image to match aspect ratio
                    if (styleImageUrl) {
                        const { resizeImageToAspectRatio } = await import('../utils/imageResizer');
                        styleImageUrl = await resizeImageToAspectRatio(styleImageUrl, aspectRatio);
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not load style image for ${style}:`, error);
                }
            }

            // Combine style image with reference images
            let allImages = styleImageUrl ? [styleImageUrl, ...imageUrls] : imageUrls;

            // OPTIMIZATION: Resize all reference images to target aspect ratio to reduce payload size
            // This prevents Edge Function OOM and timeouts
            if (allImages.length > 0) {
                try {
                    const { resizeImageToAspectRatio } = await import('../utils/imageResizer');

                    console.log(`Processing ${allImages.length} images for Vertex AI...`);

                    // Process images in parallel
                    allImages = await Promise.all(allImages.map(async (imgUrl) => {
                        try {
                            // If it's already a data URL, resize it directly
                            if (imgUrl.startsWith('data:')) {
                                return await resizeImageToAspectRatio(imgUrl, aspectRatio);
                            }
                            // If it's a remote URL, fetch it first then resize
                            else if (imgUrl.startsWith('http')) {
                                const response = await fetch(imgUrl);
                                const blob = await response.blob();
                                return new Promise((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                        const base64 = reader.result as string;
                                        const resized = await resizeImageToAspectRatio(base64, aspectRatio);
                                        resolve(resized);
                                    };
                                    reader.readAsDataURL(blob);
                                });
                            }
                            return imgUrl;
                        } catch (e) {
                            console.warn('Failed to optimized image:', e);
                            return imgUrl; // Fallback to original
                        }
                    }));

                    console.log('✅ All images optimized for Vertex AI');
                } catch (error) {
                    console.warn('⚠️ Image optimization failed, sending originals:', error);
                }
            }

            // Build enhanced prompt with style instructions
            const STYLE_PROMPTS: Record<string, string> = {
                'auto': '',
                'realistic': 'Photo-realistic style with natural lighting, high detail, and professional photography quality',
                'cinematic-drama': 'Cinematic style with high contrast, dramatic lighting, deep shadows, and rich color grading like a Hollywood film',
                '3d-render': 'Clean 3D rendered style with smooth surfaces, soft lighting, cute character design, Pixar-like quality',
                'retro-print': 'Vintage halftone print aesthetic with dot patterns, limited color palette, retro newspaper or magazine style',
                'aquarelle': 'Soft watercolor painting style with flowing colors, gentle brush strokes, artistic paper texture',
                '80s-glow': 'Retro 1980s aesthetic with neon cyan and magenta lighting, soft focus glow, synthwave vibe, vibrant colors',
                '90s-vibe': 'Nostalgic 1990s film photography with natural grain, slightly faded colors, authentic film stock look',
                'organic-shapes': 'Abstract style with flowing organic forms, smooth curves, artistic interpretation with natural shapes',
                'analog-film': 'Classic analog film look with authentic grain, rich colors, slight imperfections, vintage camera aesthetic',
                'line-art': 'Clean line art style with bold black outlines, minimal shading, graphic illustration aesthetic',
                'storybook': 'Whimsical storybook illustration style with soft colors, gentle textures, children\'s book aesthetic',
                'sunset-glow': 'Warm sunset lighting with golden hour colors, soft warm tones, romantic atmosphere',
                'retro-geometric': 'Retro geometric patterns with bold shapes, vintage color palette, mid-century modern aesthetic',
                'pop-culture': 'Vibrant pop culture style with bold colors, graphic elements, contemporary art aesthetic',
                'classic-oil': 'Classic oil painting style with rich textures, traditional brushwork, fine art aesthetic',
                'fashion-mag': 'High-fashion magazine style with editorial lighting, sophisticated composition, luxury aesthetic',
                'vintage-film': 'Vintage film photography with authentic grain, warm tones, nostalgic atmosphere',
                'crimson-noir': 'Dark noir style with deep red and black tones, dramatic shadows, mysterious atmosphere',
                'schematic': 'Technical schematic style with clean lines, technical drawing aesthetic, blueprint-like quality',
                'mixed-media': 'Mixed media art style combining different textures and techniques, artistic collage aesthetic',
                'hand-drawn': 'Hand-drawn illustration style with sketchy lines, artistic imperfections, personal touch',
                'retro-poster': 'Vintage poster style with bold typography, retro color schemes, classic advertising aesthetic',
                'raw-art': 'Raw artistic style with visible brushstrokes, expressive textures, contemporary art aesthetic',
                'woodcut': 'Woodcut print style with bold contrasts, carved texture aesthetic, traditional printmaking',
                'anime': 'Anime illustration style with vibrant colors, expressive features, Japanese animation aesthetic',
                'deco-glamour': 'Art Deco glamour style with geometric patterns, luxury aesthetic, 1920s elegance',
                'ethereal-aura': 'Ethereal style with soft glows, mystical atmosphere, dreamlike quality',
                'avant-garde': 'Avant-garde artistic style with experimental composition, bold artistic choices, contemporary art',
                'modernist': 'Modernist style with clean lines, geometric forms, minimalist aesthetic',
                'motion-blur': 'Dynamic motion blur style with sense of movement, action photography aesthetic',
                'vivid-art': 'Vivid artistic style with intense colors, bold contrasts, expressive art',
                'cubist': 'Cubist art style with geometric fragmentation, multiple perspectives, abstract composition',
                'mystic-dark': 'Dark mysterious atmosphere with deep shadows, mystical elements, moody gothic aesthetic'
            };

            const styleDescription = STYLE_PROMPTS[style] || '';
            let finalPrompt = prompt;

            if (styleDescription && style !== 'realistic' && style !== 'auto') {
                finalPrompt = `${prompt}\n\nStyle: ${styleDescription}. Apply this artistic style to the image.`;
            }

            if (style === 'realistic') {
                finalPrompt = `${prompt}\n\nPhotorealistic rendering with natural lighting and high detail.`;
            }

            // Add aspect ratio instruction
            finalPrompt += `\n\nOutput aspect ratio: ${aspectRatio}. Fill the entire canvas with image content, no white borders or padding.`;

            try {
                const result = await callVertexAPI('generate-styled-image', {
                    prompt: finalPrompt,
                    imageUrls: allImages,
                    quality: mappedQuality,
                    style,
                    aspectRatio
                });

                return result.image;
            } catch (error: any) {
                // Smart Retry: If high quality times out (504), retry with standard quality
                const isTimeout = error.message?.includes('timed out') || error.message?.includes('504') || error.message?.includes('Timeout');
                const isHighQuality = mappedQuality !== 'standard';

                if (isTimeout && isHighQuality) {
                    console.warn(`⚠️ High quality (${mappedQuality}) timed out. Retrying with Standard quality...`);

                    // Recursive call with standard quality
                    return executeStyledImageGeneration(
                        prompt,
                        imageUrls,
                        'standard',
                        style,
                        aspectRatio
                    );
                }

                throw error;
            }
        };

        try {
            return await executeStyledImageGeneration(prompt, imageUrls, quality, style, aspectRatio);
        } catch (error) {
            console.error("Error generating styled image with Vertex AI:", error);
            throw error;
        }
    },

    generateSimplifiedPhotoshoot: async (
        prompt: string,
        aspectRatio: AspectRatio['value'],
        quality: 'standard' | 'hd' | 'uhd'
    ): Promise<string> => {
        // Use generateStyledImage with no reference images
        const config = await getVertexConfig();
        if (!config) {
            throw new Error('Vertex AI not configured. Please set up project ID and location in Admin Panel → Integrations.');
        }

        try {
            const qualityMap: Record<string, 'standard' | 'hd' | 'uhd'> = {
                'regular': 'standard',
                'standard': 'standard',
                'hd': 'hd',
                'qhd': 'uhd',
                'uhd': 'uhd'
            };

            const mappedQuality = qualityMap[quality] || 'standard';

            const result = await callVertexAPI('generate-styled-image', {
                prompt: `${prompt}\n\nPhotorealistic rendering with natural lighting and high detail. Output aspect ratio: ${aspectRatio}. Fill the entire canvas with image content, no white borders or padding.`,
                imageUrls: [],
                quality: mappedQuality,
                style: 'realistic',
                aspectRatio
            });

            return result.image;
        } catch (error) {
            console.error("Error generating simplified photoshoot with Vertex AI:", error);
            throw error;
        }
    },

    upscaleImage: async (
        imageB64: string,
        prompt: string,
        aspectRatio?: AspectRatio['value']
    ): Promise<string> => {
        // Implementation needed
        return imageB64;
    },
};
