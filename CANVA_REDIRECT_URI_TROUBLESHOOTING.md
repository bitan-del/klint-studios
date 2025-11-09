# Canva Redirect URI Troubleshooting

## ✅ Confirmed: Redirect URI Matches

The redirect URI in your app matches Canva Developer Portal:
- **App:** `https://www.klintstudios.com/canva-callback.html`
- **Canva:** `https://www.klintstudios.com/canva-callback.html` ✅

## 🔍 Additional Checks Needed

Since the redirect URI matches, the 404 error might be due to:

### 1. **Canva App Status**

Canva might require the app to be in a certain status before OAuth works:

1. Go to [Canva Developer Portal](https://www.canva.dev/)
2. Check your app status
3. **If app is in "Development" or "Draft" mode:**
   - Some OAuth features might be restricted
   - You may need to submit for review (even for testing)
   - Check if there's a "Test Mode" or "Development Mode" toggle

### 2. **Redirect URI Must Be Default**

The redirect URI might need to be set as the **default** redirect URI:

1. In Canva Developer Portal → Redirect URIs
2. Make sure `https://www.klintstudios.com/canva-callback.html` is **URL 1** (the default)
3. If it's not the default, try making it the default

### 3. **Callback Route Must Be Accessible**

Canva might verify that the redirect URI is accessible before allowing OAuth:

1. **Test the callback route directly:**
   - Visit: `https://www.klintstudios.com/canva-callback.html`
   - **Expected:** Page loads (even if it shows an error)
   - **If 404:** The route isn't deployed correctly

2. **Check Vercel deployment:**
   - Go to Vercel dashboard
   - Verify the latest deployment includes `canva-callback.html`
   - Check if the file exists in the deployment

### 4. **URL Encoding Issues**

Verify the redirect URI is properly encoded in the authorization URL:

1. Open browser console (F12)
2. Click "Connect Canva Account"
3. Check the console logs for the authorization URL
4. Look for `redirect_uri` parameter - it should be URL-encoded as:
   ```
   redirect_uri=https%3A%2F%2Fwww.klintstudios.com%2Fcanva-callback.html
   ```

### 5. **Wait for Propagation**

If you just added the redirect URI:
- Wait 1-2 minutes for changes to propagate
- Try again after waiting

### 6. **Check Canva App Permissions**

Verify your app has the correct permissions:
1. Go to Canva Developer Portal → Permissions
2. Make sure all required permissions are granted
3. Check if there are any permission-related errors

### 7. **Try Removing and Re-adding Redirect URI**

Sometimes removing and re-adding helps:
1. Remove the redirect URI from Canva Developer Portal
2. Save
3. Wait 30 seconds
4. Add it back: `https://www.klintstudios.com/canva-callback.html`
5. Save
6. Wait 1-2 minutes
7. Try OAuth again

## 🔧 Debugging Steps

### Step 1: Verify Callback Route is Accessible

```bash
# Test if the callback route is accessible
curl -I https://www.klintstudios.com/canva-callback.html
```

**Expected:** HTTP 200 OK
**If 404:** The route isn't deployed correctly

### Step 2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Connect Canva Account"
4. Look for:
   - Authorization URL being generated
   - Any errors
   - The actual `redirect_uri` value in the URL

### Step 3: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Connect Canva Account"
4. Look for the request to `canva.com/api/oauth/authorize`
5. Check the request URL and parameters
6. Check the response (should redirect, not 404)

### Step 4: Verify Authorization URL

The authorization URL should look like:
```
https://www.canva.com/api/oauth/authorize?
  code_challenge_method=s256
  &response_type=code
  &client_id=OC-AZpkHPiGh2PH
  &redirect_uri=https%3A%2F%2Fwww.klintstudios.com%2Fcanva-callback.html
  &scope=[scopes]
  &code_challenge=[actual_challenge]
  &state=canva_auth
```

**Check:**
- ✅ `redirect_uri` is URL-encoded correctly
- ✅ `redirect_uri` matches exactly what's in Canva Developer Portal
- ✅ `code_challenge` has a real value (not `<CODE_CHALLENGE>`)
- ✅ All parameters are present

## 🚨 Common Issues

### Issue: "App not found" or "Invalid client"
**Cause:** Client ID mismatch
**Fix:** Verify Client ID in Admin Panel matches Canva Developer Portal

### Issue: "Redirect URI mismatch"
**Cause:** Redirect URI doesn't match exactly
**Fix:** Double-check both places match exactly (case-sensitive)

### Issue: "App not authorized"
**Cause:** App needs to be submitted for review
**Fix:** Check app status in Canva Developer Portal

### Issue: Callback route returns 404
**Cause:** Route not deployed correctly
**Fix:** Check Vercel deployment, verify file exists

## 📝 Next Steps

1. **Test callback route accessibility:**
   - Visit: `https://www.klintstudios.com/canva-callback.html`
   - Should load (even if it shows an error)

2. **Check browser console:**
   - Look for the authorization URL
   - Verify `redirect_uri` parameter

3. **Verify Canva app status:**
   - Check if app needs to be submitted
   - Check if there are any restrictions

4. **Try the troubleshooting steps above:**
   - Make redirect URI the default
   - Remove and re-add redirect URI
   - Wait for propagation

## 💡 Most Likely Solutions

Based on the 404 error, the most likely issues are:

1. **Callback route not accessible on production** (most likely)
   - Fix: Verify the route is deployed and accessible

2. **Redirect URI not set as default** (common)
   - Fix: Make it URL 1 (default) in Canva Developer Portal

3. **App needs to be submitted for review** (sometimes required)
   - Fix: Check app status and submit if needed

4. **Timing/propagation issue** (if just added)
   - Fix: Wait 1-2 minutes and try again

Try these in order and let me know what you find!

