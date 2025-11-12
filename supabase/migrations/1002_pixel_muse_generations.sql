-- PixelMuse Generations Table
-- Stores generated images and their associated text/copy for PixelMuse profiles

CREATE TABLE IF NOT EXISTS pixel_muse_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES pixel_muse_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Generated content
  image_url TEXT NOT NULL, -- Cloudinary URL or base64 data URL
  post_copy TEXT, -- The text/copy for the social media post
  prompt TEXT NOT NULL, -- The original generation prompt
  
  -- Metadata
  aspect_ratio TEXT DEFAULT '1:1', -- Aspect ratio used for generation
  generation_index INTEGER, -- Index in batch (0, 1, 2, etc.)
  batch_id UUID, -- Groups images generated together in one batch
  model_name TEXT, -- Model used for generation (e.g., "NANO BANANA")
  
  -- Status
  is_saved_to_creations BOOLEAN DEFAULT FALSE, -- Whether saved to My Creations
  saved_at TIMESTAMPTZ, -- When saved to My Creations
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pixel_muse_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pixel_muse_generations"
  ON pixel_muse_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pixel_muse_generations"
  ON pixel_muse_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pixel_muse_generations"
  ON pixel_muse_generations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pixel_muse_generations"
  ON pixel_muse_generations FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pixel_muse_generations_profile_id 
  ON pixel_muse_generations(profile_id);
CREATE INDEX IF NOT EXISTS idx_pixel_muse_generations_user_id 
  ON pixel_muse_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_pixel_muse_generations_batch_id 
  ON pixel_muse_generations(batch_id);
CREATE INDEX IF NOT EXISTS idx_pixel_muse_generations_created_at 
  ON pixel_muse_generations(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pixel_muse_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_pixel_muse_generations_updated_at
  BEFORE UPDATE ON pixel_muse_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_pixel_muse_generations_updated_at();

