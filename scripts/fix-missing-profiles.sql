-- Fix Missing User Profiles
-- This script will create profiles for any users that don't have one

-- First, let's check what we have
SELECT 'Auth Users:' as info, count(*) as count FROM auth.users;
SELECT 'User Profiles:' as info, count(*) as count FROM public.user_profiles;

-- Show users without profiles
SELECT 
    'Missing profiles for:' as info,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Create profiles for any missing users
INSERT INTO public.user_profiles (id, email, plan, role)
SELECT 
    au.id,
    au.email,
    CASE 
        WHEN au.email = 'bitan@outreachpro.io' THEN 'brand'::user_plan
        ELSE 'free'::user_plan
    END as plan,
    CASE 
        WHEN au.email = 'bitan@outreachpro.io' THEN 'admin'::user_role
        ELSE 'user'::user_role
    END as role
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify all users now have profiles
SELECT 
    '✅ Profile check after fix:' as status,
    au.email,
    up.plan,
    up.role,
    up.created_at
FROM auth.users au
JOIN public.user_profiles up ON au.id = up.id
ORDER BY up.created_at;

-- Check if the trigger exists
SELECT 
    '🔍 Trigger status:' as info,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

