-- ============================================
-- UPDATE TO RAZORPAY TEST KEYS
-- ============================================

-- Update to TEST publishable key (Key ID)
UPDATE public.admin_settings 
SET setting_value = '"rzp_test_RWWuAd7ApCUFCV"'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'razorpay_publishable_key';

-- Update to TEST secret key
UPDATE public.admin_settings 
SET setting_value = '"w2uPxSjfZtrvn5nLj9RRe0gl"'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'razorpay_secret_key';

-- Verify the test keys were updated
SELECT 
    setting_key, 
    setting_value,
    updated_at,
    CASE 
        WHEN setting_value::text LIKE '%test%' THEN '✅ TEST MODE'
        WHEN setting_value::text LIKE '%live%' THEN '⚠️ LIVE MODE'
        ELSE 'Unknown'
    END as mode
FROM public.admin_settings
WHERE setting_key IN ('razorpay_publishable_key', 'razorpay_secret_key')
ORDER BY setting_key;

