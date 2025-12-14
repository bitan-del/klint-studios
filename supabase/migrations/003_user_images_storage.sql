-- Migration: User Images Storage System
-- Adds storage tracking and user_images table for Cloudinary integration

-- Add storage tracking columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS images_stored INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_limit INTEGER DEFAULT 10; -- Free plan: 10 images

-- Create user_images table
CREATE TABLE IF NOT EXISTS public.user_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id TEXT, -- For deletion
  original_size INTEGER, -- Original size in bytes
  compressed_size INTEGER, -- Compressed size in bytes
  workflow_id TEXT, -- Which workflow created this (ai-photoshoot, product-photography, etc.)
  prompt TEXT, -- Prompt used to generate
  metadata JSONB, -- Store workflow settings, tags, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For auto-cleanup based on plan
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_images_user_id ON public.user_images(user_id);
CREATE INDEX IF NOT EXISTS idx_user_images_expires_at ON public.user_images(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_images_user_created ON public.user_images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_images_workflow ON public.user_images(workflow_id);
CREATE INDEX IF NOT EXISTS idx_user_images_deleted ON public.user_images(deleted_at) WHERE deleted_at IS NULL;

-- Function to calculate expiration date based on plan
CREATE OR REPLACE FUNCTION calculate_expiration_date(p_user_plan user_plan)
RETURNS INTERVAL AS $$
BEGIN
  RETURN CASE p_user_plan
    WHEN 'free' THEN INTERVAL '7 days'
    WHEN 'solo' THEN INTERVAL '30 days'
    WHEN 'studio' THEN INTERVAL '90 days'
    WHEN 'brand' THEN INTERVAL '180 days'
    ELSE INTERVAL '7 days'
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to get storage limits based on plan
CREATE OR REPLACE FUNCTION get_storage_limit(p_user_plan user_plan)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE p_user_plan
    WHEN 'free' THEN 10
    WHEN 'solo' THEN 100
    WHEN 'studio' THEN 500
    WHEN 'brand' THEN 2000
    ELSE 10
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to update user storage count
CREATE OR REPLACE FUNCTION update_user_storage_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.user_profiles
  SET images_stored = (
    SELECT COUNT(*) 
    FROM public.user_images 
    WHERE user_id = p_user_id AND deleted_at IS NULL
  )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old images
CREATE OR REPLACE FUNCTION cleanup_old_images()
RETURNS TABLE(deleted_count INTEGER, freed_space BIGINT) AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_freed_space BIGINT := 0;
BEGIN
  -- Delete expired images (soft delete)
  UPDATE public.user_images
  SET deleted_at = NOW()
  WHERE deleted_at IS NULL 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- For free users, keep only last 10 images
  WITH free_user_images AS (
    SELECT ui.id, ui.user_id, ui.created_at,
           ROW_NUMBER() OVER (PARTITION BY ui.user_id ORDER BY ui.created_at DESC) as rn
    FROM public.user_images ui
    INNER JOIN public.user_profiles up ON ui.user_id = up.id
    WHERE up.plan = 'free' 
      AND ui.deleted_at IS NULL
  )
  UPDATE public.user_images
  SET deleted_at = NOW()
  WHERE id IN (
    SELECT id FROM free_user_images WHERE rn > 10
  );
  
  -- For BASIC users, keep only last 100 images
  WITH basic_user_images AS (
    SELECT ui.id, ui.user_id, ui.created_at,
           ROW_NUMBER() OVER (PARTITION BY ui.user_id ORDER BY ui.created_at DESC) as rn
    FROM public.user_images ui
    INNER JOIN public.user_profiles up ON ui.user_id = up.id
    WHERE up.plan = 'solo' 
      AND ui.deleted_at IS NULL
  )
  UPDATE public.user_images
  SET deleted_at = NOW()
  WHERE id IN (
    SELECT id FROM basic_user_images WHERE rn > 100
  );
  
  -- For PRO users, keep only last 500 images
  WITH pro_user_images AS (
    SELECT ui.id, ui.user_id, ui.created_at,
           ROW_NUMBER() OVER (PARTITION BY ui.user_id ORDER BY ui.created_at DESC) as rn
    FROM public.user_images ui
    INNER JOIN public.user_profiles up ON ui.user_id = up.id
    WHERE up.plan = 'studio' 
      AND ui.deleted_at IS NULL
  )
  UPDATE public.user_images
  SET deleted_at = NOW()
  WHERE id IN (
    SELECT id FROM pro_user_images WHERE rn > 500
  );
  
  -- For ADVANCE users, keep only last 2000 images
  WITH advance_user_images AS (
    SELECT ui.id, ui.user_id, ui.created_at,
           ROW_NUMBER() OVER (PARTITION BY ui.user_id ORDER BY ui.created_at DESC) as rn
    FROM public.user_images ui
    INNER JOIN public.user_profiles up ON ui.user_id = up.id
    WHERE up.plan = 'brand' 
      AND ui.deleted_at IS NULL
  )
  UPDATE public.user_images
  SET deleted_at = NOW()
  WHERE id IN (
    SELECT id FROM advance_user_images WHERE rn > 2000
  );
  
  -- Calculate freed space
  SELECT COALESCE(SUM(compressed_size), 0) INTO v_freed_space
  FROM public.user_images
  WHERE deleted_at IS NOT NULL
    AND deleted_at > NOW() - INTERVAL '1 minute';
  
  -- Update storage counts for all affected users
  UPDATE public.user_profiles
  SET images_stored = (
    SELECT COUNT(*) 
    FROM public.user_images 
    WHERE user_id = user_profiles.id AND deleted_at IS NULL
  );
  
  -- Update storage limits based on plan
  UPDATE public.user_profiles
  SET storage_limit = get_storage_limit(plan);
  
  RETURN QUERY SELECT v_deleted_count, v_freed_space;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update storage count when image is inserted
CREATE OR REPLACE FUNCTION trigger_update_storage_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_storage_count(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_image_insert
  AFTER INSERT ON public.user_images
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_storage_on_insert();

-- Trigger to update storage count when image is deleted
CREATE OR REPLACE FUNCTION trigger_update_storage_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_storage_count(OLD.user_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_image_delete
  AFTER UPDATE OF deleted_at ON public.user_images
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION trigger_update_storage_on_delete();

-- RLS Policies for user_images
ALTER TABLE public.user_images ENABLE ROW LEVEL SECURITY;

-- Users can only see their own images
CREATE POLICY "Users can view their own images"
  ON public.user_images FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can insert their own images
CREATE POLICY "Users can insert their own images"
  ON public.user_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own images (for soft delete)
CREATE POLICY "Users can update their own images"
  ON public.user_images FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete their own images"
  ON public.user_images FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can see all images
CREATE POLICY "Admins can view all images"
  ON public.user_images FOR SELECT
  USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_images TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_images() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_storage_count(UUID) TO authenticated;

