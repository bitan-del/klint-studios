-- Check if images were uploaded to the database
-- Run this in Supabase SQL Editor to debug

-- Check all user_images
SELECT 
    id,
    user_id,
    workflow_id,
    prompt,
    cloudinary_url,
    created_at,
    deleted_at
FROM public.user_images
ORDER BY created_at DESC
LIMIT 10;

-- Check images for current user (replace with your user ID if needed)
SELECT 
    ui.*,
    up.email,
    up.plan
FROM public.user_images ui
INNER JOIN public.user_profiles up ON ui.user_id = up.id
WHERE ui.deleted_at IS NULL
ORDER BY ui.created_at DESC
LIMIT 10;

-- Check storage count
SELECT 
    email,
    plan,
    images_stored,
    storage_limit
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 10;

