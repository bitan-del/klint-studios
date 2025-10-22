-- Check all users in the database
-- Run this in Supabase SQL Editor to see all users

SELECT 
    id,
    email,
    plan,
    role,
    generations_used,
    daily_generations_used,
    created_at
FROM user_profiles
ORDER BY created_at DESC;

-- Count total users
SELECT COUNT(*) as total_users FROM user_profiles;

-- Check specifically for admin
SELECT * FROM user_profiles WHERE email = 'bitan@outreachpro.io';




