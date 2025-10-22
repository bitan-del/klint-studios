-- SQL Script to Verify or Manually Set Admin Access
-- Run this in Supabase SQL Editor if needed

-- Check if bitan@outreachpro.io exists and their role
SELECT 
    id,
    email,
    plan,
    role,
    created_at
FROM 
    user_profiles
WHERE 
    email = 'bitan@outreachpro.io';

-- If the above query returns no results, the user hasn't signed up yet.
-- If it returns a user but role is not 'admin', run this to fix it:

-- UPDATE user_profiles 
-- SET role = 'admin', plan = 'brand'
-- WHERE email = 'bitan@outreachpro.io';

-- Verify the update worked:
-- SELECT * FROM user_profiles WHERE email = 'bitan@outreachpro.io';

-- Optional: Check all admin users
-- SELECT id, email, plan, role FROM user_profiles WHERE role = 'admin';

-- Optional: Check user counts by role
-- SELECT role, COUNT(*) as count FROM user_profiles GROUP BY role;

