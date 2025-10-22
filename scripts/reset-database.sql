-- RESET DATABASE SCRIPT
-- ⚠️ WARNING: This will delete ALL existing data!
-- Only run this if you want to start completely fresh

-- Drop all tables (this will cascade and remove all data)
DROP TABLE IF EXISTS public.generation_history CASCADE;
DROP TABLE IF EXISTS public.admin_settings CASCADE;
DROP TABLE IF EXISTS public.plan_pricing CASCADE;
DROP TABLE IF EXISTS public.payment_settings CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.increment_user_generations(UUID, INTEGER, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.get_all_users() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS public.user_plan CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.currency_type CASCADE;

-- Success message
SELECT '✅ Database reset complete. Now run the full migration script.' as status;

