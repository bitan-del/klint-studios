# 💳 Payment System - Implementation Guide

**Date**: October 21, 2025  
**Status**: READY TO IMPLEMENT

---

## 📋 **Quick Summary**

This guide will help you implement:
- ✅ Payment popup on first login
- ✅ Razorpay mandate setup (auto-debit)
- ✅ 3-day free trial
- ✅ Annual subscriptions (auto-renew)
- ✅ 18% GST on all plans
- ✅ Downloadable GST invoices (PDF)

---

## 🚀 **Step-by-Step Implementation**

### **STEP 1: Run Database Migration** ⚠️ DO THIS FIRST

1. **Go to Supabase Dashboard**
2. **Click SQL Editor**
3. **Open the file**: `supabase/migrations/002_payment_system.sql`
4. **Copy ALL contents**
5. **Paste in SQL Editor**
6. **Click "Run"**

**This creates**:
- `subscriptions` table
- `payments` table
- `invoices` table
- `invoice_counter` table
- Helper functions for GST calculation
- Invoice number generator
- RLS policies

---

### **STEP 2: Install Required Packages**

```bash
npm install razorpay jspdf jspdf-autotable date-fns
```

**What these do**:
- `razorpay` - Razorpay SDK for payments
- `jspdf` - Generate PDF invoices
- `jspdf-autotable` - Tables in PDF
- `date-fns` - Date calculations

---

### **STEP 3: Setup Razorpay**

#### **A. Create Razorpay Account**
1. Go to https://razorpay.com
2. Sign up / Login
3. Get your keys from Dashboard → Settings → API Keys
   - Test Key ID
   - Test Key Secret

#### **B. Create Subscription Plans in Razorpay**

Go to Razorpay Dashboard → Subscriptions → Plans → Create Plan

**Create 3 plans** (No plan needed for Free):

1. **Solo Plan**
   - Plan ID: `plan_solo_annual`
   - Amount: ₹117882 (₹1,178.82 in paise)
   - Billing Interval: 1 year
   - Description: "Solo Creator - Annual"

2. **Studio Plan**
   - Plan ID: `plan_studio_annual`
   - Amount: ₹353882 (₹3,538.82 in paise)
   - Billing Interval: 1 year
   - Description: "Studio - Annual"

3. **Brand Plan**
   - Plan ID: `plan_brand_annual`
   - Amount: ₹589882 (₹5,898.82 in paise)
   - Billing Interval: 1 year
   - Description: "Brand - Annual"

#### **C. Save Razorpay Keys to Admin Settings**

1. Login as admin
2. Open Admin Panel → Integrations
3. Enter Razorpay Key ID and Key Secret
4. Click "Save Razorpay Keys"

---

### **STEP 4: Create Payment Modal Component**

I'll create this next! The modal will:
- Show all plans with GST breakdown
- Highlight differences between plans
- Integrate Razorpay checkout
- Handle success/failure
- Generate invoice on success

---

### **STEP 5: Add Webhook Handler**

Razorpay will send webhooks for:
- `subscription.charged` - Auto-renewal successful
- `subscription.cancelled` - User cancelled
- `subscription.halted` - Payment failed

We'll need a server endpoint to handle these (can use Supabase Edge Functions).

---

### **STEP 6: Create Invoice Generator**

PDF invoice with:
- Invoice number (auto-generated)
- User details
- Plan details
- GST breakdown
- Payment details

---

### **STEP 7: Add Download Buttons**

- User dashboard: "Download Invoice"
- Admin panel: "View All Invoices"

---

## 💰 **Pricing with GST (18%)**

```
Plan        Base      GST (18%)    Total
--------------------------------------------
Free        ₹0        ₹0           ₹0
Solo        ₹999      ₹179.82      ₹1,178.82
Studio      ₹2,999    ₹539.82      ₹3,538.82
Brand       ₹4,999    ₹899.82      ₹5,898.82
```

---

## 🔄 **User Flow**

### **First Login (New User)**

```
1. User logs in with Google
   ↓
2. Check if user has active subscription
   ↓
3. If NO subscription:
   - Show Payment Modal (REQUIRED, can't close)
   - Display all plans with GST
   - Show plan features comparison
   ↓
4. User selects a plan:
   
   FREE PLAN:
   - "Start 3-Day Free Trial"
   - Setup Razorpay mandate (₹0 now)
   - After 3 days: Auto-charge or prompt to upgrade
   
   PAID PLAN:
   - "Pay ₹[amount] + GST"
   - Setup Razorpay mandate
   - Charge immediately
   - Subscription valid for 1 year
   ↓
5. Razorpay Checkout opens
   ↓
6. User completes payment
   ↓
7. Success:
   - Create subscription in database
   - Update user plan
   - Generate invoice PDF
   - Upload to Supabase Storage
   - Show success message
   - Provide invoice download link
   - Close modal, user can use app
```

### **Existing User (Has Active Subscription)**

