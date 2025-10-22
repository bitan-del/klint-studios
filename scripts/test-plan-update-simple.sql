-- 🧪 SIMPLE TEST: Update a user's plan

-- Step 1: Show current state
SELECT email, plan, role FROM public.user_profiles WHERE email = 'triplancoleads@gmail.com';

-- Step 2: Update the plan
UPDATE public.user_profiles 
SET plan = 'solo' 
WHERE email = 'triplancoleads@gmail.com';

-- Step 3: Verify the update worked
SELECT email, plan, role FROM public.user_profiles WHERE email = 'triplancoleads@gmail.com';

-- Expected output:
-- Before: triplancoleads@gmail.com | free | user
-- After:  triplancoleads@gmail.com | solo | user




