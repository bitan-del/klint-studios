# Quick Start Guide - Klint Studios

Get up and running in 10 minutes!

## 🎯 Prerequisites Checklist

- [ ] Node.js 16+ installed ([Download](https://nodejs.org))
- [ ] Supabase account ([Sign up](https://supabase.com))
- [ ] Google Gemini API key ([Get one](https://aistudio.google.com/app/apikey))

## ⚡ 5-Minute Setup

### Step 1: Create Supabase Project (2 minutes)
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name: `klint-studios`
4. Create a strong database password
5. Choose a region
6. Click "Create new project"
7. ☕ Wait ~2 minutes for setup

### Step 2: Set Up Database (1 minute)
1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Open `supabase/migrations/001_initial_schema.sql` from this project
4. Copy ALL the SQL code
5. Paste into SQL Editor
6. Click **Run** ▶️
7. ✅ Should see "Success. No rows returned"

### Step 3: Get Credentials (1 minute)
1. In Supabase, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`
3. Get Gemini API key from https://aistudio.google.com/app/apikey

### Step 4: Configure App (1 minute)
```bash
# 1. Copy environment template
cp env.example .env

# 2. Edit .env file with your credentials
# (Use your favorite text editor)

# 3. Install dependencies
npm install
```

Your `.env` should look like:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSy...
VITE_APP_URL=http://localhost:5173
```

### Step 5: Start Development Server
```bash
npm run dev
```

Open http://localhost:5173 🚀

## 🔑 Activate Super Admin

### Option 1: Google Sign-In (Recommended)

1. First, enable Google OAuth in Supabase:
   - Go to **Authentication** → **Providers**
   - Enable Google
   - Follow Supabase's Google OAuth setup guide

2. Then in your app:
   - Go to http://localhost:5173/login.html
   - Click "Continue with Google"
   - Sign in with `bitan@outreachpro.io`
   - ✨ You're automatically an admin!

### Option 2: Email/Password

1. Go to http://localhost:5173/signup.html
2. Enter:
   - Email: `bitan@outreachpro.io`
   - Password: Your choice (save it!)
3. Click "Sign Up"
4. Check email for confirmation link (if email is configured)
5. Sign in at http://localhost:5173/login.html
6. ✨ You're automatically an admin!

### Verify Admin Access

After signing in, you should see:
- **Shield icon** 🛡️ in the top navigation
- Click it to open the Admin Panel
- You should see three tabs: Users, Payments, Integrations

### Troubleshooting Admin Access

If you don't see the Admin Panel:

1. Check in Supabase Table Editor:
   - Open `user_profiles` table
   - Find your email
   - Verify `role` = `admin` and `plan` = `brand`

2. If not, run in SQL Editor:
   ```sql
   UPDATE user_profiles 
   SET role = 'admin', plan = 'brand'
   WHERE email = 'bitan@outreachpro.io';
   ```

3. Refresh the page

## ✅ Verify Everything Works

### Test Checklist:
- [ ] Can access http://localhost:5173
- [ ] Can sign up/sign in
- [ ] See Admin Panel button (shield icon)
- [ ] Admin Panel opens with 3 tabs
- [ ] Can switch between generation modes
- [ ] No console errors

## 🎨 Start Creating

1. **Select a Mode**: Product, Design, Apparel, Reimagine, or Video
2. **Configure Settings**: Adjust parameters in the right panel
3. **Upload Assets**: Drag & drop your images/products
4. **Generate**: Click the Generate button
5. **Download**: Save your AI-generated results

## 🚀 Next Steps

### Customize Your Instance
- [ ] Set subscription prices in Admin Panel
- [ ] Configure payment gateways (Stripe/Razorpay)
- [ ] Customize branding (logo, colors)
- [ ] Set up custom domain
- [ ] Configure email templates in Supabase

### Ready for Production?
See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Deploying to Vercel/Netlify/Firebase
- Setting up custom domain
- Configuring production environment
- SSL certificate setup
- Performance optimization

## 💡 Pro Tips

1. **Development**:
   - Keep Supabase dashboard open for monitoring
   - Use browser DevTools to debug
   - Check Network tab for API errors

2. **Testing**:
   - Create test users with different plans
   - Test generation limits
   - Verify payment flows

3. **Security**:
   - Never commit `.env` file
   - Rotate API keys regularly
   - Monitor usage in dashboards

## 🆘 Common Issues

### "Missing Supabase configuration"
- **Fix**: Ensure `.env` file exists and has correct values
- Restart dev server: `Ctrl+C` then `npm run dev`

### "Failed to fetch"
- **Fix**: Check Supabase project is active
- Verify credentials in `.env` are correct
- Check CORS settings in Supabase

### Google Sign-In not working
- **Fix**: Configure Google OAuth in Supabase first
- Add redirect URLs in Google Cloud Console
- Verify OAuth consent screen is set up

### Admin Panel not showing
- **Fix**: Verify you're signed in as `bitan@outreachpro.io`
- Check user role in Supabase Table Editor
- Run the SQL update script if needed

## 📚 Learn More

- [Complete Setup Guide](./SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Full README](./README.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)

## 🎉 You're All Set!

Your Klint Studios instance is now:
- ✅ Connected to Supabase backend
- ✅ Integrated with Google Gemini
- ✅ Super admin configured
- ✅ Ready for development

Start building amazing AI-powered visuals! 🚀

---

Need help? Check the documentation or review error messages in browser console.

