-- COMPLETE FIX for RLS delete issue
-- Run this in Supabase SQL Editor

-- Step 1: Check current state (diagnostic)
SELECT 'Current policies:' as info;
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check,
  CASE 
    WHEN cmd = 'UPDATE' AND with_check IS NULL THEN '❌ MISSING WITH CHECK'
    WHEN cmd = 'UPDATE' AND with_check IS NOT NULL THEN '✅ OK'
    ELSE 'N/A'
  END as status
FROM pg_policies
WHERE tablename = 'user_images';

-- Step 2: Drop ALL update policies (in case there are duplicates)
DROP POLICY IF EXISTS "Users can update their own images" ON public.user_images;

-- Step 3: Recreate with proper WITH CHECK clause
CREATE POLICY "Users can update their own images"
  ON public.user_images FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 4: Verify it was created correctly
SELECT 'Verification - Policy should show WITH CHECK:' as info;
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check,
  CASE 
    WHEN with_check IS NULL THEN '❌ STILL MISSING - Something went wrong!'
    ELSE '✅ FIXED - WITH CHECK is present'
  END as verification
FROM pg_policies
WHERE tablename = 'user_images' 
  AND policyname = 'Users can update their own images';

-- Step 5: Also ensure RLS is enabled
ALTER TABLE public.user_images ENABLE ROW LEVEL SECURITY;

SELECT '✅ Fix complete! Try deleting an image now.' as result;
