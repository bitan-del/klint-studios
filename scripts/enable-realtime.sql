-- Enable real-time updates for user_profiles table

-- 1. Enable real-time replication for user_profiles
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;

-- 2. Verify it's enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'user_profiles';

-- If the above returns a row, real-time is enabled!
-- If not, you may need to enable it in Supabase Dashboard:
-- Go to Database → Replication → Enable for user_profiles table




