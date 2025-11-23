-- Create quality usage tracking table
CREATE TABLE IF NOT EXISTS user_quality_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL,
  hd_count INTEGER DEFAULT 0 NOT NULL,
  qhd_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE user_quality_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own quality usage"
  ON user_quality_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quality usage"
  ON user_quality_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quality usage"
  ON user_quality_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Helper function to increment usage
CREATE OR REPLACE FUNCTION increment_quality_usage(
  p_user_id UUID,
  p_month_year TEXT,
  p_field TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_quality_usage (user_id, month_year, hd_count, qhd_count)
  VALUES (
    p_user_id, 
    p_month_year,
    CASE WHEN p_field = 'hd_count' THEN 1 ELSE 0 END,
    CASE WHEN p_field = 'qhd_count' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    hd_count = CASE WHEN p_field = 'hd_count' THEN user_quality_usage.hd_count + 1 ELSE user_quality_usage.hd_count END,
    qhd_count = CASE WHEN p_field = 'qhd_count' THEN user_quality_usage.qhd_count + 1 ELSE user_quality_usage.qhd_count END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_quality_usage_user_month 
  ON user_quality_usage(user_id, month_year);
