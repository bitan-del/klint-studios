-- ============================================
-- PAYMENT SYSTEM MIGRATION (SAFE VERSION)
-- Date: October 22, 2025
-- Description: Add subscriptions, payments, invoices
-- ============================================

-- ============================================
-- STEP 1: CREATE ENUMS & TYPES (IF NOT EXISTS)
-- ============================================

-- Drop and recreate types to avoid conflicts
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');

-- ============================================
-- STEP 2: CREATE TABLES
-- ============================================

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    plan user_plan NOT NULL,
    status subscription_status DEFAULT 'trial',
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    trial_end_date TIMESTAMPTZ,
    razorpay_subscription_id TEXT,
    razorpay_mandate_id TEXT,
    auto_renew BOOLEAN DEFAULT true,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    plan user_plan NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    gst_amount DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    currency TEXT DEFAULT 'INR',
    status payment_status DEFAULT 'pending',
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    razorpay_signature TEXT,
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_address TEXT,
    user_gst_number TEXT,
    company_name TEXT,
    plan user_plan NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL,
    gst_rate DECIMAL(5, 2) DEFAULT 18.00,
    gst_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    invoice_date TIMESTAMPTZ DEFAULT NOW(),
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Counter
CREATE TABLE IF NOT EXISTS public.invoice_counter (
    id INT PRIMARY KEY DEFAULT 1,
    current_number INT DEFAULT 0,
    CHECK (id = 1)
);

-- Initialize counter
INSERT INTO public.invoice_counter (id, current_number) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 3: UPDATE USER_PROFILES TABLE
-- ============================================

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS gst_number TEXT,
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- ============================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to calculate GST (18%)
CREATE OR REPLACE FUNCTION public.calculate_gst(base_amount DECIMAL)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN ROUND(base_amount * 0.18, 2);
END;
$$;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    year_part TEXT;
    number_part INT;
    invoice_num TEXT;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    UPDATE public.invoice_counter 
    SET current_number = current_number + 1
    WHERE id = 1
    RETURNING current_number INTO number_part;
    
    invoice_num := 'INV-' || year_part || '-' || LPAD(number_part::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$$;

-- Function to check subscription status (UPDATED VERSION)
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
    -- Get user role
    SELECT role INTO user_role
    FROM public.user_profiles
    WHERE id = user_id;
    
    -- Super admin never needs payment
    IF user_role = 'super_admin' THEN
        RETURN QUERY SELECT true, false;
        RETURN;
    END IF;
    
    -- Check for active subscription
    SELECT * INTO sub_record
    FROM public.subscriptions
    WHERE subscriptions.user_id = check_subscription_status.user_id
    AND status IN ('active', 'trial')
    AND end_date > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF sub_record IS NULL THEN
        -- No active subscription
        RETURN QUERY SELECT false, true;
    ELSE
        -- Has active subscription
        RETURN QUERY SELECT true, false;
    END IF;
END;
$$;

-- Function to create subscription after payment
CREATE OR REPLACE FUNCTION public.create_subscription(
    p_user_id UUID,
    p_plan user_plan,
    p_payment_id UUID,
    p_razorpay_subscription_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_subscription_id UUID;
    subscription_end_date TIMESTAMPTZ;
    trial_end TIMESTAMPTZ;
BEGIN
    -- Calculate end date based on plan
    IF p_plan = 'solo' THEN
        -- Solo plan: 3 days trial, then 1 year
        trial_end := NOW() + INTERVAL '3 days';
        subscription_end_date := NOW() + INTERVAL '1 year';
    ELSE
        -- Studio/Brand: 1 year, no trial
        trial_end := NULL;
        subscription_end_date := NOW() + INTERVAL '1 year';
    END IF;
    
    -- Create subscription
    INSERT INTO public.subscriptions (
        user_id,
        plan,
        status,
        start_date,
        end_date,
        trial_end_date,
        razorpay_subscription_id
    ) VALUES (
        p_user_id,
        p_plan,
        CASE WHEN p_plan = 'solo' THEN 'trial'::subscription_status ELSE 'active'::subscription_status END,
        NOW(),
        subscription_end_date,
        trial_end,
        p_razorpay_subscription_id
    )
    RETURNING id INTO new_subscription_id;
    
    -- Update payment with subscription_id
    UPDATE public.payments
    SET subscription_id = new_subscription_id
    WHERE id = p_payment_id;
    
    -- Update user_profiles
    UPDATE public.user_profiles
    SET 
        subscription_id = new_subscription_id,
        plan = p_plan
    WHERE id = p_user_id;
    
    RETURN new_subscription_id;
END;
$$;

-- ============================================
-- STEP 5: CREATE TRIGGERS
-- ============================================

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;

-- Create trigger
CREATE TRIGGER update_subscriptions_updated_at 
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "System can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "System can update subscriptions" ON public.subscriptions;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;
DROP POLICY IF EXISTS "System can update payments" ON public.payments;

DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "System can insert invoices" ON public.invoices;

-- Subscriptions Policies
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
    ON public.subscriptions FOR SELECT
    USING (public.is_admin());

CREATE POLICY "System can insert subscriptions"
    ON public.subscriptions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update subscriptions"
    ON public.subscriptions FOR UPDATE
    USING (true);

-- Payments Policies
CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
    ON public.payments FOR SELECT
    USING (public.is_admin());

CREATE POLICY "System can insert payments"
    ON public.payments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update payments"
    ON public.payments FOR UPDATE
    USING (true);

-- Invoices Policies
CREATE POLICY "Users can view own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invoices"
    ON public.invoices FOR SELECT
    USING (public.is_admin());

CREATE POLICY "System can insert invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (true);

-- ============================================
-- STEP 7: CREATE INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_end_date;
DROP INDEX IF EXISTS idx_payments_user_id;
DROP INDEX IF EXISTS idx_payments_subscription_id;
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_payments_razorpay_payment_id;
DROP INDEX IF EXISTS idx_invoices_user_id;
DROP INDEX IF EXISTS idx_invoices_payment_id;
DROP INDEX IF EXISTS idx_invoices_invoice_number;

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_payment_id ON public.invoices(payment_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);

-- ============================================
-- COMPLETE
-- ============================================

-- Verify tables
SELECT 
    'subscriptions' as table_name, 
    COUNT(*) as row_count,
    'Table created successfully' as status
FROM public.subscriptions
UNION ALL
SELECT 'payments', COUNT(*), 'Table created successfully'
FROM public.payments
UNION ALL
SELECT 'invoices', COUNT(*), 'Table created successfully'
FROM public.invoices;

