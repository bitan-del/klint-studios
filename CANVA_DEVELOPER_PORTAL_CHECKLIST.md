# Canva Developer Portal Configuration Checklist

If you're experiencing "Code verifier not found" errors, please verify these settings in your Canva Developer Portal:

## 🔍 Step-by-Step Checklist

### 1. **Access Canva Developer Portal**
- Go to: https://developers.canva.com/apps
- Sign in with your Canva account
- Select your app

### 2. **Verify Redirect URI Configuration**
- Navigate to: **Settings** → **Redirect URIs**
- Ensure this EXACT URL is listed (no trailing slash, exact match):
  ```
  https://www.klintstudios.com/canva-callback.html
  ```
- **IMPORTANT**: This must be set as **URL 1** (the default/first redirect URI)
- If you have multiple redirect URIs, move this one to the top
- Click **Save** after making changes
- **Wait 2-3 minutes** for changes to propagate

### 3. **Verify App Status**
- Go to: **Settings** → **App Status**
- Ensure your app is **NOT** in "Restricted" status
- If restricted, you may need to submit for review or contact Canva support

### 4. **Verify OAuth Settings**
- Go to: **Settings** → **OAuth**
- Ensure **PKCE** is enabled (should be by default)
- Verify **Authorization Code** flow is selected
- Check that all required scopes are enabled

### 5. **Verify Client ID and Secret**
- Go to: **Settings** → **Credentials**
- Copy your **Client ID** and **Client Secret**
- Verify they match what's saved in your Admin Panel:
  - Go to: `https://www.klintstudios.com/#admin?tab=integrations`
  - Check the Canva Client ID and Secret fields
  - They must match EXACTLY (no extra spaces, no quotes)

### 6. **Check App Permissions**
- Go to: **Settings** → **Permissions**
- Ensure all required permissions are granted:
  - `design:read`
  - `design:write`
  - `asset:read`
  - `asset:write`
  - `design:content:read`
  - `design:content:write`
  - `design:meta:read`
  - `design:permission:read`
  - `design:permission:write`
  - `folder:read`
  - `folder:write`
  - `folder:permission:read`
  - `folder:permission:write`

### 7. **Test the OAuth Flow**
After making any changes:
1. **Wait 2-3 minutes** for changes to propagate
2. Clear your browser cache and cookies
3. Go to: `https://www.klintstudios.com/#admin?tab=integrations`
4. Click "Connect Canva Account"
5. Check browser console (F12) for any errors
6. Complete the OAuth flow

## 🐛 Common Issues

### Issue: "Invalid redirect URI"
**Solution**: 
- Verify the redirect URI in Canva Developer Portal matches EXACTLY: `https://www.klintstudios.com/canva-callback.html`
- No `http://`, no trailing slash, exact match
- Make sure it's URL 1 (first in the list)

### Issue: "State parameter not returned"
**Solution**: 
- This is normal - Canva may not return the state parameter
- The code now uses cookies and multiple storage methods as fallback
- This should not block the OAuth flow

### Issue: "Code verifier not found"
**Solution**: 
- Clear browser cache and cookies
- Try in an incognito/private window
- Check browser console for storage errors
- Verify cookies are enabled in your browser

### Issue: "403 Forbidden" during token exchange
**Solution**:
- Verify Client ID and Secret are correct
- Check that redirect URI matches exactly
- Ensure app is not in restricted status
- Wait a few minutes after making changes

## 📞 Still Having Issues?

If you've checked all of the above and still have issues:

1. **Check Browser Console**: Look for specific error messages
2. **Check Supabase Edge Function Logs**: 
   - Go to: https://supabase.com/dashboard/project/qayasxoiikjmkuuaphwd/functions
   - Click on `exchange-canva-token`
   - Check the logs for errors

3. **Verify Environment Variables**:
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly
   - Check in Vercel dashboard → Settings → Environment Variables

4. **Contact Support**:
   - Canva Developer Support: https://www.canva.com/developers/support/
   - Check Canva API documentation: https://canva.dev/docs/

## ✅ Success Indicators

When everything is working correctly, you should see:
- ✅ "Code verifier found in COOKIE" in console
- ✅ Successful token exchange
- ✅ "Canva Connected" status in admin panel
- ✅ No 406 or 403 errors

