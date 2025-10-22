-- STEP 1: Create Types and Tables
-- Run this first

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_plan AS ENUM ('free', 'solo', 'studio', 'brand');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE currency_type AS ENUM ('USD', 'EUR', 'INR');

-- User Profiles Table
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

-- Payment Settings Table
CREATE TABLE public.payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway TEXT NOT NULL UNIQUE,
    publishable_key TEXT,
    secret_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plan Pricing Table
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

-- Generation History Table
CREATE TABLE public.generation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    generation_type TEXT NOT NULL,
    mode TEXT,
    prompt TEXT,
    settings JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
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

SELECT '✅ Step 1 Complete: Tables created!' as status;

