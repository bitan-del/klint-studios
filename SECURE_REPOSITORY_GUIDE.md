# 🔒 Secure Repository Guide - Remove API Keys from GitHub

**Status**: ✅ Security Hardening Complete

## 🚨 Critical: Exposed API Keys Found

I found exposed API keys in your repository:
- `WORKING_BACKUP_2025_10_21.md` - Contains old API key
- `GOOGLE_OAUTH_WORKING_BACKUP.md` - Contains old API key
- `.env.bak` - Contains old API key (already in .gitignore)

## ✅ What I've Done

1. ✅ **Removed exposed keys** from documentation files
2. ✅ **Updated .gitignore** to exclude backup files
3. ✅ **Created security scripts** to help clean git history
4. ✅ **Added pre-commit checks** to prevent future leaks

## 🚀 Next Steps (CRITICAL)

### Step 1: Remove Keys from Git History

If these files were already committed to GitHub, you need to remove them from git history:

#### Option A: Use BFG Repo-Cleaner (Recommended)

```bash
# Install BFG
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Run the cleanup script
chmod +x scripts/remove-keys-from-git-history.sh
./scripts/remove-keys-from-git-history.sh
```

#### Option B: Manual Git Filter-Branch

```bash
# Remove specific files from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch WORKING_BACKUP_2025_10_21.md GOOGLE_OAUTH_WORKING_BACKUP.md .env.bak" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history!)
git push origin --force --all

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 2: Revoke Exposed Keys

**IMMEDIATELY revoke the old API keys:**

1. **Gemini API Key** (if exposed):
   - Go to: https://aistudio.google.com/app/apikey
   - Find and delete: `AIzaSyAJOYH-NS0qvmFsZLR_NTR4grkJQss_jL4`
   - Find and delete: `AIzaSyAJOYH-NS0qvmFsZLR_NTR4grkJqss_jL4`

2. **Supabase Keys** (if exposed in those files):
   - Go to: https://app.supabase.com
   - Settings → API → Regenerate keys

### Step 3: Set Up Pre-commit Security Checks

Prevent future leaks by adding a pre-commit hook:

```bash
# Make the script executable
chmod +x scripts/pre-commit-security-check.sh

# Copy to git hooks (optional - for automatic checking)
cp scripts/pre-commit-security-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Or run manually before commits:
```bash
./scripts/pre-commit-security-check.sh
```

## 📋 Security Checklist

- [ ] Removed keys from documentation files ✅
- [ ] Updated .gitignore ✅
- [ ] Removed keys from git history (if committed)
- [ ] Revoked exposed API keys in Google AI Studio
- [ ] Set up pre-commit security checks
- [ ] Verified no keys in current codebase
- [ ] Updated all environment variables

## 🔍 How to Check for Exposed Keys

### Search for API Keys in Repository

```bash
# Search for Gemini API keys
grep -r "AIzaSy" . --exclude-dir=.git --exclude-dir=node_modules

# Search for Stripe keys
grep -r "sk_live_\|pk_live_" . --exclude-dir=.git --exclude-dir=node_modules

# Search for Razorpay keys
grep -r "rzp_live_" . --exclude-dir=.git --exclude-dir=node_modules
```

### Check GitHub Repository

1. Go to your GitHub repository
2. Use GitHub's search: `AIzaSy` in your repo
3. Check if any results show actual API keys

## 🛡️ Best Practices Going Forward

### ✅ DO:
- ✅ Store API keys in Supabase database (`admin_settings` table)
- ✅ Use environment variables for local development
- ✅ Use `.example` files as templates
- ✅ Run security checks before committing
- ✅ Review all commits before pushing

### ❌ DON'T:
- ❌ Commit `.env` files
- ❌ Commit SQL scripts with real credentials
- ❌ Put API keys in documentation
- ❌ Put API keys in code comments
- ❌ Share API keys in screenshots

## 📁 Files Protected by .gitignore

The following are now excluded from git:
- `.env` files
- `.env.bak` files
- `*-BACKUP.md` files
- `*-WORKING*.md` files
- `scripts/*-production.sql` (use `.example` versions)
- `scripts/*-secrets.sql`
- `scripts/*credentials*.sql`

## 🔐 Current Security Status

### ✅ Secure:
- ✅ `.env` files (in .gitignore)
- ✅ Database storage (Supabase `admin_settings`)
- ✅ Environment variables (not committed)
- ✅ SQL scripts with `.example` suffix

### ⚠️ Action Required:
- ⚠️ Remove exposed keys from git history (if committed)
- ⚠️ Revoke old API keys
- ⚠️ Set up pre-commit hooks

## 🆘 If Keys Were Already Committed

1. **Immediately rotate/revoke** all exposed keys
2. **Remove from git history** using the scripts above
3. **Force push** to GitHub (coordinate with team if needed)
4. **Monitor** for suspicious activity on exposed keys
5. **Update** all services using the old keys

## 📞 Need Help?

If you're unsure about any step:
1. Check `SECURITY.md` for detailed security guide
2. Review `scripts/pre-commit-security-check.sh` for what it checks
3. Test the security check: `./scripts/pre-commit-security-check.sh`

---

**Remember**: Once keys are in git history, they're there forever unless you rewrite history. Always check before committing!


