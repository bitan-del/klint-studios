# Debug: Why It Works on Localhost But Not Production

## Most Common Issues

### 1. ⚠️ Missing GOOGLE_SERVICE_ACCOUNT_JSON Secret (MOST LIKELY)

**Check:**
1. Go to: https://supabase.com/dashboard/project/qayasxoiikjmkuuaphwd/functions/vertex-ai/secrets
2. Verify `GOOGLE_SERVICE_ACCOUNT_JSON` exists
3. Check if the value is correct (full JSON content)

**Fix:**
1. Go to Supabase Dashboard → Edge Functions → vertex-ai → Secrets
2. If missing, click "Add new secret"
3. Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
4. Value: Paste the **entire contents** of your Google Cloud service account JSON file
5. Click "Save"

### 2. ⚠️ Different Database Configuration

**Check:**
1. Go to your production Supabase Dashboard
2. SQL Editor → Run:
```sql
SELECT setting_key, setting_value 
FROM admin_settings 
WHERE setting_key IN ('vertex_project_id', 'vertex_location');
```

**Compare with localhost:**
- Are the values the same?
- Is `vertex_project_id` set correctly?
- Is `vertex_location` set correctly?

### 3. ⚠️ Different Supabase URL

**Check Frontend:**
- Localhost uses: `http://localhost:54321` (local Supabase)
- Production uses: `https://qayasxoiikjmkuuaphwd.supabase.co`

**Verify:**
1. Check your production `.env` or environment variables
2. Ensure `VITE_SUPABASE_URL` is set to production URL
3. The Edge Function should be at: `https://qayasxoiikjmkuuaphwd.supabase.co/functions/v1/vertex-ai`

### 4. ⚠️ Check Supabase Edge Function Logs

**Steps:**
1. Go to: https://supabase.com/dashboard/project/qayasxoiikjmkuuaphwd/functions/vertex-ai/logs
2. Try generating an image on production
3. Check the logs for:
   - `🔑 Getting access token...`
   - `✅ GOOGLE_SERVICE_ACCOUNT_JSON secret found`
   - `❌ GOOGLE_SERVICE_ACCOUNT_JSON secret is not set!`
   - `🔧 Getting Vertex AI client configuration...`
   - `📋 Configuration: { projectId: ..., location: ... }`

**What to look for:**
- If you see "secret is not set" → Secret is missing
- If you see "Error parsing service account JSON" → Secret is invalid
- If you see "project ID not configured" → Database config is missing

## Quick Diagnostic

Run this in Supabase SQL Editor to check configuration:

```sql
-- Check Vertex AI configuration
SELECT 
  setting_key,
  CASE 
    WHEN setting_key = 'vertex_project_id' THEN LEFT(setting_value, 20) || '...'
    ELSE setting_value
  END as setting_value_preview,
  LENGTH(setting_value) as value_length
FROM admin_settings 
WHERE setting_key IN ('vertex_project_id', 'vertex_location');
```

## Step-by-Step Fix

### Step 1: Verify Edge Function Secrets

1. Go to: https://supabase.com/dashboard/project/qayasxoiikjmkuuaphwd/functions/vertex-ai/secrets
2. You should see:
   - ✅ `GOOGLE_SERVICE_ACCOUNT_JSON` (should exist)
   - ✅ `SUPABASE_URL` (auto-set)
   - ✅ `SUPABASE_SERVICE_ROLE_KEY` (auto-set)

**If `GOOGLE_SERVICE_ACCOUNT_JSON` is missing:**
1. Get your Google Cloud service account JSON file
2. Copy the **entire contents**
3. Add as secret: `GOOGLE_SERVICE_ACCOUNT_JSON`
4. Paste the full JSON
5. Save

### Step 2: Check Database Configuration

1. Go to your production app
2. Log in as admin
3. Go to Admin Panel → Integrations
4. Verify:
   - **Project ID**: Should match your Google Cloud project
   - **Location**: Should be `us-central1` (or your region)

### Step 3: Check Edge Function Logs

1. Generate an image on production
2. Immediately check: https://supabase.com/dashboard/project/qayasxoiikjmkuuaphwd/functions/vertex-ai/logs
3. Look for error messages

### Step 4: Compare with Localhost

**On localhost, check:**
- What URL is being called? (Check browser Network tab)
- What's in your local `.env` file?
- What's in your local Supabase (if using local Supabase)?

**On production, check:**
- What URL is being called? (Check browser Network tab)
- What environment variables are set?
- What's in production Supabase?

## Most Likely Issue

**90% chance it's:** Missing or incorrect `GOOGLE_SERVICE_ACCOUNT_JSON` secret in production.

**Quick fix:**
1. Go to Edge Functions → Secrets
2. Add/update `GOOGLE_SERVICE_ACCOUNT_JSON`
3. Paste your service account JSON
4. Save
5. Try again

## After Fixing

The new logging will show exactly what's wrong:
- ✅ If secret is found → You'll see "✅ GOOGLE_SERVICE_ACCOUNT_JSON secret found"
- ❌ If secret is missing → You'll see "❌ GOOGLE_SERVICE_ACCOUNT_JSON secret is not set!"
- ❌ If config is wrong → You'll see the exact error

Check the logs and share what you see!
