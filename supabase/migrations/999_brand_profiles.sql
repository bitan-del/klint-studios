-- Brand Profiles Table
-- Stores brand style profiles for Advanced Mode users
-- Allows agencies to train AI on client brand styles

CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_id TEXT, -- Optional: Agency's client reference
  
  -- Learned from reference images
  color_palette JSONB DEFAULT '[]'::jsonb, -- Array of hex colors
  typography JSONB DEFAULT '{}'::jsonb, -- { primary_font, secondary_font, font_sizes }
  
  -- Style preferences
  composition_style TEXT CHECK (composition_style IN ('minimalist', 'busy', 'balanced', 'centered', 'dynamic')),
  lighting_style TEXT CHECK (lighting_style IN ('bright', 'dramatic', 'soft', 'natural')),
  model_preferences JSONB DEFAULT '{}'::jsonb, -- { age_range, ethnicity, pose_style }
  
  -- Reference images (URLs)
  reference_images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
  training_images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs used for training
  
  -- AI-generated style description
  style_description TEXT,
  
  -- Feedback history
  feedback_history JSONB DEFAULT '[]'::jsonb, -- Array of { image_id, liked, adjustments, timestamp }
  
  -- Training completeness (0-100)
  training_completeness INTEGER DEFAULT 0 CHECK (training_completeness >= 0 AND training_completeness <= 100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own brand profiles
CREATE POLICY "Users can view their own brand profiles"
  ON brand_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own brand profiles
CREATE POLICY "Users can create their own brand profiles"
  ON brand_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own brand profiles
CREATE POLICY "Users can update their own brand profiles"
  ON brand_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own brand profiles
CREATE POLICY "Users can delete their own brand profiles"
  ON brand_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_name ON brand_profiles(name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brand_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_profiles_updated_at();

