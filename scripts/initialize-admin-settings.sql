-- ============================================================================
-- Initialize ALL Admin Settings in Database
-- ============================================================================
-- Run this script ONCE in Supabase SQL Editor after deployment
-- Or use the Admin Panel UI to configure these settings
-- ============================================================================

-- 1. GEMINI API KEY
INSERT INTO admin_settings (setting_key, setting_value)
VALUES ('gemini_api_key', 'YOUR_GEMINI_API_KEY_HERE')
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- 2. STRIPE PAYMENT GATEWAY
INSERT INTO admin_settings (setting_key, setting_value)
VALUES 
  ('stripe_publishable_key', 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY'),
  ('stripe_secret_key', 'sk_test_YOUR_STRIPE_SECRET_KEY')
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- 3. RAZORPAY PAYMENT GATEWAY
INSERT INTO admin_settings (setting_key, setting_value)
VALUES 
  ('razorpay_key_id', 'rzp_test_YOUR_KEY_ID'),
  ('razorpay_key_secret', 'YOUR_RAZORPAY_SECRET')
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- 4. PLAN PRICING
INSERT INTO admin_settings (setting_key, setting_value)
VALUES 
  ('plan_price_free', '0'),
  ('plan_price_solo', '25'),
  ('plan_price_studio', '59'),
  ('plan_price_brand', '129'),
  ('pricing_currency', 'USD')
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- ============================================================================
-- VERIFY ALL SETTINGS
-- ============================================================================
SELECT 
  setting_key,
  CASE 
    WHEN setting_key LIKE '%secret%' OR setting_key LIKE '%key%' THEN '***HIDDEN***'
    ELSE setting_value
  END as display_value,
  updated_at
FROM admin_settings
ORDER BY setting_key;

-- ============================================================================
-- EXPECTED OUTPUT (with actual values hidden for security)
-- ============================================================================
-- setting_key                  | display_value | updated_at
-- -----------------------------|---------------|-------------------------
-- gemini_api_key               | ***HIDDEN***  | 2025-10-21 21:00:00
-- plan_price_brand             | 129           | 2025-10-21 21:00:00
-- plan_price_free              | 0             | 2025-10-21 21:00:00
-- plan_price_solo              | 25            | 2025-10-21 21:00:00
-- plan_price_studio            | 59            | 2025-10-21 21:00:00
-- pricing_currency             | USD           | 2025-10-21 21:00:00
-- razorpay_key_id              | ***HIDDEN***  | 2025-10-21 21:00:00
-- razorpay_key_secret          | ***HIDDEN***  | 2025-10-21 21:00:00
-- stripe_publishable_key       | ***HIDDEN***  | 2025-10-21 21:00:00
-- stripe_secret_key            | ***HIDDEN***  | 2025-10-21 21:00:00




