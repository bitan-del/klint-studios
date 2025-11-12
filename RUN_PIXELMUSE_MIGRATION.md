# 🚀 Run PixelMuse Migration - QUICK FIX

## The Error You're Seeing:
```
Could not find the table 'public.pixel_muse_profiles' in the schema cache (Code: PGRST205)
```

**This means:** The database tables haven't been created yet.

---

## ✅ SOLUTION: Run the Migration (2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to: https://app.supabase.com/project/qayasxoiikjmkuuaphwd
2. Click **SQL Editor** in the left sidebar
3. Click **"New Query"** button

### Step 2: Copy the Migration File
1. Open this file in your project:
   ```
   supabase/migrations/1000_pixel_muse_setup.sql
   ```
2. **Select ALL** (Cmd+A or Ctrl+A)
3. **Copy** (Cmd+C or Ctrl+C)

### Step 3: Paste and Run
1. **Paste** into the Supabase SQL Editor
2. Click the **Run** button (▶️) or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
3. Wait for: ✅ **"Success. No rows returned"**

### Step 4: Verify Tables Were Created
1. In Supabase dashboard, click **Table Editor** (left sidebar)
2. You should see:
   - ✅ `pixel_muse_profiles`
   - ✅ `pixel_muse_generations`

### Step 5: Refresh Your App
1. Go back to your app (localhost:3000)
2. **Refresh the page** (F5 or Cmd+R)
3. Try creating a profile again - it should work now! 🎉

---

## 🔍 Quick Verification Query

After running the migration, you can verify it worked by running this in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'pixel_muse%';
```

You should see:
- `pixel_muse_profiles`
- `pixel_muse_generations`

---

## ⚠️ If You Get Errors

### Error: "relation already exists"
- **Good news!** Tables might already exist
- Try refreshing your app first
- If still not working, check Table Editor to see if tables exist

### Error: "permission denied"
- Make sure you're logged into Supabase as the project owner
- Check that you have the right project selected

### Error: "syntax error"
- Make sure you copied the ENTIRE file (all 149 lines)
- Check for any missing semicolons

---

## 📝 What This Migration Creates

- ✅ `pixel_muse_profiles` table - Stores your style profiles
- ✅ `pixel_muse_generations` table - Stores generated images
- ✅ Row Level Security (RLS) policies - Users can only see their own data
- ✅ Indexes - For fast queries
- ✅ Triggers - Auto-update timestamps

---

**After running this, profile creation will work!** 🚀

