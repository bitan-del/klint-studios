-- FIX TRIGGER INSERT ISSUE
-- Run this in Supabase SQL Editor to fix the profile creation trigger

-- STEP 1: Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- STEP 2: Recreate the function with explicit error handling
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, plan, role)
  VALUES (
    NEW.id, 
    NEW.email,
    CASE 
      WHEN NEW.email = 'bitan@outreachpro.io' THEN 'brand'::user_plan
      ELSE 'free'::user_plan
    END,
    CASE 
      WHEN NEW.email = 'bitan@outreachpro.io' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  );
  
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- If insert fails, log it but don't fail the auth trigger
  RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Verify the trigger exists
SELECT 'Trigger Status:' as step, trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- STEP 5: Check for RLS policies blocking inserts
SELECT 'RLS Policies on user_profiles:' as step, policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles' 
ORDER BY policyname;

-- STEP 6: Check if the INSERT policy exists for the trigger
SELECT 'Looking for INSERT policy:' as step;
SELECT * FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND cmd = 'INSERT';

-- If no INSERT policy shown above, run this:
-- DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON public.user_profiles;
-- CREATE POLICY "Allow trigger to insert profiles"
--   ON public.user_profiles 
--   FOR INSERT 
--   WITH CHECK (true);

SELECT '✅ Trigger fix applied!' as status;
