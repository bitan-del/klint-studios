-- Add video usage tracking columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS videos_generated_monthly INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS videos_generated_daily INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_video_generation_date DATE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_video_usage 
ON user_profiles(videos_generated_monthly, videos_generated_daily);
