# 🚨 CRITICAL: Rotate Exposed Credentials

## ⚠️ Immediate Action Required

If credentials were exposed in a public repository, you **MUST** rotate them immediately.

## 🔄 Steps to Rotate Credentials

### 1. Gemini API Key

1. **Go to Google AI Studio**:
   - https://aistudio.google.com/app/apikey

2. **Delete the exposed key**:
   - Find the exposed key: `AIzaSyBo6seA9boXRjX2HdLmXf48FfxSPtpLsew`
   - Click "Delete" or "Revoke"

3. **Create a new key**:
   - Click "Create API Key"
   - Copy the new key
   - Update in Supabase Admin Panel or database

4. **Update in Database**:
   ```sql
   -- Run in Supabase SQL Editor
   UPDATE admin_settings 
   SET setting_value = '"NEW_API_KEY_HERE"'::jsonb,
       updated_at = NOW()
   WHERE setting_key = 'gemini_api_key';
   ```

### 2. Cloudinary Credentials

1. **Go to Cloudinary Dashboard**:
   - https://console.cloudinary.com/

2. **Regenerate API Key/Secret**:
   - Go to Settings → Security
   - Click "Regenerate" for API Key or Secret
   - Copy the new values

3. **Update in Database**:
   ```sql
   -- Run in Supabase SQL Editor
   UPDATE admin_settings 
   SET setting_value = '"NEW_CLOUD_NAME"'::jsonb,
       updated_at = NOW()
   WHERE setting_key = 'cloudinary_cloud_name';

   UPDATE admin_settings 
   SET setting_value = '"NEW_API_KEY"'::jsonb,
       updated_at = NOW()
   WHERE setting_key = 'cloudinary_api_key';

   UPDATE admin_settings 
   SET setting_value = '"NEW_API_SECRET"'::jsonb,
       updated_at = NOW()
   WHERE setting_key = 'cloudinary_api_secret';
   ```

### 3. Supabase Keys (if exposed)

1. **Go to Supabase Dashboard**:
   - https://app.supabase.com

2. **Regenerate API Keys**:
   - Go to Settings → API
   - Click "Regenerate" for anon key or service role key
   - Update in environment variables

3. **Update Environment Variables**:
   - Update `.env` file locally
   - Update GitHub Secrets
   - Update Vercel Environment Variables
   - Redeploy application

## 🔍 Check What Was Exposed

Run this to see what files contained credentials:

```bash
# Check git history for exposed keys
git log --all --full-history --source -- "*setup-cloudinary.sql" "*set-gemini-key-production.sql"

# Check current files
grep -r "AIzaSyBo6seA9boXRjX2HdLmXf48FfxSPtpLsew" . --exclude-dir=.git --exclude-dir=node_modules
grep -r "558855971477248" . --exclude-dir=.git --exclude-dir=node_modules
grep -r "s0HTg1QKFaK5Ra0QI2H0FpIIiVU" . --exclude-dir=.git --exclude-dir=node_modules
```

## ✅ After Rotating

1. **Verify new keys work**:
   - Test API calls with new keys
   - Check application functionality

2. **Update documentation**:
   - Remove any references to old keys
   - Update setup guides

3. **Monitor usage**:
   - Check API usage logs
   - Look for unauthorized access
   - Set up alerts if possible

## 🛡️ Prevention

1. **Never commit credentials**:
   - Use `.example` files for templates
   - Use environment variables
   - Use database storage (Admin Panel)

2. **Use GitHub Secrets**:
   - Store secrets in GitHub Secrets
   - Use Vercel Environment Variables
   - Never hardcode in code

3. **Regular audits**:
   - Run security checks regularly
   - Review commits before pushing
   - Use pre-commit hooks

## 📞 Need Help?

If you're unsure about any step:
1. Check the `SECURITY.md` file
2. Review `GITHUB_SECRETS_SETUP.md`
3. Consult with your team
4. Contact support if needed

