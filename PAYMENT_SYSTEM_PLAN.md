# 💳 Payment System Implementation Plan

**Date**: October 21, 2025  
**Status**: PLANNING

---

## 📋 **Requirements**

### **1. Payment Flow**
- ✅ Show payment popup immediately after login
- ✅ User must select a plan or start free trial
- ✅ Razorpay mandate setup for auto-debit
- ✅ Free plan: 3 days trial, then auto-charge
- ✅ Paid plans: Charge immediately, valid for 1 year
- ✅ Auto-renewal after 1 year

### **2. Pricing Structure**
```
Base Prices (INR):
- Free: ₹0 (3-day trial only)
- Solo: ₹25/year
- Studio: ₹59/year  
- Brand: ₹129/year

With 18% GST:
- Free: ₹0
- Solo: ₹25 + ₹4.50 = ₹29.50/year
- Studio: ₹59 + ₹10.62 = ₹69.62/year
- Brand: ₹129 + ₹23.22 = ₹152.22/year
```

### **3. GST Invoice**
- Generate PDF invoice after payment
- Include GST breakdown
- User can download anytime
- Admin can access all invoices
- GST number is optional (can be added later)

---

## 🗄️ **Database Schema Updates**

### **New Tables**

#### **`subscriptions`**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to user_profiles)
- plan (user_plan enum)
- status (text: 'trial', 'active', 'expired', 'cancelled')
- start_date (timestamptz)
- end_date (timestamptz)
- trial_end_date (timestamptz, nullable)
- razorpay_subscription_id (text, nullable)
- razorpay_mandate_id (text, nullable)
- auto_renew (boolean, default true)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### **`payments`**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to user_profiles)
- subscription_id (uuid, foreign key to subscriptions)
- amount (decimal) -- base amount
- gst_amount (decimal) -- 18% GST
- total_amount (decimal) -- amount + gst_amount
- currency (text, default 'INR')
- status (text: 'pending', 'success', 'failed')
- razorpay_payment_id (text, nullable)
- razorpay_order_id (text, nullable)
- payment_method (text, nullable)
- paid_at (timestamptz, nullable)
- created_at (timestamptz)
```

#### **`invoices`**
```sql
- id (uuid, primary key)
- invoice_number (text, unique) -- e.g., "INV-2025-0001"
- user_id (uuid, foreign key to user_profiles)
- payment_id (uuid, foreign key to payments)
- user_name (text)
- user_email (text)
- user_address (text, nullable)
- user_gst_number (text, nullable)
- plan (user_plan enum)
- base_amount (decimal)
- gst_rate (decimal, default 18)
- gst_amount (decimal)
- total_amount (decimal)
- invoice_date (timestamptz)
- pdf_url (text, nullable) -- Supabase Storage URL
- created_at (timestamptz)
```

#### **Update `user_profiles`**
```sql
-- Add new fields:
- subscription_id (uuid, foreign key to subscriptions, nullable)
- gst_number (text, nullable)
- billing_address (text, nullable)
- company_name (text, nullable)
```

---

## 🔧 **Implementation Steps**

### **Phase 1: Database Setup** (Day 1)
1. Create new tables (subscriptions, payments, invoices)
2. Update user_profiles table
3. Create RLS policies
4. Create helper functions:
   - `calculate_gst(amount)` - Returns GST amount
   - `generate_invoice_number()` - Auto-increment invoice numbers
   - `check_subscription_status(user_id)` - Returns active/expired/trial

### **Phase 2: Payment Modal** (Day 1-2)
1. Create `PaymentModal` component
2. Show on first login (check if user has active subscription)
3. Display all plans with GST breakdown
4. Razorpay integration:
   - Create order
   - Setup mandate
   - Handle success/failure

### **Phase 3: Subscription Management** (Day 2)
1. Create subscription on successful payment
2. Set trial_end_date for free plan (3 days from signup)
3. Set end_date for paid plans (1 year from payment)
4. Update user's plan in user_profiles

### **Phase 4: Auto-Debit & Renewals** (Day 3)
1. Webhook handler for Razorpay events:
   - `subscription.charged` - Auto-renewal successful
   - `subscription.cancelled` - User cancelled
   - `subscription.paused` - Payment failed
2. Cron job to check:
   - Free trial ending (charge user)
   - Subscription expiring (auto-renew)

### **Phase 5: Invoice Generation** (Day 3-4)
1. Create invoice after successful payment
2. Generate PDF using library (jsPDF or similar)
3. Upload to Supabase Storage
4. Send email with invoice link
5. Add download button in user dashboard

### **Phase 6: Admin Features** (Day 4)
1. Admin can view all subscriptions
2. Admin can view all payments
3. Admin can download any invoice
4. Admin can manually extend/cancel subscriptions

---

## 💳 **Razorpay Integration**

### **Mandate Setup (Auto-Debit)**
```javascript
const options = {
  key: razorpay_key_id,
  amount: total_amount * 100, // in paise
  currency: 'INR',
  name: 'Klint Studios',
  description: `${plan} Plan - Annual Subscription`,
  subscription_id: razorpay_subscription_id, // for recurring
  prefill: {
    name: user.name,
    email: user.email,
  },
  theme: {
    color: '#10b981', // emerald-500
  },
  handler: function(response) {
    // Save payment details
    // Create subscription
    // Generate invoice
  },
  modal: {
    ondismiss: function() {
      // User closed modal without paying
    }
  }
};
```

### **Subscription Plans in Razorpay**
Create plans in Razorpay Dashboard:
- `solo_annual` - ₹29.50 (₹25 + 18% GST)
- `studio_annual` - ₹69.62 (₹59 + 18% GST)
- `brand_annual` - ₹152.22 (₹129 + 18% GST)

---

## 📄 **Invoice Template**

```
INVOICE

