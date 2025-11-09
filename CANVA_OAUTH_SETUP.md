# Canva OAuth Setup Guide

## ✅ Setup Complete!

All code changes have been implemented. Here's what you need to do:

## 🔧 Configuration Steps

### 1. Update Canva Developer Portal

1. Go to [Canva Developer Portal](https://www.canva.dev/)
2. Navigate to your app's settings
3. **Add Redirect URI:**
   - `https://www.klintstudios.com/canva-callback.html`
   - ⚠️ **Important:** Canva does NOT accept localhost URLs
   - You must use your production domain

### 2. Deploy to Production

Before testing, make sure your latest code is deployed to production:

```bash
git add .
git commit -m "Add Canva OAuth integration"
git push
```

Vercel will automatically deploy. Wait for deployment to complete.

### 3. Test the OAuth Flow

1. **Go to your production site:** `https://www.klintstudios.com`
2. **Navigate to Admin Panel:** Click on Admin → Integrations tab
3. **Enter Canva Credentials:**
   - Client ID: `OC-AZpkHPiGh2PH`
   - Client Secret: (your secret)
   - Click "Save Canva Settings"
4. **Connect Canva Account:**
   - Click "Connect Canva Account" button
   - You'll be redirected to Canva to authorize
   - After authorization, you'll be redirected back
   - You should see "Canva Connected" status

### 4. Verify Connection

After successful connection:
- ✅ Access token will be saved to database
- ✅ "Canva Connected" status will appear
- ✅ Users can now use "Edit in Canva" button in "My Creations"

### 5. Submit for Review (After Testing)

Once you've successfully tested the OAuth flow:
1. Go back to Canva Developer Portal
2. The "Submit for initial check" button should now be enabled
3. Complete the submission checklist
4. Submit for review

## 📋 Files Created/Modified

### New Files:
- `components/auth/CanvaCallback.tsx` - OAuth callback handler
- `canva-callback.html` - Callback page entry point
- `canva-callback.tsx` - Callback page renderer

### Modified Files:
- `services/canvaService.ts` - Added PKCE support
- `App.tsx` - Added "Connect Canva Account" button
- `vite.config.ts` - Added callback route to build config

## 🔍 How It Works

1. **User clicks "Connect Canva Account"**
   - Generates PKCE code challenge
   - Redirects to Canva OAuth page

2. **User authorizes on Canva**
   - Canva redirects back to: `https://www.klintstudios.com/canva-callback.html?code=...`

3. **Callback handler**
   - Exchanges authorization code for access token
   - Saves tokens to database
   - Redirects back to admin panel

4. **Success!**
   - Access token is stored
   - "Edit in Canva" feature is now available

## 🚨 Important Notes

- **Production URL Required:** Canva OAuth only works with production URLs (not localhost)
- **Redirect URI Must Match:** The redirect URI in Canva Developer Portal must exactly match: `https://www.klintstudios.com/canva-callback.html`
- **HTTPS Required:** Canva requires HTTPS for OAuth callbacks
- **Test on Production:** You must test the OAuth flow on your production site

## 🐛 Troubleshooting

### "Invalid redirect URI" error
- Make sure the redirect URI in Canva Developer Portal matches exactly: `https://www.klintstudios.com/canva-callback.html`
- Check that your site is deployed and accessible

### "Code verifier not found" error
- This happens if the OAuth flow is interrupted
- Try connecting again from the admin panel

### Connection not saving
- Check browser console for errors
- Verify database connection
- Check that `canva_access_token` is being saved to database

## ✅ Next Steps

1. Deploy to production
2. Configure redirect URI in Canva Developer Portal
3. Test OAuth flow on production
4. Submit for review in Canva Developer Portal

Good luck! 🚀

