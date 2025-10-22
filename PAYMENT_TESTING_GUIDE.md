# Payment System Testing Guide

## 🎯 Overview
This guide will help you test the complete payment system end-to-end.

---

## 📋 Pre-Testing Setup

### 1. **Run the Payment Migration**

First, you need to apply the payment system database migration in Supabase:

```sql
-- Go to your Supabase Dashboard → SQL Editor → Run this migration:
-- File: supabase/migrations/002_payment_system.sql
```

This will create:
- `subscriptions` table
- `payments` table
- `invoices` table
- `invoice_counter` table
- Required functions: `calculate_gst()`, `generate_invoice_number()`, `check_subscription_status()`, `create_subscription()`
- RLS policies for all tables

### 2. **Configure Razorpay in Admin Panel**

1. **Login as admin** (`bitan@outreachpro.io`)
2. **Open Admin Panel** (click "Admin Panel" button in header)
3. **Go to "Payment Settings" tab**
4. **Enter your Razorpay keys:**
   - **Key ID**: `your_razorpay_key_id`
   - **Key Secret**: `your_razorpay_key_secret`
5. **Click "Save Razorpay Keys"**

### 3. **Verify Razorpay Plan IDs**

The following Razorpay plan IDs are already configured in `services/razorpayService.ts`:

```typescript
const RAZORPAY_PLAN_IDS = {
  free: null, // No Razorpay plan needed for free
  solo: 'plan_RWEqJmL9v1aJu2',
  studio: 'plan_RWEr3jmdBjVExE',
  brand: 'plan_RWErZhQtFet8FP',
};
```

Make sure these match what you created in your Razorpay Dashboard.

---

## 🧪 Test Scenarios

### **Scenario 1: New User - Free Trial** ✅

**Expected Flow:**
1. New user signs up with Google OAuth
2. User is redirected to the app
3. **Payment Modal appears immediately** (mandatory on first login)
4. User clicks "Start Free Trial" on the Free plan
5. No Razorpay checkout (free plan bypasses payment)
6. Success screen appears with "Trial Started!" message
7. Subscription is created in database with:
   - Status: `trial`
   - 3-day trial period
   - Plan: `free`
8. User can now use the app

**How to Test:**
- Create a new Google account or use an existing one that hasn't logged in before
- Sign in via Google OAuth
- Observe the payment modal
- Click "Start Free Trial"
- Verify success screen
- Check Supabase database:
  ```sql
  SELECT * FROM subscriptions WHERE user_id = 'your_user_id';
  SELECT * FROM payments WHERE user_id = 'your_user_id';
  ```

---

### **Scenario 2: New User - Paid Plan (Solo)** 💳

**Expected Flow:**
1. New user signs up with Google OAuth
2. Payment Modal appears
3. User clicks "Select Solo" button
4. **Razorpay checkout opens** with:
   - Amount: ₹1,178.82 (₹999 + 18% GST)
   - Subscription ID from your Razorpay plan
   - Mandate for auto-debit
5. User completes payment (test mode)
6. Razorpay returns success response
7. Payment record created in database
8. Subscription created with:
   - Status: `active`
   - Plan: `solo`
   - Start date: today
   - End date: today + 1 year
9. Invoice generated with invoice number (e.g., `INV-2025-0001`)
10. Success screen appears
11. User can download GST invoice PDF

**How to Test:**
- Create a new Google account
- Sign in via Google OAuth
- Click "Select Solo"
- Complete Razorpay test payment (use test cards)
- Verify success screen
- Click "Download GST Invoice"
- Check downloaded PDF
- Verify database records:
  ```sql
  SELECT * FROM subscriptions WHERE user_id = 'your_user_id';
  SELECT * FROM payments WHERE user_id = 'your_user_id';
  SELECT * FROM invoices WHERE user_id = 'your_user_id';
  ```

---

### **Scenario 3: Existing User - No Active Subscription** ⚠️

**Expected Flow:**
1. User (who previously had a trial/subscription that expired) logs in
2. `check_subscription_status()` runs in background
3. Function returns `needs_payment: true`
4. Payment Modal appears
5. User must select a plan to continue
6. Follow same flow as Scenario 1 or 2

**How to Test:**
- Manually expire a subscription in Supabase:
  ```sql
  UPDATE subscriptions 
  SET status = 'expired', end_date = NOW() - INTERVAL '1 day' 
  WHERE user_id = 'your_user_id';
  ```
- Log out and log in again
- Verify payment modal appears

---

### **Scenario 4: Existing User - Active Subscription** ✅

**Expected Flow:**
1. User with active subscription logs in
2. `check_subscription_status()` runs
3. Function returns `needs_payment: false`
4. **No payment modal appears**
5. User goes straight to the app

