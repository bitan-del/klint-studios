-- Verify Cloudinary Settings in Database
-- Run this in Supabase SQL Editor to check if settings exist

-- Check if settings exist
SELECT 
    setting_key,
    setting_value,
    updated_at
FROM public.admin_settings 
WHERE setting_key LIKE 'cloudinary%'
ORDER BY setting_key;

-- If settings don't exist, run this to create them:
-- INSERT INTO public.admin_settings (setting_key, setting_value, updated_at)
-- VALUES 
--   ('cloudinary_cloud_name', '"defaekh7f"'::jsonb, NOW()),
--   ('cloudinary_upload_preset', '"klint-studios-upload"'::jsonb, NOW()),
--   ('cloudinary_api_key', '"558855971477248"'::jsonb, NOW()),
--   ('cloudinary_api_secret', '"s0HTg1QKFaK5Ra0QI2H0FpIIiVU"'::jsonb, NOW())
-- ON CONFLICT (setting_key) 
-- DO UPDATE SET 
--   setting_value = EXCLUDED.setting_value,
--   updated_at = NOW();

