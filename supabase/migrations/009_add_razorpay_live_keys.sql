-- Add Razorpay LIVE keys to admin_settings
-- These are the keys you provided earlier

-- Add Razorpay Key ID (publishable key)
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('razorpay_key_id', '"rzp_live_RWDju114DMACcC"'::jsonb)
ON CONFLICT (setting_key)
DO UPDATE SET 
  setting_value = '"rzp_live_RWDju114DMACcC"'::jsonb,
  updated_at = NOW();

-- Add Razorpay Key Secret
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('razorpay_key_secret', '"hY52uGpMRKe229DLV4Y640Yj"'::jsonb)
ON CONFLICT (setting_key)
DO UPDATE SET 
  setting_value = '"hY52uGpMRKe229DLV4Y640Yj"'::jsonb,
  updated_at = NOW();

