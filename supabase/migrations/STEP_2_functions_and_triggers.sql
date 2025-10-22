-- STEP 2: Create Functions and Triggers
-- Run this after Step 1

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, plan, role)
    VALUES (
        NEW.id, 
        NEW.email,
        CASE 
            WHEN NEW.email = 'bitan@outreachpro.io' THEN 'brand'::user_plan
            ELSE 'free'::user_plan
        END,
        CASE 
            WHEN NEW.email = 'bitan@outreachpro.io' THEN 'admin'::user_role
            ELSE 'user'::user_role
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
        UPDATE public.user_profiles
        SET 
            generations_used = generations_used + p_count,
            daily_generations_used = CASE WHEN p_is_video THEN 0 ELSE p_count END,
            daily_videos_used = CASE WHEN p_is_video THEN p_count ELSE 0 END,
            last_generation_date = v_today
        WHERE id = p_user_id;
    ELSE
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_user_generations(UUID, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;

SELECT '✅ Step 2 Complete: Functions and triggers created!' as status;

