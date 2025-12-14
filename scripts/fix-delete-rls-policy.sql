-- Fix RLS policy for updating user_images (soft delete)
-- The UPDATE policy needs both USING and WITH CHECK clauses

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update their own images" ON public.user_images;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Users can update their own images"
  ON public.user_images FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify the policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_images' AND policyname = 'Users can update their own images';
