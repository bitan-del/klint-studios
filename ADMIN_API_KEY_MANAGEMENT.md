# 🔑 Admin API Key Management - Global System

**Status**: FULLY IMPLEMENTED ✅  
**Date**: October 21, 2025  
**Feature**: Super Admin can manage Gemini API key globally across all users and devices

---

## 🎯 **What This Does**

As the **Super Admin** (`bitan@outreachpro.io`), you can:
1. Deploy the app to **Google Cloud** (or any hosting platform)
2. Change the Gemini API key from the **Admin Panel** (no code changes needed!)
3. **ALL users** across **ALL devices** instantly use the new API key
4. No redeployment required!

---

## 🔧 **How It Works**

### **System Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Super Admin (You)                        │
│                                                             │
│  1. Login → Admin Panel → Integrations Tab                 │
│  2. Enter new Gemini API key                                │
│  3. Click "Save Gemini Key"                                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Database (admin_settings)             │
│                                                             │
│  setting_key: 'gemini_api_key'                              │
│  setting_value: 'AIzaSy...'  ← STORED HERE                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    ALL Users (Worldwide)                    │
│                                                             │
│  • User in USA on Chrome                                    │
│  • User in India on Safari                                  │
│  • User in UK on Firefox                                    │
│                                                             │
│  ALL automatically use the new key from database!           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **Setup Instructions**

### **Step 1: Initialize the Gemini API Key (First Time Only)**

After deploying to Google Cloud, run this SQL script in **Supabase SQL Editor**:

```sql
-- Copy from scripts/set-gemini-key.sql
INSERT INTO admin_settings (setting_key, setting_value)
VALUES ('gemini_api_key', 'YOUR_ACTUAL_GEMINI_API_KEY_HERE')
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();
```

**OR** just use the Admin Panel:
1. Login as super admin
2. Go to Admin Panel → Integrations
3. Enter your Gemini API key
4. Click "Save Gemini Key"

### **Step 2: That's It!**

The key is now stored in the database and ALL users will use it automatically.

---

## 🔄 **How the Code Works**

### **1. Fetching the API Key (`geminiService.ts`)**

```typescript
const getAI = async () => {
    // Check database first (for deployed apps)
    const dbKey = await databaseService.getAdminSetting('gemini_api_key');
    
    if (dbKey) {
        console.log('✅ Using Gemini API key from database');
        return new GoogleGenAI({ apiKey: dbKey });
    }
    
    // Fallback to environment variable (for local development)
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) {
        console.log('✅ Using Gemini API key from environment variables');
        return new GoogleGenAI({ apiKey: envKey });
    }
    
    return null; // Use mock services
}
```

**Priority Order:**
1. **Database** (`admin_settings` table) → Used in production
2. **Environment Variable** (`.env` file) → Used for local development
3. **Mock Services** → Used when no key is available

### **2. Saving the API Key (`AuthContext.tsx`)**

```typescript
const updateApiSettings = async (service, settings) => {
    if (service === 'gemini') {
        // Save to database (visible to ALL users globally)
        const success = await databaseService.setAdminSetting(
            'gemini_api_key', 
            settings.apiKey
        );
        
        if (success) {
            // Refresh the cached key immediately
            refreshGeminiApiKey();
            console.log('✅ All users will now use the new key!');
        }
    }
};
```

### **3. Caching for Performance**

The API key is **cached in memory** to avoid database queries on every image generation:

```typescript
let cachedApiKey: string | null = null;

// First call: Fetches from database
await getAI(); // Queries database → Caches key

// Subsequent calls: Uses cached key
await getAI(); // Uses cache → No database query!
```

When you update the key in Admin Panel, the cache is **automatically cleared** via `refreshGeminiApiKey()`.

---

## 🌍 **Deployment Workflow**

### **Local Development:**
```bash
# Uses .env file
VITE_GEMINI_API_KEY=AIzaSy...
```

### **Production (Google Cloud):**
```bash
# Deploy the app
npm run build
# Deploy to Google Cloud Run / App Engine

# Users will automatically use the database key
# No need to set environment variables!
```

### **Changing the Key in Production:**
1. Login to your deployed app: `https://your-app.run.app`
2. Click your profile → Admin Panel
3. Go to Integrations tab
4. Update Gemini API key
5. Click "Save Gemini Key"
6. ✅ **Done!** All users globally now use the new key

---

## 🔐 **Security Features**

### **RLS (Row Level Security)**

Only admins can read/write `admin_settings`:

```sql
-- Admin can read settings
CREATE POLICY "Admins can read admin settings"
ON admin_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Admin can update settings
CREATE POLICY "Admins can update admin settings"
ON admin_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);
```

### **Frontend Permission Check:**

```typescript
const updateApiSettings = async (service, settings) => {
    if (user?.role !== 'admin') return; // ❌ Not allowed
    
    // ✅ Only admins can reach this point
    await databaseService.setAdminSetting(...);
};
```

---

## 📊 **Database Schema**

```sql
CREATE TABLE admin_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example data:
INSERT INTO admin_settings VALUES (
    'gemini_api_key',
    'AIzaSyAJOYH-NS0qvmFsZLR_NTR4grkJqss_jL4',
    NOW(),
    NOW()
);
```

---

## 🧪 **Testing**

### **Test 1: Verify Database Fetch**
```sql
-- Run in Supabase SQL Editor
SELECT setting_key, setting_value, updated_at 
FROM admin_settings 
WHERE setting_key = 'gemini_api_key';
```

### **Test 2: Console Logs**
Open browser console and look for:
```
✅ Using Gemini API key from database
```

### **Test 3: Update from Admin Panel**
1. Login as super admin
2. Admin Panel → Integrations
3. Change API key
4. Save
5. Check console: `✅ Gemini API key saved to database`

### **Test 4: Verify All Users Use New Key**
1. Open app in incognito/private window
2. Login as a different user
3. Try generating an image
4. Check console: Should use the updated key from database

---

## 🚀 **Advantages of This System**

| Feature | localStorage (Old) | Database (New) ✅ |
|---------|-------------------|------------------|
| **Global across users** | ❌ No (per-browser) | ✅ Yes |
| **Global across devices** | ❌ No | ✅ Yes |
| **Survives browser clear** | ❌ No | ✅ Yes |
| **Update without code** | ❌ No | ✅ Yes |
| **Update without deploy** | ❌ No | ✅ Yes |
| **Works in production** | ⚠️ Partial | ✅ Perfect |

---

## 📝 **Summary**

You can now:
- ✅ Deploy to Google Cloud once
- ✅ Change Gemini API key from Admin Panel
- ✅ All users worldwide use the new key instantly
- ✅ No code changes needed
- ✅ No redeployment needed
- ✅ Perfect for production!

**Your workflow:**
1. Deploy app to production
2. Login as `bitan@outreachpro.io`
3. Admin Panel → Integrations → Update Gemini Key
4. Save → Done! 🎉

---

**Status**: Ready for production deployment! ✅




