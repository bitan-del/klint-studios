-- Fix Storage Limits for All Users
-- This script updates storage limits based on user plans
-- Run this in Supabase SQL Editor

-- Step 1: Ensure the function exists
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

-- Step 2: Update ALL users' storage limits based on their current plan
UPDATE public.user_profiles
SET storage_limit = get_storage_limit(plan);

-- Step 3: Verify the update
SELECT 
    'Storage Limits Updated' AS status,
    plan,
    COUNT(*) AS user_count,
    storage_limit,
    AVG(images_stored) AS avg_images_stored
FROM public.user_profiles
GROUP BY plan, storage_limit
ORDER BY 
    CASE plan
        WHEN 'free' THEN 1
        WHEN 'solo' THEN 2
        WHEN 'studio' THEN 3
        WHEN 'brand' THEN 4
        ELSE 5
    END;

-- Step 4: Show your specific user (replace email if needed)
SELECT 
    email,
    plan,
    storage_limit AS current_limit,
    images_stored,
    get_storage_limit(plan) AS expected_limit,
    CASE 
        WHEN storage_limit = get_storage_limit(plan) THEN '✅ Correct'
        ELSE '❌ Needs Update'
    END AS status
FROM public.user_profiles
ORDER BY created_at DESC;

-- Step 5: Create a trigger to auto-update storage_limit when plan changes
CREATE OR REPLACE FUNCTION update_storage_limit_on_plan_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update storage_limit when plan changes
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN
    NEW.storage_limit := get_storage_limit(NEW.plan);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_storage_limit ON public.user_profiles;
CREATE TRIGGER trigger_update_storage_limit
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_limit_on_plan_change();

-- Also update on insert (for new users)
CREATE OR REPLACE FUNCTION set_storage_limit_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Set storage_limit based on plan for new users
  NEW.storage_limit := get_storage_limit(NEW.plan);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_storage_limit ON public.user_profiles;
CREATE TRIGGER trigger_set_storage_limit
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_storage_limit_on_insert();

SELECT '✅ Storage limits updated and triggers created!' AS result;

