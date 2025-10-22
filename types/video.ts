
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
