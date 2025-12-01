-- Migration: Add HD/UHD tracking columns to users table
-- Created: 2025-11-26
-- Description: Adds columns to track HD and UHD image generation usage

-- Add new columns for HD/UHD tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS hd_generations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uhd_generations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_hd_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_uhd_used INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN users.hd_generations_used IS 'Total HD images generated this month';
COMMENT ON COLUMN users.uhd_generations_used IS 'Total UHD images generated this month';
COMMENT ON COLUMN users.daily_hd_used IS 'HD images generated today';
COMMENT ON COLUMN users.daily_uhd_used IS 'UHD images generated today';
