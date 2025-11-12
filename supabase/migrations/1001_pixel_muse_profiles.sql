-- PixelMuse Profiles Table
-- Stores style profiles for creative projects

CREATE TABLE IF NOT EXISTS pixel_muse_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_id TEXT, -- Optional client reference
  
  -- Style attributes (learned from reference images)
  color_palette TEXT[] DEFAULT '{}', -- Array of hex colors
  typography JSONB, -- { primary_font, secondary_font, font_sizes }
  composition_style TEXT, -- "minimalist" | "busy" | "balanced" | "centered" | "dynamic"
  lighting_style TEXT, -- "bright" | "dramatic" | "soft" | "natural"
  model_preferences JSONB, -- { age_range, ethnicity, pose_style }
  
  -- Reference and training data
  reference_images TEXT[] DEFAULT '{}', -- URLs to uploaded brand assets
  training_images TEXT[] DEFAULT '{}', -- Images used to train this profile
  style_description TEXT, -- AI-generated style description
  
  -- Feedback and training progress
  feedback_history JSONB DEFAULT '[]'::jsonb, -- Array of { image_id, liked, adjustments, timestamp }
  training_completeness INTEGER DEFAULT 0 CHECK (training_completeness >= 0 AND training_completeness <= 100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pixel_muse_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pixel_muse_profiles"
  ON pixel_muse_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pixel_muse_profiles"
  ON pixel_muse_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pixel_muse_profiles"
  ON pixel_muse_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pixel_muse_profiles"
  ON pixel_muse_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pixel_muse_profiles_user_id 
  ON pixel_muse_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_pixel_muse_profiles_created_at 
  ON pixel_muse_profiles(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pixel_muse_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_pixel_muse_profiles_updated_at
  BEFORE UPDATE ON pixel_muse_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_pixel_muse_profiles_updated_at();

