# Canva OAuth Backend Setup Guide

## ✅ Changes Made

### 1. **Added State Parameter Logging**
- Enhanced `components/auth/CanvaCallback.tsx` with detailed logging
- Logs received state, expected state, and full callback URL
- Helps debug state parameter mismatches

### 2. **Created Supabase Edge Function**
- New function: `supabase/functions/exchange-canva-token/index.ts`
- Handles token exchange server-side to avoid CORS issues
- Uses Basic Authentication as required by Canva API
- Saves tokens to database automatically

### 3. **Updated Token Exchange Service**
- Modified `services/canvaService.ts` to call backend endpoint
- Removed direct browser-based token exchange
- Added better error handling and logging

## 🚀 Deployment Steps

### Step 1: Deploy Supabase Edge Function

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Get your project ref from Supabase dashboard URL: `https://app.supabase.com/project/your-project-ref`)

4. **Deploy the function**:
   ```bash
   supabase functions deploy exchange-canva-token
   ```

### Step 2: Verify Function Deployment

1. Go to Supabase Dashboard → Edge Functions
2. You should see `exchange-canva-token` function listed
3. Check that it's deployed and active

### Step 3: Test the Integration

1. **Clear browser cache** (or use Incognito)
2. Go to your admin panel
3. Click "Connect Canva Account"
4. Complete the OAuth flow
5. Check browser console for logs:
   - State parameter validation
   - Token exchange via backend
   - Success/error messages

## 🔍 Troubleshooting

### Issue: Function Not Found (404)

**Solution:**
- Verify the function is deployed: `supabase functions list`
- Check the function URL matches: `${SUPABASE_URL}/functions/v1/exchange-canva-token`
- Verify Supabase URL in environment variables

### Issue: Unauthorized (401)

**Solution:**
- Check that `VITE_SUPABASE_ANON_KEY` is set correctly
- Verify the anon key is valid in Supabase dashboard
- Check function logs in Supabase dashboard for errors

### Issue: Canva Credentials Not Found

**Solution:**
- Verify `canva_client_id` and `canva_client_secret` are set in `admin_settings` table
- Check database using Supabase SQL Editor:
  ```sql
  SELECT * FROM admin_settings 
  WHERE setting_key IN ('canva_client_id', 'canva_client_secret');
  ```

### Issue: State Parameter Mismatch

**Solution:**
- Check browser console logs for state parameter details
- Verify the state sent in authorization URL matches what's received
- Make sure state is `canva_auth` exactly (case-sensitive)

### Issue: Token Exchange Fails (406)

**Solution:**
- This should be fixed now with backend implementation
- If still happening, check:
  - Function logs in Supabase dashboard
  - Canva API response in function logs
  - Verify Basic Authentication is working correctly

## 📝 Testing Checklist

- [ ] Supabase Edge Function deployed
- [ ] Function appears in Supabase dashboard
- [ ] Canva Client ID and Secret configured in admin settings
- [ ] Test OAuth flow in browser (Incognito recommended)
- [ ] Check browser console for state parameter logs
- [ ] Verify token exchange succeeds
- [ ] Check database for saved tokens
- [ ] Verify "Canva Connected" status appears

## 🔐 Security Notes

- ✅ Client credentials never exposed to browser
- ✅ Token exchange happens server-side
- ✅ Tokens saved securely in database
- ✅ Basic Authentication used as per Canva requirements
- ✅ CORS handled by Supabase Edge Functions

## 📚 References

- [Canva Authentication Docs](https://canva.dev/docs/connect/authentication)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [PKCE Flow](https://oauth.net/2/pkce/)

## ✅ Success Criteria

After deployment, you should be able to:
1. Click "Connect Canva Account"
2. Authorize in Canva
3. See successful token exchange in console
4. See "Canva Connected" status
5. Submit app to Canva (after successful OAuth test)

Good luck! 🚀

