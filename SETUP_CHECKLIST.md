# Setup Checklist - Klint Studios

Use this checklist to set up your Klint Studios application with Supabase backend.

---

## 📋 Pre-Setup

- [ ] Node.js 16+ installed
- [ ] Git installed (optional, for version control)
- [ ] Text editor (VS Code, Sublime, etc.)
- [ ] Modern web browser

---

## 🗄️ Supabase Setup

### Create Project
- [ ] Go to https://app.supabase.com
- [ ] Click "New Project"
- [ ] Fill in project details:
  - [ ] Project name: `klint-studios`
  - [ ] Database password: **Save this password!**
  - [ ] Region: Choose closest to you
- [ ] Click "Create new project"
- [ ] Wait ~2 minutes for project initialization

### Run Database Migration
- [ ] Open Supabase dashboard
- [ ] Go to **SQL Editor** (left sidebar)
- [ ] Click "New Query"
- [ ] Open file: `supabase/migrations/001_initial_schema.sql`
- [ ] Copy entire file contents
- [ ] Paste into SQL Editor
- [ ] Click **Run** button (▶️)
- [ ] Verify success message: "Success. No rows returned"

### Configure Google OAuth (Optional)
- [ ] In Supabase, go to **Authentication** → **Providers**
- [ ] Find "Google" and toggle to enable
- [ ] Click "Google" to expand settings
- [ ] Follow Supabase's instructions to:
  - [ ] Create Google Cloud project
  - [ ] Enable Google+ API
  - [ ] Create OAuth 2.0 credentials
  - [ ] Copy Client ID and Client Secret
  - [ ] Add authorized redirect URIs from Supabase
- [ ] Paste credentials into Supabase
- [ ] Click "Save"

### Get Supabase Credentials
- [ ] In Supabase, go to **Settings** → **API**
- [ ] Copy and save:
  - [ ] **Project URL**: `https://xxxxx.supabase.co`
  - [ ] **anon public key**: `eyJhbGc...` (the long string)

---

## 🔑 API Keys Setup

### Get Gemini API Key
- [ ] Go to https://aistudio.google.com/app/apikey
- [ ] Sign in with Google account
- [ ] Click "Create API Key"
- [ ] Select or create Google Cloud project
- [ ] Copy the API key: `AIzaSy...`
- [ ] **Save this key securely!**

---

## 💻 Local Development Setup

### Clone/Download Project
If using Git:
```bash
git clone https://github.com/yourusername/klint-studios.git
cd klint-studios
```

Or download ZIP and extract.

### Install Dependencies
- [ ] Open terminal in project directory
- [ ] Run: `npm install`
- [ ] Wait for installation to complete
- [ ] Verify no errors

### Configure Environment Variables
- [ ] Copy `env.example` to `.env`:
  ```bash
  cp env.example .env
  ```
- [ ] Open `.env` in text editor
- [ ] Fill in your credentials:
  ```env
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  VITE_GEMINI_API_KEY=AIzaSy...
  VITE_APP_URL=http://localhost:5173
  ```
- [ ] Save the file
- [ ] Verify `.env` is in `.gitignore` (should be by default)

### Start Development Server
- [ ] In terminal, run: `npm run dev`
- [ ] Wait for server to start
- [ ] You should see: "Local: http://localhost:5173"
- [ ] Open browser to http://localhost:5173

---

## 👤 Create Super Admin Account

### Option 1: Google Sign-In (Recommended if configured)
- [ ] Go to http://localhost:5173/login.html
- [ ] Click "Continue with Google"
- [ ] Sign in with **bitan@outreachpro.io**
- [ ] Allow permissions if prompted
- [ ] You should be redirected to the app
- [ ] **Verify admin access** (see below)

### Option 2: Email/Password Sign-Up
- [ ] Go to http://localhost:5173/signup.html
- [ ] Enter:
  - Email: `bitan@outreachpro.io`
  - Password: Your choice (remember it!)
- [ ] Click "Sign Up with Email"
- [ ] If email confirmation required:
  - [ ] Check email for confirmation link
  - [ ] Click confirmation link
- [ ] Go to http://localhost:5173/login.html
- [ ] Sign in with your credentials
- [ ] **Verify admin access** (see below)

### Verify Admin Access
- [ ] After logging in, check for **shield icon** 🛡️ in header
- [ ] Click the shield icon
- [ ] Admin Panel should open
- [ ] You should see three tabs:
  - [ ] User Management
  - [ ] Payments & Plans
  - [ ] Integrations

**If you don't see the Admin Panel:**
- [ ] Go to Supabase dashboard
- [ ] Click **Table Editor** (left sidebar)
- [ ] Open `user_profiles` table
- [ ] Find your email row
- [ ] Check: `role` should be `admin`, `plan` should be `brand`
- [ ] If not, go to **SQL Editor**
- [ ] Run this query:
  ```sql
  UPDATE user_profiles 
  SET role = 'admin', plan = 'brand'
  WHERE email = 'bitan@outreachpro.io';
  ```
- [ ] Refresh browser page

---

## ✅ Verification Tests

### Basic Functionality
- [ ] Can access homepage
- [ ] Navigation works
- [ ] Can switch between modes (Product, Design, Apparel, etc.)
- [ ] Settings panel opens
- [ ] No console errors (press F12 → Console tab)

### Authentication
- [ ] Can log in successfully
- [ ] Session persists on page refresh
- [ ] User menu shows correct email
- [ ] Can log out
- [ ] Can log back in

