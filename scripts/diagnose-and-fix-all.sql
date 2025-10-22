-- 🔧 COMPREHENSIVE DIAGNOSIS & FIX SCRIPT
-- Run this in Supabase SQL Editor to diagnose and fix all issues

-- ========================================
-- PART 1: DIAGNOSE CURRENT STATE
-- ========================================

-- Check 1: How many users are in auth.users vs user_profiles?
SELECT 
    'auth.users' as table_name,
    COUNT(*) as total_users
FROM auth.users
UNION ALL
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as total_users
FROM public.user_profiles;

-- Check 2: Find users in auth.users but NOT in user_profiles (orphaned users)
SELECT 
    au.id,
    au.email,
    au.created_at as signed_up_at,
    'MISSING FROM user_profiles!' as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- Check 3: Verify the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check 4: Verify the function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- ========================================
-- PART 2: FIX ORPHANED USERS
-- ========================================

-- This will create user_profiles for any users that are missing them
INSERT INTO public.user_profiles (id, email, plan, role)
SELECT 
    au.id,
    au.email,
    CASE 
        WHEN au.email = 'bitan@outreachpro.io' THEN 'brand'::user_plan
        ELSE 'free'::user_plan
    END as plan,
    CASE 
        WHEN au.email = 'bitan@outreachpro.io' THEN 'admin'::user_role
        ELSE 'user'::user_role
    END as role
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- ========================================
-- PART 3: RECREATE TRIGGER (IF BROKEN)
-- ========================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Log for debugging
    RAISE LOG 'Creating user profile for: %', NEW.email;
    
    -- Insert the user profile
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
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate errors
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't prevent user creation
        RAISE LOG 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- PART 4: FIX RLS FOR UPDATES
-- ========================================

-- Drop existing UPDATE policy for user_profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- Recreate with explicit USING and WITH CHECK
CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ========================================
-- PART 5: VERIFY FIXES
-- ========================================

-- Check 1: All users should now be in user_profiles
SELECT 
    COUNT(*) as total_auth_users,
    (SELECT COUNT(*) FROM public.user_profiles) as total_user_profiles,
    COUNT(*) - (SELECT COUNT(*) FROM public.user_profiles) as missing_profiles
FROM auth.users;

-- Check 2: Show all users with their plans
SELECT 
    up.email,
    up.plan,
    up.role,
    up.created_at
FROM public.user_profiles up
ORDER BY up.created_at DESC;

-- Check 3: Verify trigger is active
SELECT 
    trigger_name,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ========================================
-- EXPECTED OUTPUT
-- ========================================
-- After running this script, you should see:
-- 1. All users from auth.users now have profiles in user_profiles
-- 2. Trigger is recreated and active
-- 3. All plan changes should now save properly
-- 4. New signups will automatically create user_profiles




