# PixelMuse Profile Creation - Debug Guide

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Try creating a profile
4. Look for messages starting with:
   - 🎨 `[PixelMuse]` - Service layer logs
   - 🎨 `[Dashboard]` - UI layer logs

## Step 2: Check What Error You're Getting

The console will show detailed error information. Common errors:

### Error: "Database tables not found" or Code: `42P01` or `PGRST116`
**Solution:** Run the migration:
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/1000_pixel_muse_setup.sql`
3. Paste and run
4. Should see: "Success. No rows returned"

### Error: "User not authenticated"
**Solution:** 
- Make sure you're logged in
- Try logging out and back in
- Check if session expired

### Error: Code `23505` (Duplicate)
**Solution:** Profile name already exists. Choose a different name.

### Error: Code `23503` (Foreign Key)
**Solution:** User ID issue. Try logging out and back in.

## Step 3: Verify Database Tables Exist

1. Go to Supabase Dashboard
2. Click **Table Editor** (left sidebar)
3. You should see:
   - ✅ `pixel_muse_profiles`
   - ✅ `pixel_muse_generations`

If these tables don't exist, run the migration (see Step 2).

## Step 4: Test Direct Database Query

1. In Supabase SQL Editor, run:
```sql
SELECT * FROM pixel_muse_profiles LIMIT 1;
```

If this fails with "relation does not exist", the tables weren't created.

## Step 5: Check Authentication

In browser console, run:
```javascript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

If `user` is `null`, you need to log in.

## What the Logs Will Show

When you try to create a profile, you should see:

```
🎨 [Dashboard] Creating profile: My Profile
⏳ [Dashboard] Calling createPixelMuseProfile...
🎨 [PixelMuse] Starting profile creation...
📝 Profile name: My Profile
✅ [PixelMuse] User authenticated: [user-id] [email]
💾 [PixelMuse] Inserting data: {...}
✅ [PixelMuse] Profile created successfully: {...}
✅ [Dashboard] Profile created: {...}
✅ [Dashboard] State updated, profile should be visible
🏁 [Dashboard] Create profile flow completed
```

If you see an error instead, it will show:
```
❌ [PixelMuse] Database error: {...}
❌ [PixelMuse] Error code: [code]
❌ [PixelMuse] Error message: [message]
```

## Quick Fix Checklist

- [ ] Migration file run in Supabase SQL Editor
- [ ] Tables visible in Supabase Table Editor
- [ ] User is logged in
- [ ] Browser console shows detailed logs
- [ ] No JavaScript errors in console

## Still Not Working?

1. **Copy the full error message** from browser console
2. **Check Supabase logs**: Dashboard → Logs → API Logs
3. **Verify RLS policies**: The migration should have created them automatically

---

**Most Common Issue:** Database tables not created. Run the migration first!

