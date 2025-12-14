# 🚀 Quick Deploy Instructions

## Option 1: Use the Deployment Script (Easiest)

I've created a script that will guide you through the deployment:

```bash
./deploy-vertex-function.sh
```

This script will:
1. ✅ Login to Supabase (opens browser)
2. ✅ Link your project (asks for project ref)
3. ✅ Deploy the function

## Option 2: Manual Deployment

### Step 1: Login to Supabase

```bash
npx supabase login
```

This will open a browser for you to authenticate.

### Step 2: Link Your Project

Get your project reference ID from your Supabase dashboard URL:
- URL format: `https://app.supabase.com/project/YOUR_PROJECT_REF`
- Copy the `YOUR_PROJECT_REF` part

Then run:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

Example:
```bash
npx supabase link --project-ref abcdefghijklmnop
```

### Step 3: Deploy the Function

```bash
npx supabase functions deploy vertex-ai
```

## Verify Deployment

Check that the function is deployed:

```bash
npx supabase functions list
```

You should see `vertex-ai` in the list.

## After Deployment

### 1. Set Up Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **IAM & Admin** → **Service Accounts** → **Create Service Account**
3. Name: `supabase-vertex-ai`
4. Grant role: **Vertex AI User**
5. **Keys** tab → **Add Key** → **Create new key** → **JSON**
6. Download the JSON file

### 2. Add to Supabase Secrets

1. Go to **Supabase Dashboard** → **Edge Functions** → **Secrets**
2. Click **Add new secret**
3. Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
4. Value: Paste the **entire contents** of the downloaded JSON file
5. Click **Save**

### 3. Configure in Admin Panel

1. Start your app: `npm run dev`
2. Log in as admin
3. Go to **Admin Panel** → **Integrations**
4. Enter:
   - **Project ID**: Your Google Cloud Project ID
   - **Location**: `us-central1` (or your preferred region)

## Troubleshooting

### "Command not found"
- Use `npx supabase` instead of just `supabase`
- Or install globally: `npm install -g supabase` (may need sudo)

### "Not logged in"
- Run `npx supabase login` again

### "Project not linked"
- Run `npx supabase link --project-ref YOUR_PROJECT_REF`

### "Function not found"
- Make sure you're in the project root directory
- Check that `supabase/functions/vertex-ai/index.ts` exists

## Need Help?

Check the logs:
```bash
npx supabase functions logs vertex-ai
```

Or view in Supabase Dashboard → Edge Functions → vertex-ai → Logs
