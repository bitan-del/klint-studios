-- Diagnostic: Check all RLS policies on user_images table

-- 1. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_images';

-- 2. List ALL policies on user_images
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
ORDER BY cmd, policyname;

-- 3. Check if there are any conflicting policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN with_check IS NULL THEN 'MISSING WITH CHECK!'
    ELSE 'OK'
  END as status
FROM pg_policies
WHERE tablename = 'user_images' 
  AND cmd = 'UPDATE';
