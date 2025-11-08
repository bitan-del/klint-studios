# GitHub Secrets Setup Guide

## 🔒 Setting Up GitHub Secrets for Secure Deployment

This guide will help you set up GitHub Secrets to securely store API credentials for automated deployments (Vercel, etc.).

## 📋 Step-by-Step Instructions

### 1. Go to GitHub Repository Settings

1. Open your repository on GitHub
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 2. Add Repository Secrets

Click **New repository secret** and add the following secrets:

#### Required Secrets:

**`VITE_SUPABASE_URL`**
- Value: Your Supabase project URL
- Example: `https://xxxxxxxxxxxxx.supabase.co`
- Get from: Supabase Dashboard → Settings → API

**`VITE_SUPABASE_ANON_KEY`**
- Value: Your Supabase anon/public key
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Get from: Supabase Dashboard → Settings → API

**`VITE_GEMINI_API_KEY`** (Optional - if using env vars)
- Value: Your Google Gemini API key
- Example: `AIzaSy...`
- Get from: https://aistudio.google.com/app/apikey
- Note: If using database storage, this is optional

#### Optional Secrets (if needed):

**`CLOUDINARY_CLOUD_NAME`**
- Value: Your Cloudinary cloud name
- Get from: Cloudinary Dashboard

**`CLOUDINARY_API_KEY`**
- Value: Your Cloudinary API key
- Get from: Cloudinary Dashboard

**`CLOUDINARY_API_SECRET`**
- Value: Your Cloudinary API secret
- Get from: Cloudinary Dashboard

## 🔧 Setting Up Vercel Environment Variables

If you're using Vercel for deployment:

### 1. Go to Vercel Dashboard

1. Open your project in Vercel
2. Go to **Settings** → **Environment Variables**

### 2. Add Environment Variables

Add the same variables as GitHub Secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY` (if using env vars)
- Any other `VITE_*` variables needed

### 3. Set Environment Scope

- **Production**: For production deployments
- **Preview**: For preview deployments
- **Development**: For local development (usually not needed)

## 🚀 How It Works

### Local Development:
- Uses `.env` file (not committed to git)
- Variables are loaded via `import.meta.env.VITE_*`

### Production:
- Vercel injects environment variables at build time
- Variables are available as `import.meta.env.VITE_*`
- No credentials in code or repository

### Database Storage (Current Approach):
- API keys stored in Supabase `admin_settings` table
- Set via Admin Panel UI or SQL scripts (run directly in Supabase)
- No environment variables needed for API keys
- More secure and centralized

## ✅ Verification

### Check if Secrets are Set:

1. **GitHub Secrets**:
   - Go to Repository → Settings → Secrets and variables → Actions
   - You should see all your secrets listed (values are hidden)

2. **Vercel Environment Variables**:
   - Go to Project → Settings → Environment Variables
   - You should see all variables listed

3. **Test Deployment**:
   - Make a small change and push to main
   - Check Vercel deployment logs
   - Verify environment variables are loaded

## 🔄 Updating Secrets

### To Update a Secret:

1. Go to GitHub Repository → Settings → Secrets
2. Find the secret you want to update
3. Click **Update**
4. Enter new value
5. Click **Update secret**

### To Update Vercel Variables:

1. Go to Vercel → Project → Settings → Environment Variables
2. Find the variable
3. Click **Edit**
4. Update value
5. Click **Save**
6. Redeploy if needed

## 🚨 Important Notes

1. **Never commit secrets to git** - Always use GitHub Secrets or Vercel Environment Variables
2. **Rotate keys if exposed** - If you accidentally commit a key, rotate it immediately
3. **Use database storage for API keys** - Our app stores API keys in Supabase database (set via Admin Panel)
4. **Environment variables are for build-time** - They're available during `npm run build`
5. **Database storage is for runtime** - API keys are fetched from database when needed

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/secrets)

## 🆘 Troubleshooting

### Secret not working?

1. **Check variable name** - Must start with `VITE_` for Vite projects
2. **Check environment scope** - Make sure it's set for the right environment
3. **Redeploy** - Variables are injected at build time, so you need to redeploy
4. **Check logs** - Look for errors in deployment logs

### Variable not available?

1. **Restart dev server** - If testing locally, restart after adding to `.env`
2. **Clear cache** - Try clearing Vercel cache and redeploying
3. **Check spelling** - Variable names are case-sensitive

