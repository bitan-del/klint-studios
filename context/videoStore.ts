
import type { VideoState, VideoCreativeControls } from '../types';
import type { StudioStoreSlice } from './StudioContext';
import { geminiService } from '../services/geminiService';
import { withRetry } from '../utils/colorUtils';

export interface VideoActions {
  setVideoPrompt: (prompt: string) => void;
  setVideoSourceImage: (base64: string | null) => void;
  updateVideoControl: <K extends keyof VideoCreativeControls>(key: K, value: VideoCreativeControls[K]) => void;
  suggestVideoPrompts: () => Promise<void>;
}

export type VideoSlice = VideoState & VideoActions;

const initialVideoState: VideoState = {
  videoPrompt: '',
  videoSourceImage: null,
  videoControls: {
    resolution: '720p',
  },
  isSuggestingPrompts: false,
  promptSuggestions: [],
};

export const createVideoSlice: StudioStoreSlice<VideoSlice> = (set, get) => ({
  ...initialVideoState,

  setVideoPrompt: (prompt) => set({ videoPrompt: prompt }),

  setVideoSourceImage: (base64) => {
    set({ 
      videoSourceImage: base64, 
      generatedImages: null, 
      activeImageIndex: null, 
      error: null,
      promptSuggestions: [],
      isSuggestingPrompts: false
    });
     if (base64) {
      // Clear other mode inputs when a source photo is uploaded
      set({
        uploadedModelImage: null,
        selectedModels: [],
        apparel: [],
        productImage: null,
        mockupImage: null,
        designImage: null,
        reimagineSourcePhoto: null,
      });
    }
  },

  updateVideoControl: (key, value) => {
    set(state => ({
      videoControls: { ...state.videoControls, [key]: value }
    }));
  },

  suggestVideoPrompts: async () => {
    const { videoSourceImage } = get();
    if (!videoSourceImage) return;

    set({ isSuggestingPrompts: true, promptSuggestions: [], error: null });
    try {
      const suggestions = await withRetry(() => geminiService.suggestVideoPrompts(videoSourceImage));
      set({ promptSuggestions: suggestions });
    } catch (e: any) {
      console.error("Failed to suggest video prompts:", e);
      set({ error: "Could not generate prompt suggestions. Please try again." });
    } finally {
      set({ isSuggestingPrompts: false });
    }
  },
});
