-- Update Canva Client Secret
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qayasxoiikjmkuuaphwd/sql
-- Note: setting_value is a JSON type, so we need to store it as a JSON string
-- Replace YOUR_SECRET_HERE with your actual Canva client secret

UPDATE admin_settings
SET 
  setting_value = '"YOUR_SECRET_HERE"'::json,
  updated_at = NOW()
WHERE setting_key = 'canva_client_secret';

-- Verify the update
SELECT 
  setting_key,
  setting_value,
  updated_at
FROM admin_settings
WHERE setting_key = 'canva_client_secret';

