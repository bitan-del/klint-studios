-- Set the Gemini API key in admin_settings table
-- This allows the super admin to manage the API key from the Admin Panel
-- Run this ONCE to initialize the key (or update it directly from the Admin Panel UI)

INSERT INTO admin_settings (setting_key, setting_value)
VALUES ('gemini_api_key', 'YOUR_GEMINI_API_KEY_HERE')
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Verify the key was set
SELECT setting_key, setting_value, updated_at 
FROM admin_settings 
WHERE setting_key = 'gemini_api_key';




