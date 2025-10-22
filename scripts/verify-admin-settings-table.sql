-- Verify admin_settings table exists and is set up correctly

-- 1. Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'admin_settings'
) as table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_settings'
AND table_schema = 'public';

-- 3. Check existing data in admin_settings
SELECT * FROM admin_settings ORDER BY setting_key;

-- 4. Check RLS policies on admin_settings
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'admin_settings';

-- 5. Try a test insert (will show error if permissions are wrong)
INSERT INTO admin_settings (setting_key, setting_value)
VALUES ('test_key', 'test_value')
ON CONFLICT (setting_key) 
DO UPDATE SET setting_value = 'test_value';

-- 6. Check if it was inserted
SELECT * FROM admin_settings WHERE setting_key = 'test_key';

-- 7. Clean up test
DELETE FROM admin_settings WHERE setting_key = 'test_key';




