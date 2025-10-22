-- Script to check if your database is already set up correctly
-- Run this in Supabase SQL Editor

-- Check if all tables exist
SELECT 
    'Tables Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ All tables exist'
        ELSE '⚠️ Missing tables'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'payment_settings', 'plan_pricing', 'admin_settings', 'generation_history');

-- Check if custom types exist
SELECT 
    'Custom Types Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ All types exist'
        ELSE '⚠️ Missing types'
    END as status
FROM pg_type 
WHERE typname IN ('user_plan', 'user_role', 'currency_type');

-- Check if key functions exist
SELECT 
    'Functions Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ Key functions exist'
        ELSE '⚠️ Missing functions'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('handle_new_user', 'increment_user_generations', 'get_all_users');

-- Check if RLS is enabled on tables
SELECT 
    'Row Level Security Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ RLS enabled on all tables'
        ELSE '⚠️ RLS not fully enabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'payment_settings', 'plan_pricing', 'admin_settings', 'generation_history')
AND rowsecurity = true;

-- List all existing tables
SELECT 
    'Existing Tables' as info,
    string_agg(tablename, ', ') as tables
FROM pg_tables 
WHERE schemaname = 'public';

