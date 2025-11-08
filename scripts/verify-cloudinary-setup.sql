-- Quick Verification Script for Cloudinary Setup
-- Run this in Supabase SQL Editor to verify everything is configured correctly

-- 1. Check if user_images table exists
SELECT 
    '✅ user_images table exists' AS status,
    COUNT(*) AS table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_images';

-- 2. Check Cloudinary settings in database
SELECT 
    'Cloudinary Settings' AS section,
    setting_key,
    CASE 
        WHEN setting_key = 'cloudinary_api_secret' THEN '***HIDDEN***'
        WHEN setting_key = 'cloudinary_api_key' THEN SUBSTRING(setting_value::text, 1, 10) || '...'
        ELSE setting_value::text
    END AS setting_value,
    updated_at
FROM public.admin_settings 
WHERE setting_key LIKE 'cloudinary%'
ORDER BY setting_key;

-- 3. Check if any images have been uploaded
SELECT 
    'Uploaded Images' AS section,
    COUNT(*) AS total_images,
    COUNT(DISTINCT user_id) AS unique_users,
    SUM(compressed_size) / 1024 / 1024 AS total_size_mb
FROM public.user_images
WHERE deleted_at IS NULL;

-- 4. Check user storage limits
SELECT 
    'User Storage' AS section,
    up.plan,
    COUNT(DISTINCT up.id) AS user_count,
    AVG(up.images_stored) AS avg_images_stored,
    AVG(up.storage_limit) AS avg_storage_limit
FROM public.user_profiles up
LEFT JOIN public.user_images ui ON up.id = ui.user_id AND ui.deleted_at IS NULL
GROUP BY up.plan;

-- 5. Check recent uploads (last 10)
SELECT 
    'Recent Uploads' AS section,
    ui.id,
    ui.workflow_id,
    ui.created_at,
    ROUND(ui.compressed_size / 1024.0, 2) AS size_kb,
    ui.cloudinary_url IS NOT NULL AS has_cloudinary_url
FROM public.user_images ui
WHERE ui.deleted_at IS NULL
ORDER BY ui.created_at DESC
LIMIT 10;