### Admin Panel
- [ ] Admin Panel button visible
- [ ] User Management tab loads
- [ ] Payments & Plans tab loads
- [ ] Integrations tab loads
- [ ] Can see Supabase status as "Connected"
- [ ] Can enter Gemini API key

### Database Connection
- [ ] Check Supabase dashboard → **Table Editor**
- [ ] Verify `user_profiles` table has your user
- [ ] Verify `payment_settings` table has 2 rows (stripe, razorpay)
- [ ] Verify `plan_pricing` table has 3 rows (solo, studio, brand)

---

## 🎨 Optional Customization

### Branding
- [ ] Update logo in `components/shared/KLogo.tsx`
- [ ] Customize colors in `styles.css`
- [ ] Update app name in `index.html`, `login.html`, `signup.html`
- [ ] Update landing page content

### Payment Setup
- [ ] Get Stripe API keys from https://dashboard.stripe.com/apikeys
- [ ] Get Razorpay keys from https://dashboard.razorpay.com/app/keys
- [ ] Add keys in Admin Panel → Payments & Plans
- [ ] Test payment flows

### Email Configuration
- [ ] In Supabase, go to **Authentication** → **Email Templates**
- [ ] Customize confirmation email
- [ ] Customize password reset email
- [ ] Add your branding/logo
- [ ] Test email sending

### Plan Pricing
- [ ] Open Admin Panel → Payments & Plans
- [ ] Adjust prices for each plan
- [ ] Change currency if needed (USD, EUR, INR)
- [ ] Click "Save Prices"

---

## 🚀 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Pre-Deployment
- [ ] Test all features locally
- [ ] Verify admin panel works
- [ ] Test user signup/login flows
- [ ] Check all generation modes
- [ ] Review security settings

### Choose Hosting Platform
- [ ] Vercel (recommended - easiest)
- [ ] Netlify (simple)
- [ ] Firebase Hosting
- [ ] Self-hosted VPS

### Deploy to Vercel (Quick)
- [ ] Push code to GitHub
- [ ] Go to https://vercel.com/new
- [ ] Import GitHub repository
- [ ] Add environment variables in Vercel settings:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_GEMINI_API_KEY`
  - [ ] `VITE_APP_URL` (your domain)
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete

### Post-Deployment
- [ ] Update OAuth redirect URLs in Supabase
- [ ] Update OAuth redirect URLs in Google Cloud Console
- [ ] Set up custom domain (optional)
- [ ] Enable SSL (automatic on Vercel/Netlify)
- [ ] Test production site
- [ ] Create test user account
- [ ] Verify all features work in production

---

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Never committed API keys to Git
- [ ] Changed all default passwords
- [ ] Enabled MFA on Supabase account
- [ ] Enabled MFA on Google account
- [ ] Review RLS policies in Supabase
- [ ] HTTPS enabled in production
- [ ] OAuth redirect URLs restricted
- [ ] Regular API key rotation scheduled

---

## 📊 Monitoring Setup

### Supabase Monitoring
- [ ] Bookmark Supabase dashboard
- [ ] Check **Database** → **Reports** for usage
- [ ] Check **Authentication** → **Users** for user growth
- [ ] Review **Logs** → **Postgres Logs** for errors
- [ ] Set up billing alerts

### Google Cloud Monitoring
- [ ] Go to Google Cloud Console
- [ ] Navigate to Gemini API
- [ ] Check quotas and usage
- [ ] Set up billing alerts
- [ ] Monitor for unusual activity

### Application Monitoring (Optional)
- [ ] Add Google Analytics
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Monitor server logs
- [ ] Set up uptime monitoring

---

## 📚 Learning Resources

- [ ] Read [SETUP.md](./SETUP.md) for detailed setup guide
- [ ] Read [QUICKSTART.md](./QUICKSTART.md) for rapid setup
- [ ] Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment
- [ ] Read [README.md](./README.md) for project overview
- [ ] Review [Supabase docs](https://supabase.com/docs)
- [ ] Review [Gemini API docs](https://ai.google.dev/docs)

---

## 🆘 Troubleshooting

### Common Issues

**"Missing Supabase configuration"**
- [ ] Check `.env` file exists
- [ ] Verify credentials are correct
- [ ] Restart dev server

**"Failed to fetch" errors**
- [ ] Check Supabase project is active
- [ ] Verify internet connection
- [ ] Check browser console for details

**Admin Panel not showing**
- [ ] Verify logged in as correct email
- [ ] Check user role in Supabase Table Editor
- [ ] Run SQL update if needed
- [ ] Refresh browser

**Google Sign-In not working**
- [ ] Verify OAuth configured in Supabase
- [ ] Check redirect URLs in Google Console
- [ ] Verify OAuth consent screen set up

**Build errors**
- [ ] Delete `node_modules` folder
- [ ] Run `npm install` again
- [ ] Check Node.js version (16+)
- [ ] Clear npm cache: `npm cache clean --force`

---

## 🎉 Completion

Congratulations! When all items are checked, you have:

✅ A fully functional Klint Studios application
✅ Supabase backend integrated
✅ Super admin access configured
✅ Ready for development and deployment
✅ Comprehensive documentation

---

## 📞 Support

Need help?
1. Review documentation files in the project
2. Check Supabase dashboard for errors
3. Review browser console (F12)
4. Check Supabase community forum
5. Review GitHub issues (if available)

---

**Happy creating with Klint Studios!** 🚀

