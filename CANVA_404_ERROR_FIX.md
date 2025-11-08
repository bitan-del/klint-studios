# Canva 404 Error Fix Guide

## 🔍 Understanding the Error

The Canva 404 error occurs when Canva cannot find the redirect URI you've configured. This happens during Step 2 of the OAuth flow (code challenge generation) but is usually caused by a redirect URI mismatch.

## ✅ Step-by-Step Fix

### 1. **Verify Redirect URI in Canva Developer Portal**

**CRITICAL:** The redirect URI must match EXACTLY (case-sensitive, no trailing slashes):

1. Go to [Canva Developer Portal](https://www.canva.dev/)
2. Navigate to your app: **OC-AZpkHPiGh2PH**
3. Go to **Settings** → **Redirect URIs**
4. **Verify the redirect URI is exactly:**
   ```
   https://www.klintstudios.com/canva-callback.html
   ```

**Check:**
- ✅ No trailing slash
- ✅ Uses `https://` (not `http://`)
- ✅ Includes `www.` subdomain
- ✅ Exact path: `/canva-callback.html`
- ✅ No extra spaces or characters

### 2. **Verify the Redirect URI is Saved**

1. In Canva Developer Portal, check if the redirect URI is **saved** (not just displayed)
2. Click **Save** if you made any changes
3. Wait a few seconds for changes to propagate

### 3. **Test the Callback Route**

Before testing OAuth, verify the callback route is accessible:

1. Visit: `https://www.klintstudios.com/canva-callback.html`
2. **Expected:** The page should load (even if it shows an error without OAuth code)
3. **If 404:** The route isn't deployed correctly - check Vercel deployment

### 4. **Check Browser Console**

When you click "Connect Canva Account", check the browser console (F12):

**You should see:**
```
🔐 PKCE Code Verifier generated and stored
🔐 Code Challenge: [first 20 chars]...
🔗 Canva Auth URL generated
📍 Redirect URI: https://www.klintstudios.com/canva-callback.html
🔑 Client ID: OC-AZpkHPiGh2PH
✅ Code Challenge Method: S256
🔗 Full Auth URL: [full URL]
```

**If you see errors:**
- "Canva Client ID not configured" → Set Client ID in Admin Panel
- "Failed to generate code challenge" → PKCE generation failed (shouldn't happen)
- Any other error → Check the error message

### 5. **Verify the Authorization URL**

When you click "Connect Canva Account", the URL should:
- ✅ Include `code_challenge` parameter (not `<CODE_CHALLENGE>`)
- ✅ Include `code_challenge_method=S256`
- ✅ Include `redirect_uri=https%3A%2F%2Fwww.klintstudios.com%2Fcanva-callback.html`
- ✅ Include `client_id=OC-AZpkHPiGh2PH`

**Example of correct URL:**
```
https://www.canva.com/api/oauth/authorize?
  code_challenge_method=s256
  &response_type=code
  &client_id=OC-AZpkHPiGh2PH
  &redirect_uri=https%3A%2F%2Fwww.klintstudios.com%2Fcanva-callback.html
  &scope=[scopes]
  &code_challenge=[actual_challenge_string]
  &state=canva_auth
```

### 6. **Common Issues and Fixes**

#### Issue: "Invalid redirect URI" error
**Cause:** Redirect URI doesn't match what's in Canva Developer Portal
**Fix:** 
1. Copy the exact redirect URI from Canva Developer Portal
2. Verify it matches: `https://www.klintstudios.com/canva-callback.html`
3. Make sure it's saved in Canva Developer Portal

#### Issue: 404 error from Canva
**Cause:** Redirect URI not registered in Canva Developer Portal
**Fix:**
1. Go to Canva Developer Portal
2. Add the redirect URI: `https://www.klintstudios.com/canva-callback.html`
3. Save and wait a few seconds
4. Try again

#### Issue: Code challenge not generating
**Cause:** Browser crypto API not available
**Fix:**
1. Make sure you're using HTTPS (or localhost for testing)
2. Check browser console for crypto errors
3. Try a different browser

#### Issue: Callback route not accessible
**Cause:** Route not deployed or Vercel routing issue
**Fix:**
1. Check Vercel deployment logs
2. Verify `canva-callback.html` exists in deployment
3. Test direct access: `https://www.klintstudios.com/canva-callback.html`

## 🔧 Code Changes Made

I've added:
1. ✅ Automatic initialization of Canva credentials
2. ✅ Code challenge validation
3. ✅ Better error messages
4. ✅ Console logging for debugging
5. ✅ Verification that Client ID is configured

## 📝 Testing Checklist

Before testing OAuth:
- [ ] Redirect URI saved in Canva Developer Portal
- [ ] Callback route accessible: `https://www.klintstudios.com/canva-callback.html`
- [ ] Client ID and Secret configured in Admin Panel
- [ ] Browser console shows no errors
- [ ] Authorization URL includes `code_challenge` (not `<CODE_CHALLENGE>`)

## 🚀 Next Steps

1. **Verify Canva Developer Portal settings** (most important!)
2. **Test the callback route** is accessible
3. **Check browser console** when clicking "Connect Canva Account"
4. **Try the OAuth flow** again
5. **Check for any errors** in the console or Canva's response

## 📞 Still Having Issues?

If you're still getting a 404 error:
1. **Double-check the redirect URI** in Canva Developer Portal matches exactly
2. **Check the browser console** for the actual authorization URL being generated
3. **Verify the callback route** is accessible on your site
4. **Check Vercel deployment logs** for any routing issues

The most common cause is a **redirect URI mismatch** - make sure it's exactly `https://www.klintstudios.com/canva-callback.html` in both places!