**How to Test:**
- Login with a user who already has an active subscription
- Verify no payment modal appears
- Check console logs for subscription check

---

### **Scenario 5: Admin User** 👑

**Expected Flow:**
1. Admin logs in (`bitan@outreachpro.io`)
2. Admin has `brand` plan by default (set in database)
3. **No payment modal appears** (admins bypass payment)
4. Admin can access Admin Panel
5. Admin can view all users, subscriptions, and payments

**How to Test:**
- Login as admin
- Verify no payment modal
- Open Admin Panel
- Check user management

---

### **Scenario 6: Invoice Generation** 📄

**Expected Flow:**
1. User completes paid plan purchase
2. Invoice is automatically created in database
3. User clicks "Download GST Invoice" on success screen
4. PDF is generated with:
   - Company details (Klint Studios)
   - User details (email, GST number if provided)
   - Invoice number (auto-incrementing)
   - Plan details
   - Base amount
   - GST (18%)
   - Total amount
   - Payment info (Razorpay transaction ID)
5. PDF downloads to user's computer

**How to Test:**
- Complete a paid plan purchase
- Click "Download GST Invoice"
- Open the PDF
- Verify all details are correct
- Check GST calculation: `base_amount * 0.18 = gst_amount`

---

### **Scenario 7: Payment Failure** ❌

**Expected Flow:**
1. User selects a paid plan
2. Razorpay checkout opens
3. User cancels or payment fails
4. Error message appears in Payment Modal
5. User can try again
6. No records created in database

**How to Test:**
- Select a paid plan
- Cancel Razorpay checkout
- Verify error message appears
- Try selecting the plan again
- Verify no incomplete records in database

---

### **Scenario 8: Subscription Auto-Renewal** 🔄

**Expected Flow:**
1. Razorpay automatically charges user after 1 year
2. Webhook is received (requires Edge Function - not yet implemented)
3. Subscription `end_date` is extended by 1 year
4. New payment record is created
5. New invoice is generated
6. User receives email notification (optional)

**Note:** This requires Razorpay webhooks and Edge Functions (next phase).

---

## 🛠️ Database Verification

After each test, verify the database state:

### Check User Profile
```sql
SELECT id, email, plan, role FROM user_profiles WHERE email = 'test@example.com';
```

### Check Subscriptions
```sql
SELECT * FROM subscriptions WHERE user_id = 'user_id_here' ORDER BY created_at DESC;
```

### Check Payments
```sql
SELECT * FROM payments WHERE user_id = 'user_id_here' ORDER BY created_at DESC;
```

### Check Invoices
```sql
SELECT * FROM invoices WHERE user_id = 'user_id_here' ORDER BY created_at DESC;
```

### Check Subscription Status
```sql
SELECT * FROM check_subscription_status('user_id_here');
```

---

## 🐛 Common Issues & Fixes

### Issue: Payment Modal doesn't appear for new users
**Fix:** Check `check_subscription_status` function is working and `needsPayment` state is being set in AuthContext.

### Issue: Razorpay checkout doesn't open
**Fix:** 
- Verify Razorpay keys are saved in Admin Panel
- Check browser console for errors
- Ensure Razorpay script is loaded (`razorpayService.ts`)

### Issue: Free plan triggers Razorpay
**Fix:** Check `razorpayService.ts` - free plan should bypass Razorpay and call `onSuccess` directly.

### Issue: Invoice PDF is blank or has errors
**Fix:** Check `invoiceGenerator.ts` - verify all data is being fetched from Supabase correctly.

### Issue: GST calculation is wrong
**Fix:** Verify `calculate_gst()` function in Supabase returns `base_amount * 0.18`.

---

## ✅ Success Criteria

- ✅ New users see payment modal on first login
- ✅ Free trial works without Razorpay
- ✅ Paid plans open Razorpay checkout
- ✅ Payment success creates subscription
- ✅ Payment success creates invoice
- ✅ Invoice PDF downloads correctly
- ✅ GST is calculated correctly (18%)
- ✅ Existing users with active subscription bypass payment modal
- ✅ Expired subscriptions trigger payment modal
- ✅ Admin users bypass payment modal
- ✅ Payment failures show error messages
- ✅ All database tables are populated correctly

---

## 🚀 Next Steps

Once all tests pass:
1. **Implement Razorpay Webhooks** (Edge Functions)
2. **Add invoice viewing in user settings**
3. **Implement subscription cancellation**
4. **Add email notifications**
5. **Deploy to production**

---

## 📞 Support

If you encounter issues during testing:
1. Check browser console logs
2. Check Supabase logs
3. Verify Razorpay Dashboard
4. Review this testing guide

---

**Good luck with testing! 🎉**




