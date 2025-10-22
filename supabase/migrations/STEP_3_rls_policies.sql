-- STEP 3: Row Level Security (RLS) Policies
-- Run this after Step 2

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
-- Allow automatic profile creation via trigger
CREATE POLICY "Allow trigger to insert profiles"
    ON public.user_profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can read own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
    ON public.user_profiles FOR SELECT
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles FOR UPDATE
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- Payment Settings Policies (Admin only)
CREATE POLICY "Only admins can read payment settings"
    ON public.payment_settings FOR SELECT
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Only admins can update payment settings"
    ON public.payment_settings FOR UPDATE
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- Plan Pricing Policies
CREATE POLICY "Anyone can read plan pricing"
    ON public.plan_pricing FOR SELECT
    USING (true);

CREATE POLICY "Only admins can update plan pricing"
    ON public.plan_pricing FOR UPDATE
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- Admin Settings Policies (Admin only)
CREATE POLICY "Only admins can read admin settings"
    ON public.admin_settings FOR SELECT
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Only admins can manage admin settings"
    ON public.admin_settings FOR ALL
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- Generation History Policies
CREATE POLICY "Users can read own generation history"
    ON public.generation_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation history"
    ON public.generation_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all generation history"
    ON public.generation_history FOR SELECT
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

SELECT '✅ Step 3 Complete: RLS policies created! Database setup finished!' as status;

