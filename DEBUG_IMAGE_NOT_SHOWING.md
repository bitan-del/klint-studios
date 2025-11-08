# Debug: Image Not Showing in "My Creations"

## 🔍 Step 1: Check Browser Console

1. **Open Browser Console** (F12 → Console tab)
2. **Look for these messages**:
   - ✅ `✅ Image uploaded to Cloudinary: https://...`
   - ✅ `✅ Image saved to Cloudinary`
   - ❌ `⚠️ Failed to save images to Cloudinary: ...`
   - ❌ `❌ Cloudinary upload error: ...`
   - ❌ `Cloudinary not initialized...`

**What to look for:**
- If you see errors, note them down
- If you see success messages, the upload worked but might not be in database

## 🔍 Step 2: Check Database

Run this SQL in Supabase SQL Editor:

```sql
-- Check if images were saved
SELECT 
    ui.id,
    ui.user_id,
    ui.workflow_id,
    ui.prompt,
    ui.cloudinary_url,
    ui.created_at,
    ui.deleted_at,
    up.email,
    up.plan
FROM public.user_images ui
INNER JOIN public.user_profiles up ON ui.user_id = up.id
WHERE ui.deleted_at IS NULL
ORDER BY ui.created_at DESC
LIMIT 10;
```

**Expected Result**: You should see your generated images with Cloudinary URLs

**If no results**: Images weren't saved to database (check Step 3)

## 🔍 Step 3: Check Cloudinary Upload Preset

1. **Go to**: https://console.cloudinary.com/
2. **Navigate to**: Settings → Upload → Upload presets
3. **Verify**: `klint-studios-upload` preset exists
4. **Check**: Preset is set to **"Unsigned"** mode

**If preset doesn't exist**: Create it (see CLOUDINARY_QUICK_SETUP.md)

## 🔍 Step 4: Check Cloudinary Settings in Admin Panel

1. **Go to**: Admin Panel → Integrations tab
2. **Check Cloudinary section**:
   - Cloud Name: `defaekh7f`
   - Upload Preset: `klint-studios-upload`
3. **Click "Save Cloudinary Settings"** to verify

## 🔍 Step 5: Check MyCreations Component

1. **Go to**: "My Creations" tab
2. **Open Browser Console** (F12 → Console)
3. **Look for errors** when loading the page
4. **Check Network tab** (F12 → Network):
   - Look for requests to `user_images` table
   - Check if they're successful (status 200)

## 🐛 Common Issues & Fixes

### Issue 1: "Cloudinary not initialized"
**Fix**:
1. Check Admin Panel → Integrations → Cloudinary settings
2. Make sure settings are saved
3. Restart the app

### Issue 2: "Upload preset not found"
**Fix**:
1. Go to Cloudinary Dashboard
2. Create the upload preset: `klint-studios-upload`
3. Set it to "Unsigned" mode
4. Save

### Issue 3: Images uploaded but not in database
**Fix**:
1. Check browser console for database errors
2. Check Supabase logs for RLS policy issues
3. Verify `user_images` table exists

### Issue 4: Images in database but not showing
**Fix**:
1. Refresh "My Creations" page
2. Check if `deleted_at` is NULL
3. Check if images are filtered out

### Issue 5: Storage limit error
**Fix**:
1. Check storage limits in database
2. Run the fix script: `scripts/fix-storage-limits.sql`

## 🔧 Quick Fixes

### Fix 1: Reload Storage Info
After generating an image, manually refresh "My Creations" page.

### Fix 2: Check RLS Policies
Run this SQL to check if RLS is blocking:

```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'user_images';
```

### Fix 3: Test Upload Manually
Try generating another image and watch the console for errors.

## 📋 Debugging Checklist

- [ ] Browser console shows no errors
- [ ] Cloudinary upload preset exists
- [ ] Cloudinary settings saved in Admin Panel
- [ ] Database query returns images
- [ ] Images have valid Cloudinary URLs
- [ ] `deleted_at` is NULL for images
- [ ] RLS policies allow user to see their images
- [ ] MyCreations component loads without errors

## 🚀 Next Steps

1. **Check browser console** first (most important)
2. **Check database** to see if images were saved
3. **Check Cloudinary Dashboard** to see if images were uploaded
4. **Share the errors** you find so we can fix them

