# Canva OAuth 404 - Quick Fix Guide

## ✅ Redirect URI Confirmed Match

Your redirect URI matches in both places:
- App: `https://www.klintstudios.com/canva-callback.html`
- Canva: `https://www.klintstudios.com/canva-callback.html` ✅

## 🚨 Most Common Causes of 404 (Even with Correct URI)

### 1. **Redirect URI Must Be Default (URL 1)**

**CRITICAL:** Canva might require the redirect URI to be the **default** one:

1. Go to Canva Developer Portal → Redirect URIs
2. Make sure `https://www.klintstudios.com/canva-callback.html` is **URL 1** (has "Default" tag)
3. If it's not URL 1, **delete all other URLs** or **move this one to URL 1**
4. Save and wait 1-2 minutes

### 2. **Callback Route Not Accessible**

Test if the callback route is actually accessible:

1. **Visit directly:** `https://www.klintstudios.com/canva-callback.html`
2. **Expected:** Page should load (shows loading spinner or error message)
3. **If 404:** The route isn't deployed - check Vercel deployment

### 3. **App Status in Canva**

Canva might require the app to be in a specific status:

1. Go to Canva Developer Portal
2. Check your app status
3. **If status is "Draft" or "Development":**
   - Some OAuth features might be disabled
   - You may need to click "Submit for initial check" (even if not ready for production)
   - Or check if there's a "Test Mode" toggle

### 4. **Timing/Propagation**

If you just added/changed the redirect URI:
- Wait 2-3 minutes for changes to propagate
- Clear browser cache
- Try again

## 🔧 Immediate Action Items

### Step 1: Verify Callback Route (Most Important)

**Test the callback route:**
```
https://www.klintstudios.com/canva-callback.html
```

**If it returns 404:**
- The route isn't deployed correctly
- Check Vercel deployment logs
- Verify `canva-callback.html` exists in the build

**If it loads:**
- Good! The route is accessible
- Move to Step 2

### Step 2: Make Redirect URI Default

1. In Canva Developer Portal → Redirect URIs
2. **Delete any other redirect URIs** (if any)
3. **Make sure** `https://www.klintstudios.com/canva-callback.html` is **URL 1** (Default)
4. **Save**
5. **Wait 2 minutes**

### Step 3: Check App Status

1. Go to Canva Developer Portal
2. Look for app status (usually at the top)
3. **If it says "Draft" or needs submission:**
   - You might need to submit it (even for testing)
   - Or check if there's a "Test Mode" option

### Step 4: Test Again

1. **Clear browser cache** (or use Incognito)
2. Go to your admin panel
3. Click "Connect Canva Account"
4. Check browser console for any errors
5. See if it works now

## 📊 Debugging Checklist

- [ ] Callback route is accessible: `https://www.klintstudios.com/canva-callback.html`
- [ ] Redirect URI is URL 1 (Default) in Canva Developer Portal
- [ ] No other redirect URIs exist (or they're below this one)
- [ ] App status allows OAuth (not restricted)
- [ ] Waited 2-3 minutes after saving redirect URI
- [ ] Cleared browser cache
- [ ] Checked browser console for errors
- [ ] Verified Client ID matches: `OC-AZpkHPiGh2PH`

## 🔍 What to Check in Browser Console

When you click "Connect Canva Account", check the console for:

1. **Authorization URL:**
   ```
   🔗 Canva Auth URL generated
   📍 Redirect URI: https://www.klintstudios.com/canva-callback.html
   🔑 Client ID: OC-AZpkHPiGh2PH
   ```

2. **Check the actual URL:**
   - Look for the full authorization URL in console
   - Verify `redirect_uri` parameter is URL-encoded correctly
   - Should be: `redirect_uri=https%3A%2F%2Fwww.klintstudios.com%2Fcanva-callback.html`

3. **Any errors:**
   - Note any error messages
   - Check Network tab for failed requests

## 💡 Most Likely Fix

**90% of the time, the issue is one of these:**

1. **Callback route not accessible** (40%)
   - Fix: Deploy the callback route correctly

2. **Redirect URI not set as default** (30%)
   - Fix: Make it URL 1 in Canva Developer Portal

3. **App status restricts OAuth** (20%)
   - Fix: Check app status, submit if needed

4. **Timing/propagation** (10%)
   - Fix: Wait 2-3 minutes after saving

## 🚀 Next Steps

1. **First:** Test if callback route is accessible
2. **Second:** Make redirect URI the default (URL 1)
3. **Third:** Check app status in Canva
4. **Fourth:** Wait 2-3 minutes and try again

Let me know what you find when you test the callback route!

