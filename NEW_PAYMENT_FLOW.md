# 🆕 New Payment Flow - Updated October 21, 2025

## 🎯 Major Changes

### ❌ What's Removed:
- **No free plan without payment details**
- Users cannot access the app without providing payment information
- No "free forever" option

### ✅ What's New:
1. **Mandatory 3-Day Trial with Payment Details**
   - All new users MUST enter credit card/UPI details
   - Trial is via Razorpay subscription mandate
   - No charge during 3-day trial period

2. **Auto-Charge After Trial**
   - After 3 days, Solo plan (₹1,178.82) is automatically charged
   - User receives full year access
   - Auto-renews annually unless cancelled

3. **Only Solo Plan for Self-Signup**
   - Solo is the ONLY plan users can select themselves
   - Studio and Brand require contacting support

4. **Manual Upgrades Only**
   - Users wanting Studio/Brand must contact support
   - Support team calculates pro-rated difference
   - Admin manually upgrades via Admin Panel

5. **Cancellation Anytime**
   - Users can cancel during trial (no charge)
   - Users can cancel after being charged (access until year ends)
   - Subscription Settings page for management

---

## 📋 Detailed Flow

### **New User Journey:**

```
1. User signs up with Google OAuth
   ↓
2. Payment Modal appears (MANDATORY - cannot close)
   ↓
3. User sees 3 plans:
   - Solo: "Start 3-Day Free Trial" button ✅
   - Studio: "Contact Support" button 📧
   - Brand: "Contact Support" button 📧
   ↓
4. User clicks "Start 3-Day Free Trial"
   ↓
5. Razorpay checkout opens with:
   - Subscription plan ID
   - ₹0 for trial period
   - Payment mandate setup (required)
   - Auto-charge after 3 days: ₹1,178.82
   ↓
6. User enters card/UPI details and authorizes mandate
   ↓
7. Razorpay creates subscription with 3-day trial
   ↓
8. Our system creates:
   - Payment record (₹0, status: 'trial')
   - Subscription record (status: 'trial', trial_end_date: +3 days)
   - Invoice (not generated yet - only after charge)
   ↓
9. Success screen:
   - "Trial Started!"
   - "You won't be charged for 3 days"
   - "Cancel anytime"
   ↓
10. User can now access the app
```

### **Day 3 - Auto-Charge:**

```
1. Razorpay automatically charges ₹1,178.82
   ↓
2. Webhook received (requires Edge Function - see below)
   ↓
3. Our system updates:
   - Subscription: status = 'active', end_date = +1 year
   - Payment: new record with ₹1,178.82
   - Invoice: GST invoice generated
   ↓
4. User receives:
   - Email notification
   - Invoice PDF
   - Full year access
```

---

## 🛠️ Implementation Details

### **Razorpay Plan Setup:**

In your Razorpay Dashboard, the Solo plan should be configured as:

```
Plan Name: Solo Plan (Annual)
Billing Interval: 12 months
Plan Amount: ₹117,882 (in paise, i.e., ₹1,178.82)
Trial Period: 3 days
Plan ID: plan_RWEqJmL9v1aJu2
```

### **Frontend Components:**

1. **PaymentModal.tsx** ✅
   - Shows 3 plans (Solo, Studio, Brand)
   - Solo: Opens Razorpay with mandate
   - Studio/Brand: Shows error to contact support

2. **PlanCard.tsx** ✅
   - Solo: "Start 3-Day Free Trial" button
   - Studio/Brand: "Contact Support" button (amber color)
   - Trial badge on Solo plan

3. **PaymentSuccess.tsx** ✅
   - Shows "Trial Started!" for trial
   - Shows days remaining
   - Cancellation instructions

4. **SubscriptionSettings.tsx** ✅ (NEW)
   - User's subscription dashboard
   - Shows trial status & days remaining
   - Cancel subscription button
   - Upgrade contact information

### **Backend Services:**

1. **razorpayService.ts** ✅
   - Only handles Solo plan
   - Studio/Brand return error to contact support
   - Uses `subscription_id` instead of `order_id`

2. **subscriptionService.ts** ✅
   - Creates trial subscription
   - Handles ₹0 payment for trial
   - Updates to active after charge

3. **Edge Functions** 🔴 (REQUIRED - Not Yet Implemented)
   - `razorpay-webhook` - Handle subscription charges
   - `cancel-subscription` - Cancel Razorpay subscription
   - `upgrade-subscription` - Admin upgrades (Studio/Brand)

---

## 🚫 User Restrictions

### **What Users CAN Do:**
- ✅ Start 3-day trial with Solo plan
- ✅ Cancel anytime during trial (no charge)
- ✅ Cancel after being charged (access till year ends)
- ✅ Contact support for Studio/Brand upgrade

### **What Users CANNOT Do:**
- ❌ Access app without payment details
- ❌ Get free plan without mandate
- ❌ Self-upgrade to Studio or Brand
- ❌ Bypass payment modal
- ❌ Use app after trial without charge

---

## 👑 Admin Capabilities

