-- ============================================================================
-- Update Gemini API Key - Emergency Rotation
-- ============================================================================
-- Run this script in Supabase SQL Editor to update the leaked API key
-- New API Key: AIzaSyDy3oIOCeWXGfKQjYJ4ZdHnvw-26KRH0Go
-- ============================================================================

-- 1. Update admin_settings table (Primary location for geminiService)
-- Note: setting_value is JSONB, so we store it as a JSON string
INSERT INTO admin_settings (setting_key, setting_value, updated_at)
VALUES ('gemini_api_key', '"AIzaSyDy3oIOCeWXGfKQjYJ4ZdHnvw-26KRH0Go"'::jsonb, NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = '"AIzaSyDy3oIOCeWXGfKQjYJ4ZdHnvw-26KRH0Go"'::jsonb,
  updated_at = NOW();

-- 2. Update settings table (Used by videoService - if it exists)
-- Note: videoService falls back to admin_settings if settings table doesn't exist
-- This is a legacy table check - most services use admin_settings now
DO $$
BEGIN
  -- Check if settings table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'settings'
  ) THEN
    -- Try to update settings table (structure may vary)
    -- If the table structure is different, this will be skipped
    BEGIN
      INSERT INTO settings (key, value, updated_at)
      VALUES ('gemini_api_key', 'AIzaSyDy3oIOCeWXGfKQjYJ4ZdHnvw-26KRH0Go', NOW())
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = 'AIzaSyDy3oIOCeWXGfKQjYJ4ZdHnvw-26KRH0Go',
        updated_at = NOW();
      
      RAISE NOTICE '✅ Updated settings table';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Could not update settings table (may have different structure): %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'ℹ️ settings table does not exist - videoService will use admin_settings or env var';
  END IF;
END $$;

-- ============================================================================
-- Verify the key was updated
-- ============================================================================
-- Verify admin_settings table (primary location)
SELECT 
  'admin_settings' as table_name,
  setting_key,
  SUBSTRING(setting_value::text, 1, 15) || '...' as masked_value,
  updated_at
FROM admin_settings 
WHERE setting_key = 'gemini_api_key';

-- Note: settings table verification is handled in the DO block above
-- If settings table exists, it was updated there. If not, videoService will use admin_settings.

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Gemini API key updated successfully!';
  RAISE NOTICE '🔄 Clear browser cache and refresh the app to use the new key';
  RAISE NOTICE '📝 Update VITE_GEMINI_API_KEY in .env file for local development';
END $$;

