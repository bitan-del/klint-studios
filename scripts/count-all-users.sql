-- Run this in Supabase SQL Editor to see ALL users

-- 1. Total user count
SELECT COUNT(*) as total_users FROM user_profiles;

-- 2. List ALL users (including you)
SELECT 
    email,
    role,
    plan,
    created_at,
    generations_used
FROM user_profiles
ORDER BY created_at DESC;

-- 3. Count by role
SELECT 
    role,
    COUNT(*) as count
FROM user_profiles
GROUP BY role;

-- 4. Check if RLS is allowing you to see all users
-- (This should return the same count as query #1 if RLS is working)
SELECT COUNT(*) FROM user_profiles WHERE true;




