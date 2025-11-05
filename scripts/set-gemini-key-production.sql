-- Set Gemini API Key for Production
-- Run this in Supabase SQL Editor
-- This will update the API key for ALL users across the platform

INSERT INTO admin_settings (setting_key, setting_value, updated_at)
VALUES ('gemini_api_key', 'AIzaSyBo6seA9boXRjX2HdLmXf48FfxSPtpLsew', NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Verify the key was set
SELECT setting_key, setting_value, updated_at 
FROM admin_settings 
WHERE setting_key = 'gemini_api_key';

