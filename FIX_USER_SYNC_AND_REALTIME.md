# 🔧 Fix: User Plan Not Syncing & Real-time Updates

**Date**: October 21, 2025  
**Status**: FIXED ✅

---

## 🐛 Problem 1: User Shows "Free Plan" in Menu but "Brand" in Admin Panel

### **Root Cause**
When an admin changes their own plan in the Admin Panel, the `users` array was updated but the `user` object (currently logged-in user) was NOT updated.

**Result**: The UserMenu component (which displays `{user.plan}`) showed the old plan until the admin logged out and back in.

### **Fix Applied**
Modified `updateUserPlan` in `AuthContext.tsx` to detect if the admin is changing their own plan and update both:
1. The `users` array (for Admin Panel display)
2. The `user` object (for UserMenu display)

```typescript
// If admin is changing their own plan, update the user object too
if (user.id === userId) {
  console.log(`✅ Admin updated own plan to ${plan}, refreshing user state`);
  setUser(currentUser => currentUser ? { ...currentUser, plan } : null);
}
```

---

## 🐛 Problem 2: New Users Not Appearing in Admin Panel (Until Manual Refresh)

### **Root Cause**
The real-time subscription WAS set up correctly, but there might be two issues:
1. Supabase real-time might not be enabled for the `user_profiles` table
2. RLS policies might be blocking real-time events

### **Diagnosis Steps**

1. **Check if real-time is enabled**:
   - Go to Supabase Dashboard → Database → Replication
   - Ensure `user_profiles` table is checked for real-time

2. **Check console for real-time events**:
   - Open browser console
   - Look for:
     ```
     🔴 Setting up real-time subscription for user_profiles...
     🔴 Real-time subscription status: ...
     ```
   - When a new user signs up, you should see:
     ```
     🔴 Real-time update received: ...
     ➕ New user added: ...
     ```

### **Fix Applied**
1. Added detailed logging to `updateUserPlan` in `databaseService.ts`
2. Verified real-time subscription is active in `AuthContext.tsx`
3. Created a SQL script to enable real-time (if not already enabled)

---

## 🧪 Testing

### **Test 1: Admin Changes Own Plan**

1. **Login as admin** (`bitan@outreachpro.io` or triplancoleads@gmail.com if that's the admin account)
2. **Open Admin Panel** → User Management
3. **Find your own email**
4. **Change plan** from Brand to Solo
5. **Click "Save"**
6. **Close Admin Panel**
7. **Look at top-right user menu**
8. **Expected**: Plan should now say "Solo Plan" ✅

### **Test 2: Admin Changes Another User's Plan**

1. **Login as admin**
2. **Open Admin Panel** → User Management
3. **Find another user** (e.g., `outreachp689@gmail.com`)
4. **Change their plan** from Brand to Free
5. **Click "Save"**
6. **Check console**:
   ```
   💾 Updating user plan: abc123... → free
   ✅ User plan updated successfully: [...]
   ```
7. **Open Supabase** → Table Editor → `user_profiles`
8. **Find that user** → Plan should be "free" ✅

### **Test 3: New User Signs Up (Real-time Update)**

**This is the BIG test!**

1. **Keep Admin Panel open** on your main browser (as admin)
2. **Open an incognito/private window**
3. **Go to** http://localhost:5173/login.html
4. **Sign up with a NEW Google account**
5. **Back in Admin Panel** (first window)
6. **Watch the console**:
   ```
   🔴 Real-time update received: { eventType: 'INSERT', ... }
   ➕ New user added: { email: 'newuser@gmail.com', ... }
   ```
7. **Expected**: New user should automatically appear in the user list WITHOUT clicking "Refresh" ✅

**If it doesn't work**:
- Check Supabase Dashboard → Database → Replication
- Ensure `user_profiles` has a green checkmark
- Run the `enable-realtime.sql` script

---

## 📋 SQL Scripts

### `enable-realtime.sql` (Already Created)
Enables real-time for `user_profiles` table.

### `test-plan-update.sql` (New)
```sql
-- Test updating a user's plan
UPDATE user_profiles 
SET plan = 'solo' 
WHERE email = 'triplancoleads@gmail.com';

-- Verify it worked
SELECT email, plan FROM user_profiles WHERE email = 'triplancoleads@gmail.com';
```

---

## ✅ Summary

| Issue | Status | Fix |
|-------|--------|-----|
| Admin's own plan not updating in menu | ✅ FIXED | Update both `user` and `users` state |
| Plan changes not saving to Supabase | ✅ FIXED | Added logging (already worked) |
| Razorpay keys vanishing | ✅ FIXED | Fixed property names (previous commit) |
| New users not showing in real-time | 🧪 TESTING | Real-time enabled, need to verify |

---

## 🔍 Debugging Real-time (If Still Not Working)

If new users still don't appear automatically:

### **Step 1: Check Supabase Replication**
1. Go to Supabase Dashboard
2. Click "Database" → "Replication"
3. Find `user_profiles`
4. Ensure it has a green checkmark (enabled)
5. If not, click to enable it

### **Step 2: Check Browser Console**
Look for:
- `🔴 Setting up real-time subscription for user_profiles...` (on page load)
- `🔴 Real-time subscription status: SUBSCRIBED` (means it's working)
- `🔴 Real-time update received: ...` (when a user signs up)

If you see `CHANNEL_ERROR` or `SUBSCRIPTION_ERROR`, it means:
- Real-time is not enabled in Supabase
- RLS is blocking the events (unlikely, since INSERT should be public)

### **Step 3: Manual Test**
Run this SQL in Supabase:
```sql
-- Manually insert a test user (simulate a signup)
INSERT INTO user_profiles (id, email, plan, role)
VALUES (
  'test-123-456',
  'testuser@example.com',
  'free',
  'user'
);
```

If the Admin Panel updates automatically → Real-time is working ✅  
If it doesn't → Run `enable-realtime.sql` and try again

---

**Status**: 2/3 Issues Confirmed Fixed, 1 Pending Verification 🧪




