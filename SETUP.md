# Klint Studios - Supabase Backend Setup Guide

This guide will walk you through setting up the Supabase backend for Klint Studios.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- Google Cloud account for Gemini API

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - Name: `klint-studios` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to your users
4. Click "Create new project" and wait for it to initialize (takes ~2 minutes)

## Step 2: Run Database Migrations

1. In your Supabase dashboard, go to the **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration
6. You should see "Success. No rows returned" message

This creates all necessary tables, functions, and security policies.

## Step 3: Configure Google OAuth (Optional but Recommended)

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable the "Google" provider
3. Follow Supabase's instructions to set up Google OAuth:
   - Create a Google Cloud project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs from Supabase
4. Copy your Google Client ID and Secret into Supabase

## Step 4: Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGc...`)

## Step 5: Get Your Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Choose your Google Cloud project or create a new one
4. Copy the API key

## Step 6: Configure Environment Variables

1. In the project root, create a `.env` file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_APP_URL=http://localhost:5173
   ```

## Step 7: Make bitan@outreachpro.io Super Admin

The database is already configured to automatically grant admin access to `bitan@outreachpro.io` when this email signs up.

**To activate admin access:**

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173/login.html`

4. Sign up or sign in using `bitan@outreachpro.io`:
   - Option 1: Use Google Sign-In with this email
   - Option 2: Use email/password signup

5. Upon first login, the database trigger will automatically:
   - Create your user profile
   - Set your role to `admin`
   - Set your plan to `brand`

6. You should now see the "Admin Panel" button in the header

## Step 8: Verify Setup

1. Log in as `bitan@outreachpro.io`
2. Click on the "Admin Panel" button (shield icon)
3. You should see:
   - User Management tab
   - Payments & Plans tab
   - Integrations tab (Gemini API key configuration)

## Database Schema Overview

Your Supabase database now has:

### Tables
- `user_profiles` - Extended user information
- `payment_settings` - Stripe/Razorpay configuration
- `plan_pricing` - Subscription plan prices
- `admin_settings` - General admin configurations
- `generation_history` - Logs of all image/video generations

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Admins can access all data
- Secure functions for data operations

### Functions
- `increment_user_generations()` - Safely increment usage counters
- `get_all_users()` - Admin-only function to list all users
- Automatic triggers for timestamps and new user creation

## Deployment

### For Production Deployment:

1. **Update Environment Variables** in your hosting platform:
   ```env
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_APP_URL=https://yourdomain.com
   ```

2. **Configure OAuth Redirect URLs**:
   - Add your production domain to Supabase → Authentication → URL Configuration
   - Add production redirect URL: `https://yourdomain.com/**`

3. **Build the application**:
   ```bash
   npm run build
   ```

4. **Deploy** the `dist` folder to your hosting service:
   - Vercel
   - Netlify
   - Firebase Hosting
   - Any static hosting service

### Recommended Hosting Platforms:

1. **Vercel** (Recommended):
   - Connect your GitHub repo
   - Add environment variables in project settings
   - Auto-deploys on push

2. **Netlify**:
   - Drag and drop `dist` folder
   - Or connect GitHub for CI/CD
   - Add environment variables in site settings

3. **Firebase Hosting**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

## Security Best Practices

1. **Never commit `.env` files** - Already added to `.gitignore`
2. **Use environment variables** for all sensitive data
3. **Enable MFA** on your Supabase account
4. **Regularly rotate API keys**
5. **Monitor usage** in Supabase dashboard
6. **Set up billing alerts** in Google Cloud for Gemini API usage

## Admin Features

As the super admin (`bitan@outreachpro.io`), you can:

### User Management
- View all registered users
- Change user subscription plans
- Monitor usage statistics
- Track daily and monthly limits

### Payment Configuration
- Configure Stripe payment gateway
- Configure Razorpay payment gateway
- Set up payment processing

### Plan Pricing
- Adjust subscription prices for all plans
- Change currency (USD, EUR, INR)
- Update plan limits and features

### API Integration
- Manage Gemini API keys
- Monitor API usage

## Troubleshooting

### Issue: "Missing Supabase configuration"
- **Solution**: Make sure `.env` file exists with correct credentials
- Restart dev server after creating `.env`

### Issue: "Admin Panel not showing"
- **Solution**: 
  1. Check you're logged in as `bitan@outreachpro.io`
  2. Verify in Supabase Table Editor → `user_profiles` that your role is `admin`
  3. If not, run in SQL Editor: 
     ```sql
     UPDATE user_profiles SET role = 'admin', plan = 'brand' WHERE email = 'bitan@outreachpro.io';
     ```

### Issue: "Google Sign-In not working"
- **Solution**: 
  1. Verify Google OAuth is configured in Supabase
  2. Check redirect URLs are correctly set
  3. Ensure your Google Cloud project has OAuth consent screen configured

### Issue: Database errors or missing tables
- **Solution**: Re-run the migration script in Supabase SQL Editor

## Support

For issues or questions:
1. Check Supabase docs: https://supabase.com/docs
2. Check Gemini API docs: https://ai.google.dev/docs
3. Review this setup guide
4. Check browser console for error messages

## Next Steps

After setup:
1. Customize plan pricing in Admin Panel
2. Configure payment gateways (Stripe/Razorpay)
3. Test user registration flow
4. Test image generation features
5. Monitor usage in Supabase dashboard
6. Set up production deployment

---

**Congratulations!** 🎉 Your Klint Studios backend is now fully integrated with Supabase!

