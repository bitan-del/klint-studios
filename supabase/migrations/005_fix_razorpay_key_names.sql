-- ============================================
-- FIX RAZORPAY KEY NAMES TO MATCH CODE
-- ============================================

-- Delete old incorrectly named keys
DELETE FROM public.admin_settings 
WHERE setting_key IN ('razorpay_publishable_key', 'razorpay_secret_key');

-- Insert with correct key names that the code expects
INSERT INTO public.admin_settings (setting_key, setting_value, updated_at)
VALUES ('razorpay_key_id', '"rzp_test_RWWuAd7ApCUFCV"'::jsonb, NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = '"rzp_test_RWWuAd7ApCUFCV"'::jsonb,
    updated_at = NOW();

INSERT INTO public.admin_settings (setting_key, setting_value, updated_at)
VALUES ('razorpay_key_secret', '"w2uPxSjfZtrvn5nLj9RRe0gl"'::jsonb, NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = '"w2uPxSjfZtrvn5nLj9RRe0gl"'::jsonb,
    updated_at = NOW();

-- Verify the keys are now correct
SELECT setting_key, setting_value, updated_at
FROM public.admin_settings
WHERE setting_key IN ('razorpay_key_id', 'razorpay_key_secret')
ORDER BY setting_key;




