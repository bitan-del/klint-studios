-- Run this in Supabase SQL Editor to see ALL users in your database

-- 1. Count total users
SELECT COUNT(*) as total_users FROM user_profiles;

-- 2. List all users with details
SELECT 
    email,
    role,
    plan,
    created_at,
    generations_used,
    daily_generations_used
FROM user_profiles
ORDER BY created_at DESC;

-- 3. Check RLS policies for user_profiles
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
WHERE tablename = 'user_profiles';

-- 4. Check your admin status
SELECT 
    email,
    role,
    plan
FROM user_profiles
WHERE email = 'bitan@outreachpro.io';




