-- ============================================
-- FIX SUBSCRIPTION STATUS CHECK
-- ============================================

-- Drop and recreate the check_subscription_status function
DROP FUNCTION IF EXISTS public.check_subscription_status(UUID);

CREATE OR REPLACE FUNCTION public.check_subscription_status(user_id UUID)
RETURNS TABLE (
    has_active_subscription BOOLEAN,
    needs_payment BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sub_record RECORD;
    user_role TEXT;
BEGIN
    -- Get user role and plan
    SELECT role, plan INTO user_role
    FROM public.user_profiles
    WHERE id = user_id;
    
    -- Super admin never needs payment
    IF user_role = 'super_admin' THEN
        RETURN QUERY SELECT true, false;
        RETURN;
    END IF;
    
    -- Check if user has an active subscription in subscriptions table
    SELECT * INTO sub_record
    FROM public.subscriptions
    WHERE subscriptions.user_id = check_subscription_status.user_id
    AND status IN ('active', 'trial')
    AND end_date > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If subscription found, user doesn't need payment
    IF sub_record.id IS NOT NULL THEN
        RETURN QUERY SELECT true, false;
        RETURN;
    END IF;
    
    -- No active subscription found - needs payment
    RETURN QUERY SELECT false, true;
END;
$$;




