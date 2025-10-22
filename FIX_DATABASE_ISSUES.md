# 🚨 CRITICAL FIX: Database Sync Issues

**Date**: October 21, 2025  
**Status**: ACTION REQUIRED ⚠️

---

## 🐛 **Problems Identified**

1. **Plan changes in Admin Panel don't save to Supabase**
2. **New users can access the app but don't appear in the database**
3. **Admin can't see all users in the Admin Panel**

---

## 🔍 **Root Cause**

The database trigger (`handle_new_user`) that automatically creates user profiles when someone signs up might be:
- Missing
- Broken
- Not executing due to permissions

**Result**: Users exist in `auth.users` but NOT in `user_profiles`, causing:
- No plan data
- No usage tracking
- Invisible to admin

---

## ✅ **THE FIX (3 Steps)**

### **Step 1: Run the Diagnosis & Fix Script**

1. **Go to Supabase Dashboard**
2. Click **SQL Editor** (left sidebar)
3. Click **"New query"**
4. **Copy and paste** the ENTIRE contents of:
   ```
   /scripts/diagnose-and-fix-all.sql
   ```
5. Click **"Run"** (or press `Cmd+Enter`)

**What this does**:
- ✅ Shows how many users are missing from `user_profiles`
- ✅ Creates profiles for all missing users
- ✅ Recreates the trigger with better error handling
- ✅ Fixes RLS policies for admin updates
- ✅ Verifies everything is working

---

### **Step 2: Verify the Fix**

After running the script, you should see output like:

```
table_name      | total_users
----------------|------------
auth.users      | 4
user_profiles   | 4

✅ All users are now in user_profiles!
```

**Check the user list**:
```sql
SELECT email, plan, role FROM user_profiles ORDER BY created_at DESC;
```

You should see ALL users including the new one!

---

### **Step 3: Test Plan Changes**

1. **In Supabase SQL Editor**, run:
   ```sql
   -- Update a user's plan
   UPDATE user_profiles 
   SET plan = 'solo' 
   WHERE email = 'triplancoleads@gmail.com';
   
   -- Verify it worked
   SELECT email, plan FROM user_profiles 
   WHERE email = 'triplancoleads@gmail.com';
   ```

2. **Expected output**:
   ```
   email                       | plan
   ----------------------------|------
   triplancoleads@gmail.com    | solo
   ```

3. **Now test from the app**:
   - Refresh browser
   - Open Admin Panel
   - Change a user's plan
   - Click "Save"
   - Run the SQL query again → Plan should be updated ✅

---

## 🧪 **Test New User Signup**

After running the fix:

1. **Open incognito window**
2. **Go to** http://localhost:5173/login.html
3. **Sign up with a new Google account**
4. **In Supabase**, run:
   ```sql
   SELECT email, plan, role, created_at 
   FROM user_profiles 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
5. **Expected**: New user appears immediately! ✅

---

## 📊 **What the Script Does (Detailed)**

### **Part 1: Diagnosis**
- Counts users in `auth.users` vs `user_profiles`
- Finds "orphaned" users (in auth but not in profiles)
- Checks if trigger and function exist

### **Part 2: Fix Orphaned Users**
- Creates `user_profiles` for any missing users
- Sets default plan to `free`
- Sets default role to `user`
- Sets admin users correctly

### **Part 3: Recreate Trigger**
- Drops old trigger (if broken)
- Creates new trigger with:
  - Better error handling
  - Logging for debugging
  - `ON CONFLICT DO NOTHING` to prevent duplicates
  - `SECURITY DEFINER` for proper permissions

### **Part 4: Fix RLS**
- Updates the admin UPDATE policy
- Uses explicit `USING` and `WITH CHECK` clauses
- Ensures admins can update any user's plan

### **Part 5: Verification**
- Shows total users in both tables
- Lists all users with their plans
- Confirms trigger is active

---

## 🔴 **If Still Not Working**

### **Issue: Plan changes still don't save**

**Check admin permissions**:
```sql
SELECT id, email, role FROM user_profiles WHERE email = 'bitan@outreachpro.io';
-- Should show: role = 'admin'
```

**Try manual update as admin**:
```sql
UPDATE user_profiles 
SET plan = 'brand' 
WHERE email = 'triplancoleads@gmail.com';
```

If this works in SQL but not in the app → Front-end issue  
If this FAILS in SQL → RLS blocking it

---

### **Issue: New users still not appearing**

**Check if trigger is firing**:
```sql
-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

**Check logs** (Supabase Dashboard → Logs):
- Look for: `Creating user profile for: [email]`
- Look for errors related to `handle_new_user`

---

## ✅ **Success Checklist**

After running the fix script:

- [ ] All existing users appear in `user_profiles`
- [ ] Admin can see all users in Admin Panel
- [ ] Plan changes save to database (verify with SQL)
- [ ] Plan changes reflect in user menu immediately
- [ ] New signups automatically create profiles
- [ ] New users appear in Admin Panel (after manual refresh)

---

## 🎯 **Quick Fix Commands**

**See all users**:
```sql
SELECT email, plan, role FROM user_profiles ORDER BY email;
```

**Make someone admin**:
```sql
UPDATE user_profiles SET role = 'admin' WHERE email = 'your@email.com';
```

**Change a plan**:
```sql
UPDATE user_profiles SET plan = 'brand' WHERE email = 'user@email.com';
```

**Reset usage**:
```sql
UPDATE user_profiles SET generations_used = 0, daily_generations_used = 0 WHERE email = 'user@email.com';
```

---

**Status**: Ready to Fix 🛠️  
**Action**: Run `/scripts/diagnose-and-fix-all.sql` in Supabase NOW!




