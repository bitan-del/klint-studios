-- Fix RLS policies for user_profiles to ensure admin can see all users

-- 1. Check current policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 2. Drop existing "Admins can read all profiles" policy
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;

-- 3. Recreate it (simpler, more reliable version)
CREATE POLICY "Admins can read all profiles"
    ON public.user_profiles 
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 4. Verify the policy was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles'
AND policyname = 'Admins can read all profiles';

-- 5. Test: Try to select all users (should work if you're admin)
SELECT email, role, plan FROM user_profiles;

-- 6. Count how many users you can see
SELECT COUNT(*) as users_visible FROM user_profiles;