### **Admin Can:**
1. **Manually Upgrade Users**
   - Admin Panel → User Management
   - Select user → Change plan dropdown
   - Select Studio or Brand → Save
   - User immediately upgraded

2. **Collect Pro-Rated Payments**
   - User contacts support for upgrade
   - Admin calculates:
     ```
     Days remaining = (end_date - today) / 365
     Current plan value = Current_Total * Days_remaining
     New plan value = New_Total * Days_remaining
     Amount to collect = New plan value - Current plan value
     ```
   - Admin collects payment manually (bank transfer, etc.)
   - Admin upgrades in Admin Panel

3. **View All Subscriptions**
   - All user subscriptions visible
   - Filter by status (trial, active, cancelled, expired)
   - Export to CSV

---

## 💰 Pricing Summary

| Plan | Trial | After Trial | GST | Total | Self-Signup |
|------|-------|-------------|-----|-------|-------------|
| **Solo** | 3 days free | ₹999/year | ₹179.82 | **₹1,178.82** | ✅ Yes |
| **Studio** | N/A | ₹2,999/year | ₹539.82 | **₹3,538.82** | ❌ Contact Support |
| **Brand** | N/A | ₹4,999/year | ₹899.82 | **₹5,898.82** | ❌ Contact Support |

---

## 📧 Support Contact Flow

### **User Wants Studio/Brand:**

1. User clicks "Contact Support" on Studio/Brand card
2. Error message appears:
   ```
   "The Studio/Brand plan requires manual activation.
   Please contact our support team at support@klintstudios.com
   to upgrade. We'll collect the balance and activate your plan."
   ```

3. User emails support team

4. Support team:
   - Verifies user identity
   - Calculates pro-rated amount
   - Collects payment (manual process)
   - Informs admin

5. Admin:
   - Logs into Admin Panel
   - Finds user
   - Changes plan to Studio/Brand
   - Clicks "Save"

6. User immediately gets upgraded access

---

## 🔄 Cancellation Flow

### **During Trial (Days 1-3):**

```
1. User goes to Settings → Subscription
   ↓
2. Clicks "Cancel Subscription"
   ↓
3. Confirmation popup:
   "You will lose access after trial ends and won't be charged"
   ↓
4. User clicks "Yes, Cancel"
   ↓
5. Subscription status → 'cancelled'
   ↓
6. User can use app until trial_end_date
   ↓
7. After trial ends:
   - Subscription status → 'expired'
   - User loses access
   - Payment modal appears on next login
```

### **After Being Charged:**

```
1. User goes to Settings → Subscription
   ↓
2. Clicks "Cancel Subscription"
   ↓
3. Confirmation popup:
   "You'll have access until [end_date], but won't be charged again"
   ↓
4. User clicks "Yes, Cancel"
   ↓
5. Subscription:
   - status → 'cancelled'
   - auto_renew → false
   ↓
6. Razorpay subscription cancelled (via Edge Function)
   ↓
7. User retains access until original end_date
   ↓
8. After end_date:
   - Subscription status → 'expired'
   - User loses access
   - Payment modal appears on next login
```

---

## 🚀 What Needs to Be Done

### ✅ Already Implemented:
- [x] Updated types (removed 'free' plan)
- [x] Updated PaymentModal (3 plans, contact support for Studio/Brand)
- [x] Updated PlanCard (trial badge, contact button)
- [x] Updated razorpayService (subscription mandate)
- [x] Created SubscriptionSettings component
- [x] Updated documentation

### 🔴 Still Required:

1. **Run Migration in Supabase**
   - File: `supabase/migrations/002_payment_system.sql`
   - Creates subscriptions, payments, invoices tables

2. **Create Razorpay Plan in Dashboard**
   - Solo plan with 3-day trial
   - Verify plan ID: `plan_RWEqJmL9v1aJu2`

3. **Implement Edge Functions**
   - `razorpay-webhook.ts` - Handle auto-charge webhook
   - `cancel-subscription.ts` - Cancel Razorpay subscription
   - `upgrade-subscription.ts` - Admin upgrades

4. **Add Subscription Settings to App**
   - Create "Billing" tab in user settings
   - Integrate SubscriptionSettings component

5. **Test Complete Flow**
   - New user signup → trial → auto-charge
   - Cancellation during trial
   - Cancellation after charge
   - Manual upgrade flow

---

## 🎓 Key Learnings for User

- **Trial = Mandate Setup**: Even though it's free for 3 days, users MUST provide payment details
- **Auto-Charge is Mandatory**: Unless cancelled, charge happens automatically
- **No Self-Upgrade**: Studio/Brand require human interaction
- **Cancel Anytime**: Users have full control
- **Pro-Rated Upgrades**: Fair pricing when upgrading mid-year

---

## 📞 Support Email Template

```
Subject: Upgrade to [Studio/Brand] Plan

Hi Klint Studios,

I would like to upgrade my account to the [Studio/Brand] plan.

My account email: [user email]
Current plan: [Solo]
Requested plan: [Studio/Brand]

Please let me know the pro-rated amount and payment instructions.

Thank you!
```

---

**Status:** ✅ Implementation Complete  
**Next:** Run migration & create Edge Functions  
**Ready for:** Testing





