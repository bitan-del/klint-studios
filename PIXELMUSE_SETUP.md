# PixelMuse Setup Guide

## Step 1: Run Database Migration

**CRITICAL - Do this first!**

1. Open your Supabase dashboard:
   👉 https://app.supabase.com/project/qayasxoiikjmkuuaphwd

2. Click **SQL Editor** in the left sidebar

3. Click **"New Query"**

4. Open this file in your project:
   ```
   supabase/migrations/1000_pixel_muse_setup.sql
   ```

5. Copy **ALL** the contents (all ~150 lines)

6. Paste into the Supabase SQL Editor

7. Click the **Run** button (▶️)

8. You should see: ✅ "Success. No rows returned"

**This creates:**
- ✅ `pixel_muse_profiles` table
- ✅ `pixel_muse_generations` table
- ✅ All RLS policies
- ✅ All indexes and triggers

---

## Step 2: Verify Tables Were Created

1. In Supabase dashboard, click **Table Editor** (left sidebar)
2. You should see two new tables:
   - `pixel_muse_profiles` ✓
   - `pixel_muse_generations` ✓

---

## Step 3: Test Profile Creation

1. Start your app:
   ```bash
   npm run dev
   ```

2. Navigate to PixelMuse:
   - Go to Advanced Mode
   - Click "More options" (⋯)
   - Click "PixelMuse"

3. Click "New Profile"

4. Enter a profile name (e.g., "My First Profile")

5. Click "Create"

6. You should see the profile appear in the list!

---

## Troubleshooting

### Error: "Database tables not found"
- **Solution:** Run the migration file `1000_pixel_muse_setup.sql` in Supabase SQL Editor

### Error: "relation does not exist"
- **Solution:** The migration didn't run successfully. Check for SQL errors in Supabase and run again.

### Profile creation fails silently
- **Solution:** Check browser console (F12) for detailed error messages
- Check Supabase logs for database errors

### "Users can view their own pixel_muse_profiles" policy error
- **Solution:** The RLS policies might not have been created. Re-run the migration.

---

## What Gets Created

### Tables:
1. **pixel_muse_profiles** - Stores user profiles with style information
2. **pixel_muse_generations** - Stores generated images and post copy

### Security:
- Row Level Security (RLS) enabled on both tables
- Users can only see/modify their own profiles and generations

### Indexes:
- Fast lookups by user_id
- Fast sorting by created_at

---

**Status:** Ready to use after migration! 🎉

