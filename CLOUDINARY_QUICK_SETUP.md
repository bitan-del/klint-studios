# Cloudinary Quick Setup Guide

## ✅ Your Credentials (Already Configured)
- **Cloud Name**: `defaekh7f`
- **API Key**: `558855971477248`
- **API Secret**: `s0HTg1QKFaK5Ra0QI2H0FpIIiVU`

## Step 1: Run Database Migration

Run this SQL script in Supabase SQL Editor:

```sql
-- File: scripts/setup-cloudinary.sql
-- Copy and paste the entire content into Supabase SQL Editor
```

Or run the migration file:
```sql
-- File: supabase/migrations/003_user_images_storage.sql
```

## Step 2: Configure Cloudinary Settings in Database

Run this SQL in Supabase SQL Editor:

```sql
-- Setup Cloudinary Configuration
INSERT INTO public.admin_settings (setting_key, setting_value, updated_at)
VALUES 
  ('cloudinary_cloud_name', '"defaekh7f"'::jsonb, NOW()),
  ('cloudinary_upload_preset', '"klint-studios-upload"'::jsonb, NOW()),
  ('cloudinary_api_key', '"558855971477248"'::jsonb, NOW()),
  ('cloudinary_api_secret', '"s0HTg1QKFaK5Ra0QI2H0FpIIiVU"'::jsonb, NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();
```

## Step 3: Create Upload Preset in Cloudinary Dashboard

**IMPORTANT**: This must be done in Cloudinary Dashboard:

1. **Log in to Cloudinary**: https://console.cloudinary.com/
2. **Go to Settings** → **Upload** tab
3. **Scroll to "Upload presets"** section
4. **Click "Add upload preset"**
5. **Configure the preset**:
   - **Preset name**: `klint-studios-upload`
   - **Signing mode**: Select **"Unsigned"** (important for client-side uploads)
   - **Folder**: `klint-studios` (optional, for organization)
   - **Format**: Leave default or set to `auto`
   - **Quality**: Leave default or set to `auto`
   - **Transformation**: Leave default
6. **Click "Save"**

## Step 4: Verify Configuration

1. **Restart your app** (if running)
2. **Log in as admin**
3. **Go to Admin Panel** → **Integrations** tab
4. **Check Cloudinary settings** - they should be pre-filled
5. **Click "Save Cloudinary Settings"** to verify

## Step 5: Test Upload

1. **Generate an image** in any workflow
2. **Check "My Creations"** tab
3. **Verify image appears** and is stored in Cloudinary

## ✅ Free Plan Analysis

### Will It Work? **YES!** ✅

**Cloudinary Free Plan Includes:**
- **~25 GB Storage** (free tier)
- **~25 GB Bandwidth/month** (free tier)
- **Unlimited transformations** (within bandwidth limits)

**Our Usage with Compression:**
- **Average image size**: 400 KB (after compression from 2.5MB)
- **Max images**: ~62,500 images (25 GB ÷ 400 KB)
- **With 1,000 users**: ~62 images per user ✅

**Conclusion**: The free plan will work perfectly for:
- **< 1,000 active users**
- **< 10 images per user** (on average)
- **< 62,500 total images stored**

### When to Upgrade

Consider upgrading if:
- **> 1,000 active users**
- **> 10 images per user** (on average)
- **> 62,500 total images stored**
- **> 25 GB bandwidth/month**

## Troubleshooting

### Issue: "Cloudinary not initialized"
**Solution**: Make sure you've run the SQL script and created the upload preset.

### Issue: "Upload preset not found"
**Solution**: Create the upload preset in Cloudinary Dashboard (Step 3).

### Issue: "Unauthorized" error
**Solution**: Check that the upload preset is set to "Unsigned" mode.

### Issue: Images not saving
**Solution**: 
1. Check browser console for errors
2. Verify Cloudinary settings in Admin Panel
3. Check that upload preset exists in Cloudinary Dashboard

## Next Steps

1. ✅ Run database migration
2. ✅ Configure Cloudinary settings (SQL script)
3. ⚠️ **Create upload preset** in Cloudinary Dashboard (Step 3)
4. ✅ Test image upload
5. ✅ Check "My Creations" tab

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify Cloudinary settings in Admin Panel
3. Check Cloudinary Dashboard for upload preset
4. Review `CLOUDINARY_FREE_PLAN_ANALYSIS.md` for detailed analysis

