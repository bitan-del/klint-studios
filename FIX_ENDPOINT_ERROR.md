# Fix for "Unknown endpoint: generate-styled-image" Error

## What I Fixed

1. **Added Better Logging**: The Edge Function now logs exactly what endpoint it receives, making debugging easier
2. **Improved Error Handling**: Better JSON parsing with clear error messages
3. **Endpoint Trimming**: Automatically trims whitespace from endpoint names
4. **Image Size Fix**: Updated to use "2K" (max) instead of "4K" per Vertex AI documentation

## The Problem

The error "Unknown endpoint: generate-styled-image" means the Edge Function code hasn't been deployed yet, or there's a mismatch between what the frontend sends and what the backend expects.

## Solution: Redeploy the Edge Function

You **MUST** redeploy the Edge Function for the fixes to take effect:

### Option 1: Quick Deploy Script

```bash
cd /Users/bitanpurkayastha/Downloads/klint-studios-new
./redeploy-vertex.sh
```

### Option 2: Manual Deploy

```bash
cd /Users/bitanpurkayastha/Downloads/klint-studios-new
npx supabase functions deploy vertex-ai
```

### Option 3: Using Supabase CLI (if logged in)

```bash
cd /Users/bitanpurkayastha/Downloads/klint-studios-new
supabase functions deploy vertex-ai
```

## After Deployment

1. **Wait for deployment to complete** (you'll see "Deployed Function vertex-ai")
2. **Check the Supabase Dashboard**:
   - Go to Edge Functions → vertex-ai
   - Check the logs to see if the function is receiving requests
3. **Refresh your browser** (Command + R)
4. **Try generating an image again**

## Verify It's Working

After redeploying, check the Supabase Edge Function logs:
1. Go to your Supabase Dashboard
2. Navigate to Edge Functions → vertex-ai → Logs
3. You should see logs like:
   - `📥 Received request for endpoint: generate-styled-image`
   - `🔄 Routing to handleGenerateStyledImage`

If you see these logs, the endpoint is working!

## Still Getting Errors?

If you still see "Unknown endpoint" after redeploying:

1. **Check the Supabase logs** to see what endpoint is actually being received
2. **Verify the function deployed successfully** - check for any deployment errors
3. **Clear browser cache** and try again
4. **Check network tab** in browser DevTools to see the exact request being sent

## Technical Details

The endpoint routing is in `/supabase/functions/vertex-ai/index.ts`:

```typescript
switch (trimmedEndpoint) {
  case 'generate-styled-image':
    return await handleGenerateStyledImage(projectId, location, body, corsHeaders)
  // ... other endpoints
}
```

The frontend calls it from `services/vertexService.ts`:

```typescript
const result = await callVertexAPI('generate-styled-image', {
  prompt: finalPrompt,
  imageUrls: allImages,
  quality: mappedQuality,
  style,
  aspectRatio
});
```

Both use the exact same string `'generate-styled-image'`, so they should match after deployment.
