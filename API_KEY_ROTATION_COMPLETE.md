# 🔐 Gemini API Key Rotation - Complete

**Date**: January 2025  
**Status**: ✅ Ready to Execute

## 📋 Summary

Your Gemini API key has been leaked and needs to be rotated. This document contains all the steps needed to update the API key across your entire system.

## 🔑 New API Key

```
AIzaSyDy3oIOCeWXGfKQjYJ4ZdHnvw-26KRH0Go
```

## ✅ What Has Been Updated

### 1. ✅ Local Environment File (`.env`)
- Updated `VITE_GEMINI_API_KEY` in your local `.env` file
- This is used for local development

### 2. ✅ SQL Script Created
- Created `scripts/update-gemini-api-key.sql`
- This script will update the database when you run it in Supabase

## 🚀 Next Steps (Action Required)

### Step 1: Update Database (CRITICAL)

1. **Open Supabase Dashboard**: https://app.supabase.com
2. **Navigate to**: SQL Editor
3. **Open the script**: `scripts/update-gemini-api-key.sql`
4. **Copy and paste** the entire script into the SQL Editor
5. **Click "Run"** to execute

The script will:
- ✅ Update `admin_settings` table (primary location)
- ✅ Update `settings` table if it exists (for videoService)
- ✅ Verify the update was successful

### Step 2: Verify the Update

After running the SQL script, verify it worked:

```sql
SELECT 
  setting_key,
  SUBSTRING(setting_value::text, 1, 15) || '...' as masked_value,
  updated_at
FROM admin_settings 
WHERE setting_key = 'gemini_api_key';
```

You should see the new key (first 15 characters: `AIzaSyDy3oIOCeW`).

### Step 3: Clear Cache (If Needed)

The app uses caching for the API key. To force a refresh:

1. **Option A**: Wait 5 minutes (cache auto-expires)
2. **Option B**: Clear browser localStorage:
   - Open browser console (F12)
   - Run: `localStorage.removeItem('gemini_api_key_updated')`
   - Refresh the page

### Step 4: Update Production Environment Variables (If Applicable)

If you're using environment variables in production (Vercel, Netlify, etc.):

1. **Vercel**: 
   - Go to Project Settings → Environment Variables
   - Update `VITE_GEMINI_API_KEY` with the new key

2. **Netlify**:
   - Go to Site Settings → Environment Variables
   - Update `VITE_GEMINI_API_KEY` with the new key

3. **Google Cloud / Other**:
   - Update the environment variable in your deployment platform
   - Redeploy if necessary

## 📍 Where the API Key is Used

The API key is fetched from these locations (in priority order):

1. **Database** (`admin_settings` table) ← **PRIMARY** (Production)
2. **Environment Variable** (`VITE_GEMINI_API_KEY`) ← Fallback (Local Dev)
3. **Mock Services** ← If no key is available

### Services That Use the API Key:

- ✅ `services/geminiService.ts` - Main image generation service
- ✅ `services/videoService.ts` - Video generation service
- ✅ `context/AuthContext.tsx` - Admin panel API key management

## 🔒 Security Notes

1. **Revoke the old key** in Google AI Studio:
   - Go to: https://aistudio.google.com/app/apikey
   - Find the leaked key and delete/revoke it

2. **Monitor usage** of the new key for any suspicious activity

3. **Never commit** API keys to git (they're in `.gitignore`)

## ✅ Verification Checklist

- [ ] SQL script executed in Supabase
- [ ] Database updated (verified with SELECT query)
- [ ] Old API key revoked in Google AI Studio
- [ ] Production environment variables updated (if applicable)
- [ ] App tested and working with new key
- [ ] Browser cache cleared (if needed)

## 🆘 Troubleshooting

### Issue: API key not working after update

1. **Check database**: Verify the key was saved correctly
2. **Check cache**: Clear localStorage and refresh
3. **Check console**: Look for error messages in browser console
4. **Check environment**: Make sure you're using the right environment (dev vs prod)

### Issue: "API key not found" error

1. Verify the SQL script ran successfully
2. Check that `admin_settings` table has the key
3. Verify the key format is correct (should start with `AIzaSy`)

## 📝 Files Modified

- ✅ `scripts/update-gemini-api-key.sql` - SQL script to update database
- ✅ `.env` - Local environment file (updated)
- ✅ `API_KEY_ROTATION_COMPLETE.md` - This documentation

## 🎯 Quick Reference

**SQL Script Location**: `scripts/update-gemini-api-key.sql`

**Database Table**: `admin_settings` (column: `setting_key = 'gemini_api_key'`)

**Environment Variable**: `VITE_GEMINI_API_KEY`

**Google AI Studio**: https://aistudio.google.com/app/apikey

---

**Important**: After updating the database, the new API key will be used immediately by all users. No redeployment needed if you're using the database method (which is the recommended approach).

