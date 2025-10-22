-- 🚨 EMERGENCY FIX - Run this in Supabase SQL Editor RIGHT NOW!

-- Step 1: Create profiles for ALL missing users
INSERT INTO public.user_profiles (id, email, plan, role)
SELECT 
    au.id,
    au.email,
    'free'::user_plan as plan,
    'user'::user_role as role
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 2: Fix the broken trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, plan, role)
    VALUES (
        NEW.id, 
        NEW.email,
        'free'::user_plan,
        'user'::user_role
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Make bitan@outreachpro.io admin again (in case it was lost)
UPDATE public.user_profiles 
SET role = 'admin', plan = 'brand'
WHERE email = 'bitan@outreachpro.io';

-- Step 4: Verify - you should see ALL users including Venika
SELECT email, plan, role, created_at FROM public.user_profiles ORDER BY created_at DESC;




