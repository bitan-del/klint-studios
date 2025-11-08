# How to Verify Cloudinary Setup

## ✅ Step 1: Check Database Migration

Run this SQL in Supabase SQL Editor to verify the `user_images` table exists:

```sql
-- Check if user_images table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_images';

-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_images' 
ORDER BY ordinal_position;
```

**Expected Result**: You should see the `user_images` table with columns like `id`, `user_id`, `cloudinary_url`, etc.

## ✅ Step 2: Check Cloudinary Settings in Database

Run this SQL in Supabase SQL Editor:

```sql
-- Check Cloudinary settings
SELECT setting_key, setting_value, updated_at 
FROM public.admin_settings 
WHERE setting_key LIKE 'cloudinary%'
ORDER BY setting_key;
```

**Expected Result**: You should see 4 rows:
- `cloudinary_cloud_name`: `"defaekh7f"`
- `cloudinary_upload_preset`: `"klint-studios-upload"`
- `cloudinary_api_key`: `"558855971477248"`
- `cloudinary_api_secret`: `"s0HTg1QKFaK5Ra0QI2H0FpIIiVU"`

## ✅ Step 3: Check Upload Preset in Cloudinary Dashboard

1. **Go to**: https://console.cloudinary.com/
2. **Navigate to**: Settings → Upload tab
3. **Scroll to**: "Upload presets" section
4. **Look for**: `klint-studios-upload` preset
5. **Verify**: It should be set to "Unsigned" mode

**Expected Result**: You should see the `klint-studios-upload` preset with "Unsigned" signing mode.

## ✅ Step 4: Check Admin Panel in App

1. **Start your app** (if not running):
   ```bash
   npm run dev
   ```

2. **Log in as admin**

3. **Go to**: Admin Panel → Integrations tab

4. **Check Cloudinary section**:
   - Cloud Name should be: `defaekh7f`
   - Upload Preset should be: `klint-studios-upload`
   - API Key should be filled (masked)

5. **Click "Save Cloudinary Settings"** to verify it saves

**Expected Result**: Settings should be pre-filled and save successfully.

## ✅ Step 5: Test Image Upload

1. **Generate an image** in any workflow:
   - Go to Dashboard
   - Click on any workflow (e.g., "AI Photoshoot")
   - Enter a prompt
   - Click "Generate"

2. **Check browser console** (F12 → Console tab):
   - Look for: `✅ Image uploaded to Cloudinary: https://res.cloudinary.com/...`
   - Look for: `✅ Image saved to Cloudinary`
   - Look for: `✅ 1 image(s) saved to Cloudinary`

**Expected Result**: You should see success messages in the console.

## ✅ Step 6: Check "My Creations" Tab

1. **Go to**: Dashboard → "My Creations" (in navigation)

2. **Verify**:
   - Generated images appear in the grid
   - Images load from Cloudinary URLs
   - Storage usage is displayed (e.g., "1 / 10 images")
   - You can see image details (workflow, prompt, date)

**Expected Result**: Your generated images should appear in "My Creations" with Cloudinary URLs.

## ✅ Step 7: Check Cloudinary Dashboard

1. **Go to**: https://console.cloudinary.com/
2. **Navigate to**: Media Library
3. **Check folder**: `klint-studios/[your-user-id]`
4. **Verify**: Your uploaded images appear here

**Expected Result**: You should see your uploaded images in the Cloudinary Media Library.

## ✅ Step 8: Test Image Deletion

1. **Go to**: "My Creations" tab
2. **Click**: Delete button on an image
3. **Confirm**: Delete the image
4. **Verify**: Image is removed from "My Creations"
5. **Check**: Storage count decreases

**Expected Result**: Image should be deleted successfully and storage count should decrease.

## 🐛 Troubleshooting

### Issue: "Cloudinary not initialized"
**Check**:
1. Database settings are saved (Step 2)
2. Upload preset exists (Step 3)
3. App was restarted after configuration

### Issue: "Upload preset not found"
**Check**:
1. Preset name is exactly: `klint-studios-upload`
2. Preset is set to "Unsigned" mode
3. Preset is saved in Cloudinary Dashboard

### Issue: Images not saving
**Check**:
1. Browser console for errors
2. Cloudinary settings in Admin Panel
3. Upload preset in Cloudinary Dashboard
4. Network tab for failed requests

### Issue: "My Creations" is empty
**Check**:
1. Images were generated after Cloudinary setup
2. Browser console for upload errors
3. Database for `user_images` records:
   ```sql
   SELECT * FROM public.user_images ORDER BY created_at DESC LIMIT 10;
   ```

## ✅ Quick Verification Checklist

- [ ] Database migration ran successfully (Step 1)
- [ ] Cloudinary settings in database (Step 2)
- [ ] Upload preset created in Cloudinary (Step 3)
- [ ] Admin Panel shows Cloudinary settings (Step 4)
- [ ] Image generation works (Step 5)
- [ ] Images appear in "My Creations" (Step 6)
- [ ] Images visible in Cloudinary Dashboard (Step 7)
- [ ] Image deletion works (Step 8)

## 🎉 Success Criteria

If all steps pass, your Cloudinary integration is working correctly! You should be able to:
- ✅ Generate images
- ✅ Save images to Cloudinary automatically
- ✅ View images in "My Creations"
- ✅ Delete images
- ✅ See storage usage

