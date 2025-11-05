-- ============================================
-- FIX ADMIN_SETTINGS RLS - ALLOW READ ACCESS
-- ============================================
-- Payment settings (like Razorpay keys) need to be readable by all users
-- to process payments, but only admins should be able to write them

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can delete settings" ON public.admin_settings;

-- Allow ALL authenticated users to READ admin settings
-- (needed for payment processing, plan pricing, etc.)
CREATE POLICY "Authenticated users can view all settings"
    ON public.admin_settings FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can INSERT settings
CREATE POLICY "Admins can insert settings"
    ON public.admin_settings FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Only admins can UPDATE settings
CREATE POLICY "Admins can update settings"
    ON public.admin_settings FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Only admins can DELETE settings
CREATE POLICY "Admins can delete settings"
    ON public.admin_settings FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Verify policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'admin_settings'
ORDER BY policyname;




