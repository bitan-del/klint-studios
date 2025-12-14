-- Complete fix for RLS policy on user_images UPDATE
-- This fixes the "new row violates row-level security policy" error

-- Step 1: Drop existing UPDATE policy if it exists
DROP POLICY IF EXISTS "Users can update their own images" ON public.user_images;

-- Step 2: Recreate the policy with both USING and WITH CHECK clauses
CREATE POLICY "Users can update their own images"
  ON public.user_images FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 3: Verify the policy was created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'user_images' 
  AND policyname = 'Users can update their own images';

-- Step 4: Also verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_images';

-- If the above shows rls_enabled = false, run this:
-- ALTER TABLE public.user_images ENABLE ROW LEVEL SECURITY;
