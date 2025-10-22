-- Fix infinite recursion in RLS policies for user_profiles

-- Step 1: Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- Step 2: Create a function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 3: Create new policies using the function

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.user_profiles 
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Admins can read ALL profiles (using function to avoid recursion)
CREATE POLICY "Admins can read all profiles"
    ON public.user_profiles 
    FOR SELECT
    USING (public.is_admin());

-- Policy 3: Users can update their own profile (but not role/plan)
CREATE POLICY "Users can update own profile"
    ON public.user_profiles 
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AND
        plan = (SELECT plan FROM public.user_profiles WHERE id = auth.uid())
    );

-- Policy 4: Admins can update any profile
CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles 
    FOR UPDATE
    USING (public.is_admin());

-- Step 4: Verify policies were created
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Step 5: Test - should return all users if you're admin
SELECT COUNT(*) as total_users FROM user_profiles;
SELECT email, role, plan FROM user_profiles LIMIT 5;