Invoice Number: INV-2025-0001
Invoice Date: 21 Oct 2025

Bill To:
[User Name]
[User Email]
[Billing Address]
GSTIN: [GST Number] (if provided)

Description         Base Amount    GST (18%)    Total
---------------------------------------------------------
Brand Plan (Annual)  ₹129.00       ₹23.22      ₹152.22
---------------------------------------------------------
                                   Total: ₹152.22

Payment Status: Paid
Payment Method: Razorpay
Transaction ID: [razorpay_payment_id]
Date: [paid_at]

---
Klint Studios
[Company Address]
GSTIN: [Your GST Number]
```

---

## 🔄 **User Flow**

### **First Login (New User)**
1. User logs in with Google
2. PaymentModal appears (can't close without selecting)
3. User sees all plans with GST breakdown
4. User selects "Free Plan":
   - Shows "3 days free trial"
   - Must setup mandate (₹0 charge now)
   - After 3 days, auto-charge ₹0 (or upgrade prompt)
5. User selects paid plan:
   - Shows total with GST
   - Setup Razorpay mandate
   - Charge immediately
   - Subscription valid for 1 year
6. Payment success:
   - Create subscription
   - Update user plan
   - Generate invoice
   - Show success message with invoice download

### **Existing User Login**
1. Check subscription status
2. If active: Normal login
3. If trial ending soon: Show renewal prompt
4. If expired: Show payment modal (must renew)

### **Auto-Renewal (After 1 Year)**
1. Razorpay webhook fires 3 days before expiry
2. Charge user via mandate
3. If success:
   - Extend subscription by 1 year
   - Generate new invoice
   - Send email confirmation
4. If failure:
   - Retry after 24 hours (3 attempts)
   - If all fail: Mark subscription as expired
   - Downgrade to free plan

---

## 🧪 **Testing Checklist**

- [ ] Payment modal shows on first login
- [ ] All plans display correct GST amounts
- [ ] Razorpay integration works
- [ ] Mandate setup successful
- [ ] Free trial: 3 days, then charges
- [ ] Paid plan: Charges immediately
- [ ] Subscription created in database
- [ ] Invoice generated as PDF
- [ ] Invoice downloadable by user
- [ ] Invoice accessible by admin
- [ ] Auto-renewal works after 1 year
- [ ] Webhook handles all events
- [ ] Failed payment downgrades plan
- [ ] GST number is optional

---

## 📦 **Required Libraries**

```bash
npm install razorpay
npm install jspdf jspdf-autotable  # For PDF generation
npm install date-fns  # For date calculations
```

---

## 🔐 **Security Considerations**

1. **Razorpay Keys**: Store in admin_settings (not .env)
2. **Webhook Signature**: Verify all webhooks
3. **Payment Verification**: Server-side only
4. **Invoice Access**: RLS policies (user can only see own)
5. **Mandate Security**: Never store card details

---

## 🎯 **Next Steps**

1. Create database migration script
2. Build PaymentModal component
3. Integrate Razorpay SDK
4. Setup webhook handler
5. Create invoice PDF generator
6. Test entire flow
7. Deploy to production

---

**Status**: READY TO IMPLEMENT 🚀  
**Estimated Time**: 3-4 days  
**Priority**: HIGH




