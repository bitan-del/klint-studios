# Quick Start: Vertex AI Setup with Supabase Edge Functions

## Prerequisites

1. Google Cloud Project with Vertex AI API enabled
2. Supabase project with Edge Functions enabled
3. Supabase CLI installed: `npm install -g supabase`

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Deploy Supabase Edge Function

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the Vertex AI function
supabase functions deploy vertex-ai
```

### 3. Configure Supabase Environment Variables

Create a `.env` file in the project root:

```env
# Supabase (required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Configure Vertex AI in Admin Panel

1. Start the app: `npm run dev`
2. Open http://localhost:3000
3. Log in as admin
4. Go to Admin Panel → Integrations
5. Enter Vertex AI settings:
   - **Project ID**: Your Google Cloud Project ID
   - **Location**: Region (e.g., `us-central1`)
   - **Credentials Path**: (Optional) Leave empty to use Application Default Credentials

### 5. Set Up Google Cloud Credentials

The Edge Function needs access to Google Cloud. The service account attached to your Supabase project will be used automatically, or you can configure Application Default Credentials.

## Verify Setup

1. Check function is deployed: `supabase functions list`
2. Try generating an image in the app
3. Check browser console for any errors
4. Check Supabase Dashboard → Edge Functions → vertex-ai → Logs

## Troubleshooting

### Backend won't start
- Check port 3001 is available
- Verify Node.js version: `node --version` (should be 18+)
- Check dependencies: `npm install`

### Authentication errors
- Verify credentials are set correctly
- Check service account has Vertex AI permissions
- Try: `gcloud auth application-default login`

### API connection errors
- Verify backend is running on port 3001
- Check `VITE_VERTEX_API_URL` in .env
- Check browser console for CORS errors

### Model not available
- Enable Vertex AI API in Google Cloud Console
- Verify billing is enabled
- Check project has access to the models

## Next Steps

- Test image generation
- Test video generation
- Test chatbot features
- Review VERTEX_AI_MIGRATION.md for detailed information
