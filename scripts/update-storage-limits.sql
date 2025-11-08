-- Update Storage Limits for All Users Based on Their Plan
-- Run this in Supabase SQL Editor to fix storage limits

-- First, make sure the get_storage_limit function exists
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

-- Update all users' storage limits based on their plan
UPDATE public.user_profiles
SET storage_limit = get_storage_limit(plan)
WHERE storage_limit IS NULL OR storage_limit = 10;

-- Verify the updates
SELECT 
    plan,
    COUNT(*) AS user_count,
    AVG(storage_limit) AS avg_storage_limit,
    MIN(storage_limit) AS min_storage_limit,
    MAX(storage_limit) AS max_storage_limit
FROM public.user_profiles
GROUP BY plan
ORDER BY plan;

-- Show specific user details (replace with your user email if needed)
SELECT 
    email,
    plan,
    storage_limit,
    images_stored,
    CASE 
        WHEN plan = 'free' THEN 10
        WHEN plan = 'solo' THEN 100
        WHEN plan = 'studio' THEN 500
        WHEN plan = 'brand' THEN 2000
        ELSE 10
    END AS expected_limit
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 10;

