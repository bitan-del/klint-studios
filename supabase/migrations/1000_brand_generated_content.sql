-- Brand Generated Content Table
-- Stores generated images and their associated text/copy for brand studios

CREATE TABLE IF NOT EXISTS brand_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Generated content
  image_url TEXT NOT NULL, -- Cloudinary URL or base64 data URL
  post_copy TEXT, -- The text/copy for the social media post
  prompt TEXT NOT NULL, -- The original generation prompt
  
  -- Metadata
  aspect_ratio TEXT DEFAULT '1:1', -- Aspect ratio used for generation
  generation_index INTEGER, -- Index in batch (0, 1, 2, etc.)
  batch_id UUID, -- Groups images generated together in one batch
  
  -- Status
  is_saved_to_creations BOOLEAN DEFAULT FALSE, -- Whether saved to My Creations
  saved_at TIMESTAMPTZ, -- When saved to My Creations
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE brand_generated_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own brand generated content"
  ON brand_generated_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brand generated content"
  ON brand_generated_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand generated content"
  ON brand_generated_content FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand generated content"
  ON brand_generated_content FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_generated_content_brand_profile_id 
  ON brand_generated_content(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_brand_generated_content_user_id 
  ON brand_generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_generated_content_batch_id 
  ON brand_generated_content(batch_id);
CREATE INDEX IF NOT EXISTS idx_brand_generated_content_created_at 
  ON brand_generated_content(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brand_generated_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_brand_generated_content_updated_at
  BEFORE UPDATE ON brand_generated_content
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_generated_content_updated_at();


