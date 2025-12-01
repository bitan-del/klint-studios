import { storageService } from './storageService';
import { VIDEO_PLAN_LIMITS, VideoGenerationConfig } from '../types/video';
import type { UserPlan } from '../types';
import { cloudinaryService } from './cloudinaryService';
import { GoogleGenAI } from '@google/genai';

class VideoService {
    /**
     * Check if user can generate video based on plan limits
     */
    async canGenerateVideo(userId: string, plan: UserPlan): Promise<{ allowed: boolean; reason?: string }> {
        const limits = VIDEO_PLAN_LIMITS[plan];
        const usage = await storageService.getVideoUsage(userId);

        if (usage.monthly >= limits.monthly) {
            return {
                allowed: false,
                reason: `Monthly limit reached (${usage.monthly}/${limits.monthly}). Upgrade your plan for more.`
            };
        }

        if (usage.daily >= limits.daily) {
            return {
                allowed: false,
                reason: `Daily limit reached (${usage.daily}/${limits.daily}). Come back tomorrow!`
            };
        }

        return { allowed: true };
    }

    /**
     * Generate video from image using Google Veo 3.1 API
     */
    async generateVideo(userId: string, config: VideoGenerationConfig, plan: UserPlan): Promise<string> {
        // 1. Check limits
        const check = await this.canGenerateVideo(userId, plan);
        if (!check.allowed) {
            throw new Error(check.reason);
        }

        console.log('🎬 [VIDEO] Starting video generation...', { userId, config });

        try {
            // 2. Try to use real Veo 3 API
            const videoUrl = await this.generateWithVeo3(userId, config);

            // 3. Increment Usage
            await storageService.incrementVideoUsage(userId);

            return videoUrl;

        } catch (error) {
            console.error('❌ [VIDEO] Generation failed:', error);

            // Provide helpful error messages
            if (error instanceof Error) {
                // Preserve safety filter errors with their detailed messages
                if (error.message.includes('safety') || error.message.includes('filter') || error.message.includes('blocked')) {
                    throw error; // Already has good message
                }
                if (error.message.includes('API key') || error.message.includes('not configured')) {
                    throw new Error('Gemini API key not configured. Please add it in Admin Panel → Integrations.');
                } else if (error.message.includes('quota') || error.message.includes('limit')) {
                    throw new Error('API quota exceeded. Please check your Google Cloud billing.');
                } else if (error.message.includes('not enabled') || error.message.includes('permission')) {
                    throw new Error('Veo 3 API not enabled. Please enable it in Google Cloud Console or request access.');
                } else if (error.message.includes('timeout')) {
                    throw new Error('Video generation timed out. The video may still be processing. Please try again in a few minutes.');
                }
            }

            // If real API fails, throw the error with context
            throw new Error(
                `Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
                `Please try with a simpler prompt or different image.`
            );
        }
    }

    /**
     * Generate video using Veo 3 API
     */
    private async generateWithVeo3(userId: string, config: VideoGenerationConfig): Promise<string> {
        // Import geminiService dynamically to avoid circular dependencies if any
        const { geminiService } = await import('./geminiService');

        // Create a safe, neutral prompt that's less likely to trigger safety filters
        const basePrompt = config.prompt || 'Animate this image with smooth, natural motion';
        
        // Enhance prompt with safety-friendly language
        const enhancedPrompt = config.enhancePrompt
            ? `${basePrompt}. Create a high-quality, cinematic video with professional camera movement, natural transitions, and subtle environmental effects. Focus on gentle motion, lighting changes, and atmospheric details.`
            : basePrompt;

        console.log('🎬 [VIDEO] Calling Veo 3 API via GeminiService...', {
            model: 'veo-3.1-fast-generate-preview',
            quality: config.quality,
            ratio: config.ratio
        });

        try {
            // 1. Start the operation
            console.log('🚀 [VIDEO] Starting Veo 3 generation...');
            const operation = await geminiService.generatePhotoshootVideo(
                enhancedPrompt,
                config.ratio as any,
                config.quality as any,
                config.sourceImage
            );
            console.log('✅ [VIDEO] Operation started:', operation.name);

            // 2. Poll for completion
            let videoUri = null;
            let attempts = 0;
            const maxAttempts = 60; // 2 minutes timeout

            while (!videoUri && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;

                const status = await geminiService.getVideoOperationStatus(operation);
                console.log(`⏳ [VIDEO] Polling status (${attempts}/${maxAttempts}):`, status.metadata?.state || 'Unknown');

                if (status.done) {
                    if (status.error) {
                        throw new Error(`Video generation failed: ${status.error.message}`);
                    }

                    if (status.response) {
                        // Check for safety filters with detailed error info
                        // @ts-ignore
                        const result = status.response.result || status.response;
                        // @ts-ignore
                        const filteredCount = result.raiMediaFilteredCount || 0;
                        // @ts-ignore
                        const filteredReasons = result.raiMediaFilteredReasons || [];
                        
                        if (filteredCount > 0 || filteredReasons.length > 0) {
                            const reasonText = filteredReasons.length > 0 
                                ? filteredReasons.join(', ')
                                : 'Content policy violation';
                            
                            console.error('🚫 [VIDEO] Safety filter triggered:', {
                                count: filteredCount,
                                reasons: filteredReasons
                            });
                            
                            throw new Error(
                                `Video generation blocked by safety filters: ${reasonText}. ` +
                                `Try a simpler prompt focusing on natural movement, lighting, or environmental effects. ` +
                                `Avoid any potentially sensitive content in the image or prompt.`
                            );
                        }

                        // Extract URI
                        // @ts-ignore
                        if (result.video?.uri) videoUri = result.video.uri;
                        // @ts-ignore
                        else if (result.generatedVideos?.[0]?.video?.uri) videoUri = result.generatedVideos[0].video.uri;
                        // @ts-ignore
                        else if (result.generatedVideos?.[0]?.uri) videoUri = result.generatedVideos[0].uri;
                        // @ts-ignore
                        else if (result.candidates?.[0]?.content?.parts?.[0]?.videoMetadata?.videoUri) {
                            // @ts-ignore
                            videoUri = result.candidates[0].content.parts[0].videoMetadata.videoUri;
                        }
                        // @ts-ignore
                        else if (result.candidates?.[0]?.content?.parts?.[0]?.fileUri) {
                            // @ts-ignore
                            videoUri = result.candidates[0].content.parts[0].fileUri;
                        }
                    }

                    if (!videoUri) {
                        // Fallback check
                        // @ts-ignore
                        if (status.result?.video?.uri) videoUri = status.result.video.uri;
                        // @ts-ignore
                        if (status.result?.candidates?.[0]?.content?.parts?.[0]?.videoMetadata?.videoUri) {
                            // @ts-ignore
                            videoUri = status.result.candidates[0].content.parts[0].videoMetadata.videoUri;
                        }
                    }

                    if (!videoUri) {
                        console.error('❌ [VIDEO] Done but no URI found.');
                        break;
                    }
                }
            }

            if (!videoUri) {
                throw new Error('Video generation timed out.');
            }

            console.log('✅ [VIDEO] Video generated at URI:', videoUri);

            // 3. Construct Final URL with Key (No Cloudinary, No Blob Fetch)
            const apiKey = localStorage.getItem('geminiApiKey') || import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("API Key missing");

            const cleanKey = apiKey.trim().replace(/['"]/g, '');
            // Ensure we don't double-append
            if (!videoUri.includes('key=')) {
                const separator = videoUri.includes('?') ? '&' : '?';
                return `${videoUri}${separator}key=${cleanKey}`;
            }

            return videoUri;

        } catch (apiError: any) {
            console.warn('⚠️ [VIDEO] Veo 3 API call failed:', apiError);
            
            // Preserve original error message if it's informative
            if (apiError instanceof Error && apiError.message) {
                // If it's already a user-friendly error, throw it as-is
                if (apiError.message.includes('safety') || 
                    apiError.message.includes('filter') ||
                    apiError.message.includes('blocked') ||
                    apiError.message.includes('quota') ||
                    apiError.message.includes('not enabled')) {
                    throw apiError;
                }
            }
            
            // Generic fallback error
            throw new Error(
                `Video generation failed: ${apiError?.message || 'Unknown error'}. ` +
                `Please try again with a different prompt or image.`
            );
        }
    }

    /**
     * Fallback mock video generation for development
     */
    private async generateMockVideo(userId: string): Promise<string> {
        console.log('🎬 [VIDEO] Using mock video generation...');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Increment usage even for mock
        await storageService.incrementVideoUsage(userId);

        // Return sample video URL
        const mockVideoUrl = "https://res.cloudinary.com/demo/video/upload/v1687516278/samples/sea-turtle.mp4";
        console.log('✅ [VIDEO] Mock video generated:', mockVideoUrl);

        return mockVideoUrl;
    }

    /**
     * Get Gemini API key from database
     */
    private async getGeminiApiKey(): Promise<string | null> {
        try {
            const { supabase } = await import('./supabaseClient');
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'gemini_api_key')
                .single();

            if (data && (data as any).value) {
                return (data as any).value;
            }

            // Fallback to environment variable
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (envKey) {
                console.log('✅ [VIDEO] Using API key from environment');
                return envKey;
            }

            return null;
        } catch (error) {
            console.error('Error fetching API key:', error);
            // Fallback to environment variable on error
            return import.meta.env.VITE_GEMINI_API_KEY || null;
        }
    }

    /**
     * Convert base64 string to Blob
     */
    private base64ToBlob(base64: string, mimeType: string): Blob {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }
}

export const videoService = new VideoService();
