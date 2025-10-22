-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_plan AS ENUM ('free', 'solo', 'studio', 'brand');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE currency_type AS ENUM ('USD', 'EUR', 'INR');

-- User Profiles Table
-- This extends Supabase auth.users with our custom fields
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    plan user_plan NOT NULL DEFAULT 'free',
    role user_role NOT NULL DEFAULT 'user',
    generations_used INTEGER NOT NULL DEFAULT 0,
    daily_generations_used INTEGER NOT NULL DEFAULT 0,
    daily_videos_used INTEGER NOT NULL DEFAULT 0,
    last_generation_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment Settings Table (Admin only)
CREATE TABLE public.payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway TEXT NOT NULL UNIQUE, -- 'stripe' or 'razorpay'
    publishable_key TEXT,
    secret_key TEXT, -- Should be encrypted in production
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plan Pricing Table (Admin only)
CREATE TABLE public.plan_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan user_plan NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    currency currency_type NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Settings Table
CREATE TABLE public.admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generation History Table (Optional - for tracking)
CREATE TABLE public.generation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    generation_type TEXT NOT NULL, -- 'image', 'video', etc.
    mode TEXT, -- 'product', 'design', 'apparel', etc.
    prompt TEXT,
    settings JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_plan ON public.user_profiles(plan);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_generation_history_user_id ON public.generation_history(user_id);
CREATE INDEX idx_generation_history_created_at ON public.generation_history(created_at);

-- Insert default payment settings
INSERT INTO public.payment_settings (gateway, publishable_key, secret_key) VALUES 
    ('stripe', '', ''),
    ('razorpay', '', '');

-- Insert default plan pricing
INSERT INTO public.plan_pricing (plan, price, currency) VALUES 
    ('solo', 25.00, 'USD'),
    ('studio', 59.00, 'USD'),
    ('brand', 129.00, 'USD');

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, plan, role)
    VALUES (
        NEW.id, 
        NEW.email,
        -- Check if this is the super admin email
        CASE 
            WHEN NEW.email = 'bitan@outreachpro.io' THEN 'brand'
            ELSE 'free'
        END,
        CASE 
            WHEN NEW.email = 'bitan@outreachpro.io' THEN 'admin'
            ELSE 'user'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_settings_updated_at BEFORE UPDATE ON public.payment_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_pricing_updated_at BEFORE UPDATE ON public.plan_pricing
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (but not plan or role)
CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = OLD.role AND
        (SELECT plan FROM public.user_profiles WHERE id = auth.uid()) = OLD.plan
    );

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
    ON public.user_profiles FOR SELECT
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- Admins can update any profile
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
-- Everyone can read plan pricing
CREATE POLICY "Anyone can read plan pricing"
    ON public.plan_pricing FOR SELECT
    USING (true);

-- Only admins can update pricing
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
-- Users can read their own history
CREATE POLICY "Users can read own generation history"
    ON public.generation_history FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert own generation history"
    ON public.generation_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can read all history
CREATE POLICY "Admins can read all generation history"
    ON public.generation_history FOR SELECT
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- Function to increment user generations
CREATE OR REPLACE FUNCTION public.increment_user_generations(
    p_user_id UUID,
    p_count INTEGER DEFAULT 1,
    p_is_video BOOLEAN DEFAULT false
)
RETURNS void AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_last_gen_date DATE;
BEGIN
    SELECT last_generation_date INTO v_last_gen_date
    FROM public.user_profiles
    WHERE id = p_user_id;

    IF v_last_gen_date IS NULL OR v_last_gen_date < v_today THEN
        -- New day, reset daily counters
        UPDATE public.user_profiles
        SET 
            generations_used = generations_used + p_count,
            daily_generations_used = CASE WHEN p_is_video THEN 0 ELSE p_count END,
            daily_videos_used = CASE WHEN p_is_video THEN p_count ELSE 0 END,
            last_generation_date = v_today
        WHERE id = p_user_id;
    ELSE
        -- Same day, increment counters
        UPDATE public.user_profiles
        SET 
            generations_used = generations_used + p_count,
            daily_generations_used = CASE WHEN p_is_video THEN daily_generations_used ELSE daily_generations_used + p_count END,
            daily_videos_used = CASE WHEN p_is_video THEN daily_videos_used + p_count ELSE daily_videos_used END,
            last_generation_date = v_today
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_user_generations(UUID, INTEGER, BOOLEAN) TO authenticated;

-- Create a function to get all users (admin only)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    plan user_plan,
    role user_role,
    generations_used INTEGER,
    daily_generations_used INTEGER,
    daily_videos_used INTEGER,
    last_generation_date DATE,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Check if user is admin
    IF (SELECT role FROM public.user_profiles WHERE id = auth.uid()) != 'admin' THEN
        RAISE EXCEPTION 'Only admins can access this function';
    END IF;

    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.plan,
        up.role,
        up.generations_used,
        up.daily_generations_used,
        up.daily_videos_used,
        up.last_generation_date,
        up.created_at
    FROM public.user_profiles up
    ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information linked to auth.users';
COMMENT ON TABLE public.payment_settings IS 'Payment gateway configuration (admin only)';
COMMENT ON TABLE public.plan_pricing IS 'Subscription plan pricing information';
COMMENT ON TABLE public.admin_settings IS 'General admin settings and configurations';
COMMENT ON TABLE public.generation_history IS 'History of all image/video generations';

