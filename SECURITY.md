# Security Guide - Protecting API Credentials

## 🔒 Important Security Information

This repository is **PUBLIC**. Never commit actual API keys, secrets, or credentials to this repository.

## 🛡️ How We Protect Credentials

### 1. **Environment Variables** (For Local Development)
- All sensitive credentials are stored in `.env` files
- `.env` files are already in `.gitignore` (never committed)
- Use `.env.example` as a template

### 2. **Database Storage** (For Production)
- API keys are stored in Supabase `admin_settings` table
- Only accessible to authenticated admin users
- Set via Admin Panel UI or SQL scripts (run directly in Supabase, not committed)

### 3. **GitHub Secrets** (For CI/CD)
- For automated deployments (Vercel, etc.)
- Store secrets in GitHub Repository Settings → Secrets
- Never hardcode in code or commit to git

## 📝 Setting Up Credentials

### Local Development

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your credentials in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Production (Supabase Database)

1. **Via Admin Panel** (Recommended):
   - Log in to your app as admin
   - Go to Admin Panel → Integrations
   - Enter API keys in the UI
   - Keys are saved to database automatically

2. **Via SQL Scripts** (Alternative):
   - Use `.example` files as templates
   - Run SQL scripts directly in Supabase SQL Editor
   - **Never commit scripts with actual credentials**

### GitHub Secrets (For Vercel/Deployment)

1. Go to GitHub Repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
   - Any other environment variables needed

3. In Vercel:
   - Go to Project Settings → Environment Variables
   - Add the same variables
   - They will be available at build time

## 🚨 If You Accidentally Committed Credentials

### Immediate Actions:

1. **Rotate/Revoke the exposed credentials immediately**:
   - Gemini API Key: https://aistudio.google.com/app/apikey
   - Cloudinary: https://console.cloudinary.com/
   - Supabase: Regenerate keys in project settings

2. **Remove from Git History**:
```bash
# Remove file from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/setup-cloudinary.sql" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - coordinate with team)
git push origin --force --all
```

3. **Use BFG Repo-Cleaner** (Better option):
```bash
# Install BFG
brew install bfg  # or download from https://rtyley.github.io/bfg-repo-cleaner/

# Remove file from history
bfg --delete-files setup-cloudinary.sql
bfg --delete-files set-gemini-key-production.sql

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## 📋 Checklist Before Committing

- [ ] No API keys in code files
- [ ] No secrets in SQL scripts (use `.example` files)
- [ ] No credentials in documentation
- [ ] `.env` files are in `.gitignore`
- [ ] All sensitive files are excluded
- [ ] Used environment variables or database storage

## 🔍 Files That Should NEVER Be Committed

- `scripts/setup-cloudinary.sql` (use `.example` version)
- `scripts/set-gemini-key-production.sql` (use `.example` version)
- Any `.sql` files with actual credentials
- `.env` files
- Documentation files with real API keys
- Backup files with credentials

## ✅ Safe Files to Commit

- `scripts/*.sql.example` (template files)
- `env.example` (template file)
- Documentation without real credentials
- Code that reads from environment variables
- Configuration files without secrets

## 🆘 Need Help?

If you're unsure whether a file is safe to commit:
1. Check if it contains actual API keys or secrets
2. Look for patterns like `AIzaSy`, `sk_`, `pk_`, `rzp_`, etc.
3. When in doubt, use `.example` files or environment variables

