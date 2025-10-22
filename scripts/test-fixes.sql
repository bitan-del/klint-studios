-- Test both fixes

-- 1. Check if Razorpay keys are in database
SELECT setting_key, setting_value 
FROM admin_settings 
WHERE setting_key LIKE 'razorpay%'
ORDER BY setting_key;

-- 2. Check current plans for all users
SELECT email, plan FROM user_profiles ORDER BY email;

-- 3. Test updating a user's plan (replace the email with actual user)
-- This will show if RLS is blocking the update
UPDATE user_profiles 
SET plan = 'solo' 
WHERE email = 'triplancoleads@gmail.com';

-- 4. Verify the update worked
SELECT email, plan FROM user_profiles WHERE email = 'triplancoleads@gmail.com';

-- 5. Check RLS policies for UPDATE on user_profiles
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND cmd = 'UPDATE'
ORDER BY policyname;




