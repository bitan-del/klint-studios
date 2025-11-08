-- Fix Storage Limits for ADVANCE (brand) Plan Users
-- Run this in Supabase SQL Editor to fix existing users

-- Step 1: Ensure the function exists (should already exist from migration 003)
CREATE OR REPLACE FUNCTION get_storage_limit(p_user_plan user_plan)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE p_user_plan
    WHEN 'free' THEN 10
    WHEN 'solo' THEN 100
    WHEN 'studio' THEN 500
    WHEN 'brand' THEN 2000  -- ADVANCE plan gets 2000 images
    ELSE 10
  END;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Fix ALL users' storage limits based on their current plan
UPDATE public.user_profiles
SET storage_limit = get_storage_limit(plan)
WHERE storage_limit != get_storage_limit(plan) OR storage_limit IS NULL;

-- Step 3: Create trigger to auto-update storage_limit when plan changes (if not exists)
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

-- Step 4: Verify the fix
SELECT 
    email,
    plan,
    storage_limit AS current_limit,
    get_storage_limit(plan) AS expected_limit,
    images_stored,
    CASE 
        WHEN storage_limit = get_storage_limit(plan) THEN '✅ Correct'
        ELSE '❌ Still Wrong'
    END AS status
FROM public.user_profiles
WHERE plan = 'brand'  -- Check ADVANCE plan users
ORDER BY created_at DESC;

-- Step 5: Show summary
SELECT 
    plan,
    COUNT(*) AS user_count,
    storage_limit,
    get_storage_limit(plan) AS expected_limit,
    CASE 
        WHEN storage_limit = get_storage_limit(plan) THEN '✅ Correct'
        ELSE '❌ Needs Fix'
    END AS status
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

SELECT '✅ Storage limits fixed and trigger created!' AS result;

