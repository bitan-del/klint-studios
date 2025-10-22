# Deployment Guide - Klint Studios

This guide covers deploying Klint Studios to production.

## Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Google OAuth configured (if using)
- [ ] Application tested locally
- [ ] Super admin account (`bitan@outreachpro.io`) created and verified

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel offers the best experience for Vite applications with automatic deployments.

#### Steps:

1. **Push to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/klint-studios.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   
3. **Add Environment Variables**:
   Go to Project Settings → Environment Variables and add:
   ```
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_APP_URL=https://your-domain.vercel.app
   ```

4. **Configure Domains**:
   - Project Settings → Domains
   - Add your custom domain or use Vercel subdomain

5. **Update Supabase Redirect URLs**:
   In Supabase dashboard → Authentication → URL Configuration:
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/**`

6. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically deploy on every push to main branch

### Option 2: Netlify

#### Steps:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Go to https://app.netlify.com/drop
   - Drag and drop the `dist` folder
   
   **OR** connect GitHub:
   - Go to https://app.netlify.com/start
   - Connect your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Configure Environment Variables**:
   Site Settings → Build & Deploy → Environment:
   ```
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_APP_URL=https://your-site.netlify.app
   ```

4. **Update Supabase Redirect URLs**:
   - Site URL: `https://your-site.netlify.app`
   - Redirect URLs: `https://your-site.netlify.app/**`

5. **Redeploy** to apply environment variables

### Option 3: Firebase Hosting

#### Steps:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase**:
   ```bash
   firebase init hosting
   ```
   - Choose your Firebase project
   - Public directory: `dist`
   - Configure as single-page app: Yes
   - Set up automatic builds with GitHub: Optional

4. **Build the application**:
   ```bash
   npm run build
   ```

5. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

6. **Configure Environment Variables**:
   Since Firebase Hosting doesn't support build-time env vars, you have options:
   
   **Option A**: Use Firebase Functions to serve env vars
   **Option B**: Create separate builds for production
   
   Create `firebase.json`:
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ],
       "headers": [
         {
           "source": "**",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "public, max-age=3600"
             }
           ]
         }
       ]
     }
   }
   ```

### Option 4: Self-Hosted (VPS/Cloud Server)

#### Requirements:
- Node.js installed
- Nginx or Apache web server
- PM2 or similar process manager

#### Steps:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Upload to server**:
   ```bash
   scp -r dist/* user@your-server:/var/www/klint-studios/
   ```

3. **Configure Nginx**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/klint-studios;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. **Enable SSL with Let's Encrypt**:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

5. **Set up environment variables** in build process on your CI/CD pipeline

## Post-Deployment Steps

### 1. Verify Deployment

- [ ] Visit your production URL
- [ ] Test user registration
- [ ] Test Google OAuth login
- [ ] Test image generation features
- [ ] Verify admin panel access
- [ ] Check all navigation links

### 2. Configure Production Settings

In Supabase Dashboard:

1. **Email Templates** (Authentication → Email Templates):
   - Customize confirmation email
   - Customize reset password email
   - Add your branding

2. **Rate Limiting** (Authentication → Rate Limits):
   - Configure to prevent abuse
   - Set appropriate limits

3. **Database Backups**:
   - Supabase Pro: Automatic daily backups
   - Free tier: Manual backups via SQL exports

### 3. Monitor Your Application

1. **Supabase Dashboard**:
   - Monitor database usage
   - Check authentication metrics
   - Review API logs

2. **Google Cloud Console** (for Gemini API):
   - Monitor API usage
   - Set up billing alerts
   - Review quotas

3. **Hosting Platform**:
   - Monitor bandwidth usage
   - Check build logs
   - Review error logs

### 4. Set Up Custom Domain (Optional)

#### For Vercel:
1. Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed

#### For Netlify:
1. Domain Settings → Add custom domain
2. Update DNS records

#### For Firebase:
1. Hosting → Connect domain
2. Follow Firebase's DNS setup

### 5. Enable Analytics (Optional)

Add Google Analytics or similar:

1. Create a Google Analytics property
2. Add tracking code to `index.html`:
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

## Environment-Specific Configurations

### Development
```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev_anon_key
VITE_GEMINI_API_KEY=dev_gemini_key
VITE_APP_URL=http://localhost:5173
```

### Staging
```env
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging_anon_key
VITE_GEMINI_API_KEY=staging_gemini_key
VITE_APP_URL=https://staging.yourdomain.com
```

### Production
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key
VITE_GEMINI_API_KEY=prod_gemini_key
VITE_APP_URL=https://yourdomain.com
```

## CI/CD Pipeline Example (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
        VITE_APP_URL: ${{ secrets.VITE_APP_URL }}
      run: npm run build
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

## Security Considerations

1. **API Keys**:
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **CORS Configuration** (in Supabase):
   - Set allowed origins to your production domain
   - Don't use wildcards (`*`) in production

3. **Rate Limiting**:
   - Configure in Supabase to prevent abuse
   - Monitor for unusual activity

4. **Database Security**:
   - RLS policies are enabled (from migration)
   - Regular security audits
   - Monitor Supabase logs

5. **HTTPS**:
   - Always use HTTPS in production
   - Enable HSTS headers

## Troubleshooting Deployment Issues

### Build Fails
- Check Node.js version (requires v16+)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`

### Environment Variables Not Working
- Ensure they start with `VITE_`
- Restart dev server after changes
- Check they're set in hosting platform
- Verify they're not in `.gitignore`

### OAuth Not Working in Production
- Update redirect URLs in Supabase
- Check Google Cloud Console OAuth settings
- Verify production URL is correct

### API Errors
- Check Supabase project is active
- Verify API keys are correct
- Check network tab for error details

## Scaling Considerations

As your app grows:

1. **Supabase**:
   - Upgrade to Pro for better performance
   - Enable Connection Pooling
   - Optimize database queries

2. **CDN**:
   - Vercel and Netlify include CDN
   - Consider Cloudflare for additional caching

3. **Database**:
   - Add indexes for frequently queried fields
   - Archive old generation history
   - Monitor query performance

4. **API Rate Limits**:
   - Monitor Gemini API usage
   - Implement client-side rate limiting
   - Cache responses where possible

## Maintenance

### Regular Tasks:
- [ ] Monitor Supabase usage weekly
- [ ] Check error logs
- [ ] Update dependencies monthly
- [ ] Backup database regularly
- [ ] Review and rotate API keys quarterly
- [ ] Monitor costs (Gemini API, Supabase, Hosting)

### Updates:
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update major versions (carefully)
npm install package@latest
```

---

**Your Klint Studios app is now production-ready!** 🚀

