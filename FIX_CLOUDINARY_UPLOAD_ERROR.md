# Fix: "Context invalid type, must be a string" Error

## The Problem
The error "Context invalid type, must be a string" is coming from Cloudinary's API, not our code. This usually means:
1. The upload preset has invalid context settings
2. We're sending something Cloudinary doesn't like
3. The folder parameter conflicts with the preset

## ✅ Fix Applied
I've simplified the upload to send ONLY:
- File
- Upload Preset

No folder, no context, no metadata - just the bare minimum.

## 🔧 Check Your Upload Preset in Cloudinary

1. **Go to**: https://console.cloudinary.com/
2. **Navigate to**: Settings → Upload → Upload presets
3. **Click on**: `klint-studios-upload` preset
4. **Check these settings**:

### ✅ Required Settings:
- **Preset name**: `klint-studios-upload`
- **Signing mode**: **Unsigned** (important!)
- **Folder**: Leave empty or set to `klint-studios` (optional)

### ❌ Remove These (if present):
- **Context**: Remove ALL context settings
- **Tags**: Leave empty (or use simple tags only)
- **Moderation**: Leave as default
- **Access Control**: Leave as default

### ✅ Recommended Settings:
- **Format**: `auto` or `webp`
- **Quality**: `auto`
- **Transformation**: Leave empty (or use simple transformations)

## 🔄 Alternative: Create a New Upload Preset

If the current preset has issues, create a NEW one:

1. **Go to**: Cloudinary Dashboard → Settings → Upload
2. **Click**: "Add upload preset"
3. **Configure**:
   - **Name**: `klint-studios-simple` (or any name)
   - **Signing mode**: **Unsigned**
   - **Folder**: `klint-studios` (optional)
   - **Everything else**: Leave as default/empty
4. **Save**
5. **Update in Admin Panel**:
   - Go to Admin Panel → Integrations → Cloudinary
   - Change "Upload Preset" to your new preset name
   - Click "Save Cloudinary Settings"

## 🧪 Test the Fix

1. **Refresh browser** (hard refresh: `Cmd+Shift+R`)
2. **Generate an image**
3. **Check console** for:
   - `✅ Image uploaded to Cloudinary`
   - `✅ Image saved to Cloudinary`

## 📋 Debug Steps

If it still fails:

1. **Check browser console** (F12 → Console)
2. **Look for**: `📤 Uploading to Cloudinary:` log
3. **Check the error details** - it should show the exact error from Cloudinary
4. **Verify upload preset** exists and is set to "Unsigned"
5. **Try creating a new preset** with minimal settings

## 🎯 Most Likely Cause

The upload preset in Cloudinary has context settings that are causing the error. Either:
1. Remove context from the preset, OR
2. Create a new minimal preset without any context

## ✅ Quick Fix

1. Go to Cloudinary Dashboard
2. Edit the `klint-studios-upload` preset
3. Remove ALL context/metadata settings
4. Save
5. Refresh your app
6. Try uploading again

