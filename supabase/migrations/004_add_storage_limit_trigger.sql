-- Migration: Add trigger to auto-update storage_limit when plan changes
-- This ensures storage_limit is always in sync with the user's plan

-- Function to update storage_limit when plan changes
CREATE OR REPLACE FUNCTION update_storage_limit_on_plan_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update storage_limit when plan changes
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN
    NEW.storage_limit := get_storage_limit(NEW.plan);
    RAISE NOTICE 'Updated storage_limit to % for plan %', NEW.storage_limit, NEW.plan;
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

-- Fix any existing users with incorrect storage limits
UPDATE public.user_profiles
SET storage_limit = get_storage_limit(plan)
WHERE storage_limit != get_storage_limit(plan) OR storage_limit IS NULL;

-- Verify the update
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

