export interface BrandProfile {
  id: string;
  user_id: string;
  name: string; // "Nike", "Adidas", etc.
  client_id?: string; // Agency's client reference (optional)
  
  // Learned from reference images
  color_palette: string[]; // ["#000000", "#FFFFFF", "#FF0000"]
  typography?: {
    primary_font?: string;
    secondary_font?: string;
    font_sizes?: number[];
  };
  
  // Style preferences
  composition_style?: "minimalist" | "busy" | "balanced" | "centered" | "dynamic";
  lighting_style?: "bright" | "dramatic" | "soft" | "natural";
  model_preferences?: {
    age_range?: string;
    ethnicity?: string[];
    pose_style?: string;
  };
  
  // Reference images (URLs to uploaded brand assets)
  reference_images: string[];
  
  // AI-generated style description
  style_description?: string; // "Bold, minimalist, high contrast..."
  
  // Training data
  training_images: string[]; // Images used to train this profile
  feedback_history?: Array<{
    image_id: string;
    liked: boolean;
    adjustments?: string; // "More vibrant colors"
    timestamp: string;
  }>;
  
  // Metadata
  training_completeness: number; // 0-100, percentage
  created_at: string;
  updated_at: string;
}

export interface BrandStudioState {
  profiles: BrandProfile[];
  selectedProfile: BrandProfile | null;
  isLoading: boolean;
  error: string | null;
}

