import type { UserPlan } from './auth';

// Existing video state types
export interface VideoCreativeControls {
  resolution: '720p' | '1080p';
}

export interface VideoState {
  videoPrompt: string;
  videoSourceImage: string | null;
  videoControls: VideoCreativeControls;
  isSuggestingPrompts: boolean;
  promptSuggestions: string[];
}

// New image-to-video generation types
export type VideoDuration = '4s' | '6s' | '8s';
export type VideoQuality = '720p' | '1080p';
export type VideoRatio = '16:9' | '9:16' | '1:1';

export interface VideoGenerationConfig {
  sourceImage: string; // base64 or URL
  duration: VideoDuration;
  quality: VideoQuality;
  ratio: VideoRatio;
  prompt?: string;
  enhancePrompt: boolean;
  startFrame?: string; // optional start frame image
  endFrame?: string; // optional end frame image
  multiShotMode: boolean;
}

export interface VideoLimits {
  monthly: number;
  daily: number;
}

export const VIDEO_PLAN_LIMITS: Record<UserPlan, VideoLimits> = {
  free: { monthly: 0, daily: 0 },
  solo: { monthly: 15, daily: 1 },
  studio: { monthly: 60, daily: 3 },
  brand: { monthly: 150, daily: 5 }
};

export const VIDEO_DURATION_OPTIONS = [
  { value: '4s' as VideoDuration, label: '4 seconds', seconds: 4 },
  { value: '6s' as VideoDuration, label: '6 seconds', seconds: 6 },
  { value: '8s' as VideoDuration, label: '8 seconds', seconds: 8 }
];

export const VIDEO_QUALITY_OPTIONS = [
  { value: '720p' as VideoQuality, label: '720p', description: 'HD quality' },
  { value: '1080p' as VideoQuality, label: '1080p', description: 'Full HD quality' }
];

export const VIDEO_RATIO_OPTIONS = [
  { value: '16:9' as VideoRatio, label: '16:9', description: 'Landscape' },
  { value: '9:16' as VideoRatio, label: '9:16', description: 'Portrait' },
  { value: '1:1' as VideoRatio, label: '1:1', description: 'Square' }
];

export interface VideoUsage {
  monthly: number;
  daily: number;
  lastGenerationDate: string;
}
