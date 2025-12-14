-- Alternative fix: Use a SECURITY DEFINER function to handle soft delete
-- This bypasses RLS issues

-- Step 1: Create a function to soft delete images
CREATE OR REPLACE FUNCTION soft_delete_user_image(
  p_image_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verify the image belongs to the user
  SELECT COUNT(*) INTO v_count
  FROM user_images
  WHERE id = p_image_id
    AND user_id = p_user_id
    AND deleted_at IS NULL;
  
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Image not found or already deleted';
  END IF;
  
  -- Soft delete the image
  UPDATE user_images
  SET deleted_at = NOW()
  WHERE id = p_image_id
    AND user_id = p_user_id
    AND deleted_at IS NULL;
  
  -- Update storage count
  PERFORM update_user_storage_count(p_user_id);
  
  RETURN TRUE;
END;
$$;

-- Step 2: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_user_image(UUID, UUID) TO authenticated;

-- Step 3: Verify the function was created
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'soft_delete_user_image';

-- Step 4: Test the function (optional - replace with actual IDs)
-- SELECT soft_delete_user_image('your-image-id-here'::UUID, 'your-user-id-here'::UUID);
