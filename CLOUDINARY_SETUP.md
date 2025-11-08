# Cloudinary Setup Guide

## Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com/users/register/free
2. Sign up for a free account (25GB storage, 25GB bandwidth/month)
3. Verify your email

## Step 2: Get Your Cloudinary Credentials

1. Log in to Cloudinary Dashboard
2. Go to **Settings** → **Upload** tab
3. Find your **Cloud Name** (e.g., `your-cloud-name`)
4. Scroll down to **Upload presets**
5. Create a new upload preset:
   - Name: `klint-studios-upload` (or any name)
   - Signing mode: **Unsigned** (for client-side uploads)
   - Folder: `klint-studios` (optional)
   - Click **Save**

## Step 3: Configure in Admin Panel

1. Log in to Klint Studios as admin
2. Go to **Admin Panel** → **Integrations** tab
3. Enter your Cloudinary credentials:
   - **Cloud Name**: Your cloud name from Cloudinary dashboard
   - **Upload Preset**: The preset name you created (e.g., `klint-studios-upload`)
4. Click **Save Cloudinary Settings**

## Step 4: Run Database Migration

Run the migration to create the `user_images` table:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/003_user_images_storage.sql
```

Or use the Supabase CLI:
```bash
supabase migration up
```

## Step 5: Test the Integration

1. Generate an image in any workflow
2. Check if it appears in "My Creations"
3. Verify the image is stored in Cloudinary dashboard

## Features Implemented

✅ **Image Compression**: All images are compressed before upload (reduces size by 70-85%)
✅ **Cloudinary Storage**: Images stored in Cloudinary (free tier: 25GB)
✅ **Storage Limits**: Plan-based limits (Free: 10, BASIC: 100, PRO: 500, ADVANCE: 2000)
✅ **Auto-Cleanup**: Old images deleted based on plan retention (Free: 7 days, BASIC: 30 days, PRO: 90 days, ADVANCE: 180 days)
✅ **My Creations Tab**: View and manage all generated images
✅ **Delete Option**: Users can delete their images
✅ **Storage Info**: Display storage usage and limits

## Storage Retention Policy

- **Free Plan**: 7 days retention, keep last 10 images
- **BASIC Plan**: 30 days retention, keep last 100 images
- **PRO Plan**: 90 days retention, keep last 500 images
- **ADVANCE Plan**: 180 days retention, keep last 2000 images

## Cost Analysis

With compression (2.5MB → 400KB average):
- 1,000 users × 10 images = 10,000 images = 4GB (within free tier)
- 10,000 users × 10 images = 100,000 images = 40GB (still within free tier)

Cloudinary free tier: **25GB storage + 25GB bandwidth/month**

