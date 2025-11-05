-- Update plan prices to correct values
-- Solo: ₹999, Studio: ₹2999, Brand: ₹4999

-- Update Solo plan price
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('plan_price_solo', '999'::jsonb)
ON CONFLICT (setting_key)
DO UPDATE SET 
  setting_value = '999'::jsonb,
  updated_at = NOW();

-- Update Studio plan price
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('plan_price_studio', '2999'::jsonb)
ON CONFLICT (setting_key)
DO UPDATE SET 
  setting_value = '2999'::jsonb,
  updated_at = NOW();

-- Update Brand plan price
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('plan_price_brand', '4999'::jsonb)
ON CONFLICT (setting_key)
DO UPDATE SET 
  setting_value = '4999'::jsonb,
  updated_at = NOW();

-- Update Free plan price (keep at 0)
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('plan_price_free', '0'::jsonb)
ON CONFLICT (setting_key)
DO UPDATE SET 
  setting_value = '0'::jsonb,
  updated_at = NOW();




