# Debug Guide: "Unknown endpoint: generate-styled-image"

## Quick Check: Is the Function Deployed?

First, verify the function is actually deployed with the latest code:

### Step 1: Check Supabase Dashboard Logs

1. Go to your **Supabase Dashboard**
2. Navigate to **Edge Functions** → **vertex-ai** → **Logs**
3. Look for the most recent logs when you try to generate an image
4. You should see logs like:
   - `📥 Received request for endpoint: generate-styled-image`
   - `🔍 Trimmed endpoint: "generate-styled-image"`
   - `🔀 Routing endpoint: generate-styled-image`

**If you DON'T see these logs**, the function hasn't been deployed yet.

### Step 2: Test the Health Endpoint

I've added a health check endpoint. Test it:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/vertex-ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"endpoint": "health"}'
```

Replace:
- `YOUR_PROJECT` with your Supabase project reference
- `YOUR_ANON_KEY` with your Supabase anon key

**Expected response:**
```json
{
  "status": "ok",
  "message": "Vertex AI Edge Function is running",
  "availableEndpoints": [...],
  "timestamp": "..."
}
```

If this works, the function is deployed. If not, you need to deploy it.

## Deploy the Function

### Option 1: Using npx (Recommended)

```bash
cd /Users/bitanpurkayastha/Downloads/klint-studios-new
npx supabase functions deploy vertex-ai
```

### Option 2: Using the Script

```bash
./redeploy-vertex.sh
```

### Option 3: Manual Steps

1. Make sure you're logged in:
   ```bash
   npx supabase login
   ```

2. Link your project (if not already):
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Deploy:
   ```bash
   npx supabase functions deploy vertex-ai
   ```

## What I Fixed in the Code

1. **Better Error Handling**: Wrapped `getVertexAIClient()` in try-catch to prevent crashes
2. **Enhanced Logging**: Added detailed logs to see exactly what endpoint is received
3. **Case-Insensitive Fallback**: If endpoint doesn't match exactly, tries case-insensitive matching
4. **Health Check Endpoint**: Added `health` endpoint to verify function is running
5. **Debugging Info**: Logs endpoint length and character codes to catch hidden characters

## Common Issues

### Issue 1: Function Not Deployed
**Symptom**: Still getting "Unknown endpoint" after redeploying
**Solution**: 
- Check Supabase Dashboard → Edge Functions → vertex-ai → Logs
- If no logs appear, the function isn't deployed
- Try deploying again and check for errors

### Issue 2: Wrong Project Linked
**Symptom**: Function deploys but logs show different project
**Solution**:
```bash
npx supabase link --project-ref YOUR_CORRECT_PROJECT_REF
npx supabase functions deploy vertex-ai
```

### Issue 3: Cached Version
**Symptom**: Old code still running
**Solution**:
- Wait 1-2 minutes after deployment
- Clear browser cache
- Try in incognito mode

### Issue 4: Missing Environment Variables
**Symptom**: Function crashes with config errors
**Solution**:
- Check Supabase Dashboard → Edge Functions → vertex-ai → Settings → Secrets
- Ensure `GOOGLE_SERVICE_ACCOUNT_JSON` is set
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (usually auto-set)

## Verify Deployment Success

After deploying, check:

1. **Deployment Output**: Should show "Deployed Function vertex-ai"
2. **Supabase Dashboard**: Edge Functions → vertex-ai should show "Active"
3. **Logs**: Should show new logs when you make requests
4. **Health Check**: Should return OK status

## Next Steps

1. **Deploy the function** using one of the methods above
2. **Wait 1-2 minutes** for deployment to propagate
3. **Test the health endpoint** to verify it's working
4. **Check the logs** in Supabase Dashboard
5. **Try generating an image** again
6. **Share the logs** if you still see errors

## Need More Help?

If you're still getting errors after deploying:

1. Copy the **exact error message** from the browser console
2. Copy the **logs from Supabase Dashboard** → Edge Functions → vertex-ai → Logs
3. Share both with me so I can debug further
