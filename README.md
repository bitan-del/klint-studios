# Klint Studios

A powerful AI-powered image and video generation platform built with React, TypeScript, Vite, Supabase, and Google Gemini.

## ✨ Features

### 🎨 Generation Modes
- **Product Photography** - Create professional product shots with AI
- **Design Mockups** - Generate design mockups on apparel and products
- **Apparel Design** - Create apparel with custom designs
- **Reimagine** - Transform existing images with AI
- **Video Generation** - Create AI-generated videos

### 👤 User Management
- Google OAuth authentication
- Email/Password authentication
- User profiles with subscription plans
- Usage tracking and limits
- Daily and monthly generation quotas

### 💳 Subscription Plans
- **Free** - 3000 monthly generations, 100 daily limit
- **Solo Creator** - $25/month, 200 monthly generations
- **Studio** - $59/month, 600 monthly generations, advanced features
- **Brand** - $129/month, 2500 monthly generations, all features

### 🛠️ Admin Panel
- User management (view all users, modify plans)
- Payment gateway configuration (Stripe, Razorpay)
- Plan pricing management
- Multi-currency support (USD, EUR, INR)
- API key management
- Generation history tracking

### 🔒 Security
- Row-Level Security (RLS) in Supabase
- Secure authentication flows
- Protected admin routes
- Environment-based configuration
- API key encryption

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- A Supabase account
- Google Gemini API key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/klint-studios.git
cd klint-studios
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase Backend
Follow the detailed instructions in [SETUP.md](./SETUP.md)

Quick steps:
1. Create a Supabase project
2. Run the database migration from `supabase/migrations/001_initial_schema.sql`
3. Configure Google OAuth (optional)
4. Get your Supabase credentials

### 4. Configure Environment Variables
```bash
cp env.example .env
```

Edit `.env` with your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_APP_URL=http://localhost:5173
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### 6. Create Super Admin Account
1. Navigate to `http://localhost:5173/signup.html`
2. Sign up with `bitan@outreachpro.io`
3. The database will automatically grant admin privileges
4. You'll see the Admin Panel button in the header

## 📁 Project Structure

```
klint-studios/
├── components/          # React components
│   ├── apparel/        # Apparel generation components
│   ├── auth/           # Authentication pages
│   ├── chatbot/        # AI chatbot component
│   ├── design/         # Design mockup components
│   ├── model/          # 3D model components
│   ├── product/        # Product photography components
│   ├── reimagine/      # Image reimagining components
│   ├── settings/       # Settings panels
│   ├── shared/         # Shared/common components
│   ├── studio/         # Main studio view
│   └── video/          # Video generation components
├── constants/          # Constants and configuration
├── context/            # React Context providers
│   ├── AuthContext.tsx     # Authentication & user state
│   ├── StudioContext.tsx   # Studio app state
│   └── *Store.ts          # Zustand stores for each mode
├── services/           # API and service layers
│   ├── authService.ts      # Supabase auth wrapper
│   ├── databaseService.ts  # Database operations
│   ├── geminiService.ts    # Gemini API integration
│   ├── supabaseClient.ts   # Supabase client setup
│   └── permissionsService.ts # Permission checking
├── types/              # TypeScript type definitions
│   ├── database.ts         # Supabase database types
│   └── *.ts               # Feature-specific types
├── utils/              # Utility functions
├── supabase/
│   └── migrations/     # Database migration scripts
├── App.tsx             # Main app component
├── index.tsx          # App entry point
├── login.tsx          # Login page entry
├── signup.tsx         # Signup page entry
├── landing.tsx        # Landing page entry
├── SETUP.md           # Detailed setup guide
├── DEPLOYMENT.md      # Deployment guide
└── README.md          # This file
```

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL + Authentication)
- **AI**: Google Gemini API
- **State Management**: React Context + Zustand
- **Styling**: Tailwind CSS (custom classes in styles.css)
- **Icons**: Lucide React
- **File Upload**: React Dropzone

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Complete backend setup instructions
- [Deployment Guide](./DEPLOYMENT.md) - Deploy to production
- [Features Documentation](./FEATURES.md) - Detailed feature descriptions
- [Roadmap](./ROADMAP.md) - Future plans and features

## 🔑 Admin Features

As a super admin (`bitan@outreachpro.io`), you have access to:

### User Management
- View all registered users
- See usage statistics for each user
- Modify user subscription plans
- Track daily and monthly generation limits

### Payment Configuration
- Configure Stripe payment gateway
- Configure Razorpay payment gateway
- Manage API keys securely

### Plan Management
- Adjust pricing for all subscription plans
- Change currency (USD, EUR, INR)
- Update plan limits and features

### Integration Management
- Configure Google Gemini API key
- View Supabase connection status
- Monitor API usage

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

### Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the frontend:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_GEMINI_API_KEY` - Your Google Gemini API key
- `VITE_APP_URL` - Your application URL

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy options:
- **Vercel** (Recommended) - One-click deploy with GitHub integration
- **Netlify** - Drag-and-drop or GitHub deploy
- **Firebase Hosting** - Deploy with Firebase CLI
- **Self-hosted** - Deploy on your own VPS

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/klint-studios)

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/klint-studios)

## 🔐 Security

- All sensitive data stored in environment variables
- Row-Level Security (RLS) enabled on all database tables
- Secure authentication with Supabase Auth
- API keys never exposed to client
- HTTPS enforced in production
- OAuth redirect URL validation

## 📈 Monitoring & Analytics

### Supabase Dashboard
- Monitor database usage
- View authentication metrics
- Check API request logs
- Database performance

### Google Cloud Console
- Gemini API usage tracking
- Set up billing alerts
- Monitor API quotas

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 💬 Support

For issues or questions:
1. Check the [SETUP.md](./SETUP.md) guide
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
3. Check browser console for errors
4. Review Supabase logs in dashboard

## 🎯 Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features and improvements.

Upcoming features:
- [ ] Batch processing (Brand plan)
- [ ] Advanced post-production suite
- [ ] Team collaboration features
- [ ] API access for developers
- [ ] Mobile application
- [ ] Advanced analytics dashboard

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com)
- Powered by [Google Gemini](https://ai.google.dev)
- UI components inspired by modern design systems
- Icons by [Lucide](https://lucide.dev)

---

**Made with ❤️ for creators and brands**

For more information, visit [your-website.com]
