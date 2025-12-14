# Supabase Edge Function Setup for Vertex AI

This guide explains how to set up and deploy the Vertex AI Edge Function to Supabase.

## Overview

The Vertex AI integration now uses a Supabase Edge Function instead of a separate Express server. This provides:
- ✅ Serverless architecture
- ✅ Built-in authentication
- ✅ Automatic scaling
- ✅ No need to manage a separate server
- ✅ Integrated with your existing Supabase setup

## Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Supabase project linked**
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. **Google Cloud credentials configured**
   - Service account with Vertex AI permissions
   - Or Application Default Credentials set up

## Setup Steps

### Step 1: Deploy the Edge Function

```bash
supabase functions deploy vertex-ai
```

This will:
- Upload the function to Supabase
- Make it available at: `https://your-project.supabase.co/functions/v1/vertex-ai`

### Step 2: Set Up Google Cloud Service Account

1. **Create a Service Account in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**
   - Give it a name (e.g., `supabase-vertex-ai`)
   - Grant it the **Vertex AI User** role
   - Click **Done**

2. **Generate and Download Key:**
   - Click on the created service account
   - Go to **Keys** tab
   - Click **Add Key** → **Create new key**
   - Choose **JSON** format
   - Download the key file

3. **Add Service Account to Supabase Edge Function Secrets:**
   - Go to Supabase Dashboard → **Edge Functions** → **Secrets**
   - Click **Add new secret**
   - Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Value: Paste the **entire contents** of the downloaded JSON file
   - Click **Save**

### Step 3: Set Environment Variables (Optional)

If you want to use environment variables instead of database settings:

1. Go to Supabase Dashboard → Edge Functions → vertex-ai → Settings
2. Add secrets:
   - `VERTEX_PROJECT_ID` - Your Google Cloud Project ID (optional, can be set in admin panel)
   - `VERTEX_LOCATION` - Region (e.g., `us-central1`) (optional, can be set in admin panel)

**Note:** The function will first try to get config from the `admin_settings` table, then fall back to environment variables.

### Step 4: Configure in Admin Panel (Recommended)

1. Start your app: `npm run dev`
2. Log in as admin
3. Go to Admin Panel → Integrations
4. Enter Vertex AI settings:
   - **Project ID**: Your Google Cloud Project ID
   - **Location**: Region (e.g., `us-central1`)
   - **Credentials Path**: (Optional) Leave empty to use Application Default Credentials

### Step 5: Verify Setup

The Edge Function will automatically use the `GOOGLE_SERVICE_ACCOUNT_JSON` secret you set in Step 2. No additional credential setup is needed.

## Testing the Function

### Test Locally (Optional)

```bash
supabase functions serve vertex-ai
```

Then test with:
```bash
curl -X POST http://localhost:54321/functions/v1/vertex-ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "endpoint": "generate-content",
    "model": "gemini-1.5-flash",
    "prompt": "Hello, world!"
  }'
```

### Test in Production

1. Open your app
2. Try generating an image or using the chatbot
3. Check browser console for any errors
4. Check Supabase Dashboard → Edge Functions → vertex-ai → Logs

## Function Endpoints

The Edge Function handles these endpoints:

- `generate-content` - Generate text content
- `generate-content-with-images` - Generate content with image inputs
- `generate-images` - Generate images (Imagen) - *Needs implementation*
- `generate-video` - Generate videos (Veo) - *Needs implementation*
- `video-operation-status` - Check video generation status - *Needs implementation*

## Troubleshooting

### Function Not Found (404)

**Solution:**
- Verify the function is deployed: `supabase functions list`
- Check the function name matches: `vertex-ai`
- Verify Supabase URL in environment variables

### Authentication Errors (401)

**Solution:**
- Check that user is logged in
- Verify `VITE_SUPABASE_ANON_KEY` is set correctly
- Check browser console for auth errors

### Vertex AI Configuration Errors

**Solution:**
- Verify `vertex_project_id` is set in `admin_settings` table
- Check that `vertex_location` is set
- Verify Google Cloud credentials are configured
- Check Edge Function logs in Supabase Dashboard

### CORS Errors

**Solution:**
- The function already includes CORS headers
- Verify your app's origin is allowed
- Check browser console for specific CORS errors

## Monitoring

### View Logs

1. Go to Supabase Dashboard
2. Navigate to Edge Functions → vertex-ai
3. Click on "Logs" tab
4. View real-time function execution logs

### View Metrics

1. Go to Supabase Dashboard
2. Navigate to Edge Functions → vertex-ai
3. View:
   - Invocation count
   - Error rate
   - Average execution time

## Updating the Function

When you make changes to the Edge Function:

```bash
supabase functions deploy vertex-ai
```

The function will be updated immediately without downtime.

## Security Notes

1. **Authentication Required**: The function requires a valid Supabase session
2. **Service Role Key**: Only used server-side, never exposed to client
3. **CORS**: Configured to allow requests from your app
4. **Rate Limiting**: Consider adding rate limiting for production

## Next Steps

1. ✅ Deploy the function
2. ✅ Configure Vertex AI settings in Admin Panel
3. ✅ Test image generation
4. ✅ Test chatbot features
5. ⏳ Implement missing endpoints (Imagen, Veo) as needed

## Migration from Express Server

If you were using the Express server (`server/vertexApi.ts`):

1. **Remove the server** (optional - kept for reference):
   - The `server/` folder can be deleted or kept for reference
   - No longer needed with Edge Functions

2. **Update environment variables**:
   - Remove `VITE_VERTEX_API_URL` (no longer needed)
   - Keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

3. **Deploy Edge Function**:
   - Follow Step 1 above

The frontend code (`services/vertexService.ts`) has already been updated to use the Edge Function automatically.
