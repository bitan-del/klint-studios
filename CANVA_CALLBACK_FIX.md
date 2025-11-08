# Canva Callback 404 Fix

## ✅ Changes Applied

### 1. Updated `vercel.json`
- Removed complex rewrite rules that might interfere with static file serving
- Added explicit `outputDirectory: "dist"` to ensure Vercel serves the built files correctly
- Vercel will now automatically serve static HTML files from the dist folder

### 2. Enhanced `canva-callback.html`
- Added Tailwind CSS configuration
- Added proper styling to match the app's theme
- Ensured the callback page has all necessary dependencies

### 3. Verified Build Output
- Confirmed `canva-callback.html` is being built correctly in the `dist` folder
- The callback JavaScript bundle is generated correctly

## 🔍 What to Verify

### 1. Canva Developer Portal Configuration

**CRITICAL:** The redirect URI in Canva Developer Portal must match EXACTLY:

```
https://www.klintstudios.com/canva-callback.html
```

**Check:**
- No trailing slash
- No `www` vs non-www mismatch
- Exact match including `.html` extension
- HTTPS (not HTTP)

### 2. Test Callback Route Accessibility

After deployment, test if the callback route is accessible:

1. Open: `https://www.klintstudios.com/canva-callback.html`
2. You should see either:
   - The callback page (even if it shows an error, that's fine - it means the route is accessible)
   - A loading spinner or "Connecting to Canva..." message

If you get a 404, the route isn't being served correctly.

### 3. Deployment Steps

1. **Commit and push:**
   ```bash
   git add vercel.json canva-callback.html
   git commit -m "Fix Canva callback route configuration"
   git push
   ```

2. **Wait for Vercel deployment** to complete

3. **Test the callback route:**
   - Visit: `https://www.klintstudios.com/canva-callback.html`
   - Should load (even if it shows an error initially)

4. **Test OAuth flow:**
   - Go to Admin Panel → Integrations
   - Click "Connect Canva Account"
   - Should redirect to Canva
   - After authorization, should redirect back to callback page
   - Should then redirect to admin panel

## 🐛 Troubleshooting

### Still Getting 404?

1. **Check Canva Developer Portal:**
   - Verify redirect URI is exactly: `https://www.klintstudios.com/canva-callback.html`
   - No typos, no extra characters

2. **Check Vercel Deployment:**
   - Go to Vercel dashboard
   - Check if `canva-callback.html` exists in the deployment
   - Check build logs for any errors

3. **Test Direct Access:**
   - Try accessing: `https://www.klintstudios.com/canva-callback.html?test=1`
   - Should load the callback page

4. **Check Browser Console:**
   - Open browser dev tools
   - Check for any JavaScript errors
   - Check Network tab for failed requests

### Common Issues

**Issue:** "Invalid redirect URI" error from Canva
- **Solution:** Verify the redirect URI in Canva Developer Portal matches exactly

**Issue:** Callback page loads but shows error
- **Solution:** This is normal if OAuth hasn't been initiated. The error should go away when you complete the OAuth flow.

**Issue:** Callback page doesn't load at all
- **Solution:** Check Vercel deployment logs, verify the file exists in dist folder

## 📝 Next Steps

1. Deploy the changes to production
2. Verify the callback route is accessible
3. Update Canva Developer Portal redirect URI if needed
4. Test the complete OAuth flow
5. Submit for review in Canva Developer Portal

## ✅ Success Criteria

- ✅ Callback route is accessible: `https://www.klintstudios.com/canva-callback.html`
- ✅ Canva Developer Portal redirect URI matches exactly
- ✅ OAuth flow completes successfully
- ✅ Access token is saved to database
- ✅ "Canva Connected" status appears in admin panel

Good luck! 🚀

