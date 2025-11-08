# Quick Fix for Cloudinary "Context invalid type" Error

## The Issue
The error happens because the upload preset in Cloudinary has invalid context settings.

## ✅ Solution: Update Upload Preset in Cloudinary

### Step 1: Go to Cloudinary Dashboard
1. Open: https://console.cloudinary.com/
2. Go to: **Settings** → **Upload** → **Upload presets**
3. Find: `klint-studios-upload` preset

### Step 2: Edit the Preset
1. **Click** on the preset name
2. **Scroll down** to find these sections:
   - **Context** section
   - **Tags** section
   - **Moderation** section

### Step 3: Remove/Reset Context Settings
1. **Context section**: 
   - Remove ALL context keys/values
   - Or leave completely empty
2. **Tags section**: 
   - Leave empty (or use simple tags like "klint-studios")
3. **Moderation section**: 
   - Leave as default

### Step 4: Save and Test
1. **Click "Save"**
2. **Refresh your app** (hard refresh: `Cmd+Shift+R`)
3. **Generate an image**
4. **Should work now!**

## 🆕 Alternative: Create a New Minimal Preset

If editing doesn't work, create a NEW preset:

1. **Click "Add upload preset"**
2. **Name**: `klint-studios-minimal`
3. **Signing mode**: **Unsigned**
4. **Leave everything else EMPTY/DEFAULT**
5. **Save**
6. **Update in Admin Panel**:
   - Go to Admin Panel → Integrations → Cloudinary
   - Change "Upload Preset" to: `klint-studios-minimal`
   - Click "Save Cloudinary Settings"
7. **Refresh app and test**

## 🎯 Why This Works

The error "Context invalid type" means Cloudinary's preset has context settings with invalid values. By removing them or creating a minimal preset, we avoid the error.

## ✅ After Fix

You should see:
- `✅ Image uploaded to Cloudinary`
- `✅ Image saved to Cloudinary`
- Images appear in "My Creations"

