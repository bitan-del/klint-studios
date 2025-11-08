-- Verify Cloudinary Settings in Database
-- Run this in Supabase SQL Editor to check if settings exist

-- Check if settings exist (secrets are masked for security)
SELECT 
    setting_key,
    CASE 
        WHEN setting_key = 'cloudinary_api_secret' THEN '***HIDDEN***'
        WHEN setting_key = 'cloudinary_api_key' THEN SUBSTRING(setting_value::text, 1, 10) || '...'
        ELSE setting_value::text
    END as display_value,
    updated_at
FROM public.admin_settings 
WHERE setting_key LIKE 'cloudinary%'
ORDER BY setting_key;

-- If settings don't exist, use setup-cloudinary.sql.example as a template
-- IMPORTANT: Never commit SQL scripts with actual credentials!

