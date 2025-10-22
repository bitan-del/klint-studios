-- ============================================
-- ADD RAZORPAY KEYS TO ADMIN SETTINGS
-- ============================================

-- Insert or update Razorpay publishable key (Key ID)
INSERT INTO public.admin_settings (setting_key, setting_value, updated_at)
VALUES ('razorpay_publishable_key', '"rzp_live_RWDju114DMACcC"'::jsonb, NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = '"rzp_live_RWDju114DMACcC"'::jsonb,
    updated_at = NOW();

-- Insert or update Razorpay secret key
INSERT INTO public.admin_settings (setting_key, setting_value, updated_at)
VALUES ('razorpay_secret_key', '"hY52uGpMRKe229DLV4Y640Yj"'::jsonb, NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = '"hY52uGpMRKe229DLV4Y640Yj"'::jsonb,
    updated_at = NOW();

-- Verify the keys were added
SELECT setting_key, 
       CASE 
           WHEN setting_key LIKE '%secret%' THEN CONCAT(LEFT(setting_value, 10), '...')
           ELSE setting_value 
       END as setting_value_preview,
       updated_at
FROM public.admin_settings
WHERE setting_key IN ('razorpay_publishable_key', 'razorpay_secret_key')
ORDER BY setting_key;