```
1. User logs in
   ↓
2. Check subscription status
   ↓
3. If ACTIVE:
   - Normal login
   - No payment modal
   ↓
4. If TRIAL ENDING SOON (< 1 day):
   - Show banner: "Trial ends in X hours"
   - Button: "Upgrade Now"
   ↓
5. If EXPIRED:
   - Show payment modal (REQUIRED)
   - Must renew to continue using app
```

### **Auto-Renewal (After 1 Year)**

```
Razorpay automatically charges via mandate
   ↓
Webhook: subscription.charged
   ↓
Our server:
1. Verify webhook signature
2. Extend subscription by 1 year
3. Create new payment record
4. Generate new invoice
5. Send email with invoice
   ↓
User continues using app seamlessly
```

---

## 📄 **Invoice Template**

```
╔══════════════════════════════════════════════════╗
║              KLINT STUDIOS                       ║
║                  INVOICE                         ║
╚══════════════════════════════════════════════════╝

Invoice Number: INV-2025-0001
Invoice Date: 21 October 2025

─────────────────────────────────────────────────
BILL TO:
─────────────────────────────────────────────────
Name: Bitan Purkayastha
Email: bitan@outreachpro.io
Address: [If provided]
GSTIN: [If provided]
Company: [If provided]

─────────────────────────────────────────────────
SUBSCRIPTION DETAILS:
─────────────────────────────────────────────────
Plan: Brand Plan
Duration: 1 Year
Start Date: 21 Oct 2025
End Date: 21 Oct 2026

─────────────────────────────────────────────────
CHARGES:
─────────────────────────────────────────────────
Description              Amount
─────────────────────────────────────────────────
Brand Plan (Annual)      ₹129.00
GST @ 18%                ₹23.22
─────────────────────────────────────────────────
TOTAL                    ₹152.22
─────────────────────────────────────────────────

─────────────────────────────────────────────────
PAYMENT DETAILS:
─────────────────────────────────────────────────
Payment Status: Paid
Payment Method: Razorpay (UPI/Card/Net Banking)
Transaction ID: pay_xxxxxxxxxxxxx
Date: 21 Oct 2025, 12:45 AM

─────────────────────────────────────────────────
COMPANY DETAILS:
─────────────────────────────────────────────────
Klint Studios
[Your Company Address]
GSTIN: [Your GST Number]
Email: support@klintstudios.com

─────────────────────────────────────────────────
Thank you for your business!
─────────────────────────────────────────────────
```

---

## 🧪 **Testing Checklist**

Before going live:

### **Database**
- [ ] Migration ran successfully
- [ ] All tables created
- [ ] Helper functions working
- [ ] RLS policies active

### **Razorpay**
- [ ] Account created
- [ ] Test mode enabled
- [ ] 4 subscription plans created
- [ ] Keys saved in admin panel
- [ ] Test payment successful

### **Payment Flow**
- [ ] Modal shows on first login
- [ ] Can't close modal without selecting plan
- [ ] All plans display correctly
- [ ] GST calculated correctly (18%)
- [ ] Razorpay checkout opens
- [ ] Test payment goes through
- [ ] Subscription created in database
- [ ] User plan updated

### **Invoice**
- [ ] Invoice generated after payment
- [ ] Invoice number auto-increments
- [ ] PDF generated correctly
- [ ] Uploaded to Supabase Storage
- [ ] Download link works
- [ ] Admin can access all invoices

### **Auto-Renewal**
- [ ] Webhook handler working
- [ ] Signature verification
- [ ] Subscription extended
- [ ] New invoice generated
- [ ] User notified

### **Free Trial**
- [ ] 3-day trial starts on signup
- [ ] Countdown shows in UI
- [ ] After 3 days, prompts payment
- [ ] If no payment, downgrades to limited access

---

## 🔐 **Security**

### **Must Do**
1. ✅ Verify Razorpay webhook signatures
2. ✅ Use service role key for database operations
3. ✅ Never expose secret keys to frontend
4. ✅ Validate payment amounts server-side
5. ✅ Check subscription status on every API call

### **RLS Policies**
- Users can only see their own subscriptions/payments/invoices
- Admins can see everything
- System can create/update via service role

---

## 📱 **Next Files to Create**

I will create these next:

1. `components/payment/PaymentModal.tsx` - Main payment modal
2. `components/payment/PlanCard.tsx` - Individual plan display
3. `services/razorpayService.ts` - Razorpay integration
4. `services/invoiceService.ts` - PDF generation
5. `services/subscriptionService.ts` - Subscription management
6. `types/payment.ts` - TypeScript types

---

## 🎯 **Ready to Continue?**

Let me know when you've:
1. ✅ Run the database migration
2. ✅ Installed the npm packages
3. ✅ Created Razorpay account and plans
4. ✅ Saved Razorpay keys in admin panel

Then I'll create all the frontend components! 🚀

