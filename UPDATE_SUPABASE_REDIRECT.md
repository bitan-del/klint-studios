# 🔧 Fix Supabase OAuth Redirect URL

**Date**: October 21, 2025  
**Status**: ACTION REQUIRED ⚠️

---

## 🐛 **The Problem**

Supabase is configured to redirect to `http://localhost:3000` but your app runs on `http://localhost:5173`.

**Result**: OAuth login fails because it redirects to the wrong port!

---

## ✅ **The Fix (2 Steps)**

### **Step 1: Update Supabase Dashboard** ⚠️ REQUIRED

1. **Go to Supabase Dashboard**: https://supabase.com
2. **Open your project**: Klint
3. **Click "Authentication"** (left sidebar, shield icon)
4. **Click "URL Configuration"**
5. **Find "Redirect URLs"** section
6. **Add these URLs**:
   ```
   http://localhost:5173
   http://localhost:5173/
   http://localhost:5173/index.html
   ```
7. **Remove** (if present):
   ```
   http://localhost:3000
   ```
8. **Click "Save"**

---

### **Step 2: Restart Dev Server** (Already Done ✅)

The `vite.config.ts` has been updated to use port `5173` (Vite's default).

**Restart the server**:
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🧪 **Test OAuth Login**

After updating Supabase:

1. **Go to**: http://localhost:5173/login.html
2. **Click "Continue with Google"**
3. **Login with Google**
4. **Expected**: Redirects back to `http://localhost:5173` ✅
5. **Expected**: You're logged in! ✅

---

## 📊 **How to Verify**

### **Before Fix:**
- Click "Login with Google"
- Redirects to Google ✅
- Comes back to `http://localhost:3000` ❌
- Error: "This site can't be reached" ❌

### **After Fix:**
- Click "Login with Google"
- Redirects to Google ✅
- Comes back to `http://localhost:5173` ✅
- Logs in successfully ✅

---

## 🚀 **For Production**

When you deploy to production, you'll need to add your production URL too:

**Example**:
```
https://klint-studios.vercel.app
https://klint-studios.vercel.app/
https://klint-studios.vercel.app/index.html
```

Add these in the same "Redirect URLs" section in Supabase Dashboard.

---

## 📋 **Quick Checklist**

- [ ] Open Supabase Dashboard
- [ ] Go to Authentication → URL Configuration
- [ ] Add `http://localhost:5173`
- [ ] Remove `http://localhost:3000` (if present)
- [ ] Click "Save"
- [ ] Restart dev server: `npm run dev`
- [ ] Test Google login
- [ ] Login should work! ✅

---

## 🆘 **If Still Not Working**

1. **Check Supabase Dashboard** → Authentication → URL Configuration
2. **Verify "Redirect URLs" shows**:
   - `http://localhost:5173` ✅
3. **Clear browser cache** (Cmd+Shift+R)
4. **Try logging in again**

**Console should show**:
```
✅ OAuth token found in URL hash
✅ OAuth Sign In Detected (INITIAL_SESSION): your@email.com
👤 Provider: google
```

---

**Status**: ⚠️ ACTION REQUIRED  
**Next Step**: Update Supabase Dashboard Redirect URLs NOW!




