# 🚀 Quick Start Guide - Payment System v2.0

## ⚡ 3-Step Setup

### **Step 1: Run Database Migration** (5 minutes)

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/002_payment_system.sql`
4. Paste and click **Run**
5. Verify tables created:
   - `subscriptions`
   - `payments`
   - `invoices`
   - `invoice_counter`

### **Step 2: Create Razorpay Plan** (10 minutes)

1. Go to your **Razorpay Dashboard**
2. Navigate to **Subscriptions → Plans**
3. Click **Create New Plan**
4. Configure:
   ```
   Plan Name: Solo Annual Plan
   Billing Interval: 12 months
   Plan Amount: ₹117882 (in paise = ₹1,178.82)
   Currency: INR
   Trial Period: 3 days
   Trial Amount: ₹0
   ```
5. Click **Create**
6. Copy the **Plan ID** (should be: `plan_RWEqJmL9v1aJu2`)
7. **IMPORTANT:** Verify this matches `services/razorpayService.ts` line 7

### **Step 3: Configure Admin Panel** (2 minutes)

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000`
3. Login as admin: `bitan@outreachpro.io`
4. Click **Admin Panel** in header
5. Go to **Payment Settings** tab
6. Enter your Razorpay keys:
   - **Key ID**: `rzp_test_...` or `rzp_live_...`
   - **Key Secret**: Your secret key
7. Click **Save Razorpay Keys**

---

## ✅ That's It! Now Test:

### **Test the Complete Flow:**

1. **Logout** from admin account
2. **Login with a new Google account**
3. **Payment Modal** should appear (cannot close)
4. **Click "Start 3-Day Free Trial"** on Solo plan
5. **Razorpay checkout** opens
6. **Enter test card details:**
   ```
   Card Number: 4111 1111 1111 1111
   CVV: 123
   Expiry: Any future date
   Name: Test User
   ```
7. **Complete mandate** authorization
8. **Success screen** appears
9. **You're in!** Full access for 3 days

### **Test Cancellation:**

1. Go to **User Menu** (top right)
2. Click **Settings** → **Subscription** (when you add it)
3. See trial status
4. Click **Cancel Subscription**
5. Confirm cancellation
6. Verify: Status = Cancelled, but still have access

---

## 🎯 Expected Behavior

### **New User (First Login):**
```
✅ Payment modal appears immediately
✅ Cannot close modal
✅ Only Solo plan has "Start Trial" button
✅ Studio/Brand show "Contact Support"
✅ Trial starts with ₹0 charge
✅ Full access for 3 days
```

### **Day 4 (Auto-Charge):**
```
✅ Razorpay charges ₹1,178.82
✅ Invoice generated
✅ Subscription → 'active'
✅ Access extended to 1 year
```

### **Existing User (Has Subscription):**
```
✅ No payment modal
✅ Direct access to app
✅ Can view subscription in settings
✅ Can cancel anytime
```

---

## 🐛 Troubleshooting

### **Problem: Payment modal doesn't appear**

**Fix:** Check subscription status in database:
```sql
SELECT * FROM subscriptions WHERE user_id = 'your_user_id';
```
If subscription exists, that's why modal doesn't appear.

---

### **Problem: "Razorpay keys not configured" error**

**Fix:** 
1. Verify keys are saved in Admin Panel
2. Check database:
   ```sql
   SELECT * FROM admin_settings 
   WHERE setting_key IN ('razorpay_key_id', 'razorpay_key_secret');
   ```
3. Re-save keys in Admin Panel

---

### **Problem: Studio/Brand button doesn't work**

**Expected behavior!** These plans require contacting support. The button shows an error message directing users to email support.

---

### **Problem: Trial ends but no charge**

**This requires webhook setup** (Edge Function - not yet implemented). For now, auto-charge happens on Razorpay side, but you need to create a webhook handler to update your database.

---

## 📧 Support Setup

Create **support@klintstudios.com** email to receive:
- Studio/Brand upgrade requests
- Payment issues
- General questions

### **Quick Reply Templates:**

**Studio/Brand Upgrade:**
```
Hi [Name],

Thank you for your interest in upgrading to [Studio/Brand]!

Current Plan: Solo (₹1,178.82/year)
Requested Plan: [Studio/Brand] (₹[price]/year)
Days Remaining: [X] days

Pro-rated Amount: ₹[calculated amount]

Payment Options:
1. Bank Transfer: [Account details]
2. UPI: [UPI ID]
3. Razorpay Link: [We'll send one]

Once payment is confirmed, we'll upgrade your account immediately.

Best regards,
Klint Studios Team
```

---

## 🎓 User FAQs

**Q: Will I be charged during the trial?**  
A: No, the trial is completely free for 3 days. You'll be charged ₹1,178.82 on day 4 unless you cancel.

**Q: How do I cancel?**  
A: Go to Settings → Subscription → Cancel Subscription. You can cancel anytime.

**Q: What if I cancel during the trial?**  
A: You won't be charged at all, and you'll keep access until the trial ends.

**Q: What if I cancel after being charged?**  
A: You'll keep access until the end of your year, but won't be charged again next year.

**Q: How do I upgrade to Studio or Brand?**  
A: Email support@klintstudios.com. We'll calculate the pro-rated amount and upgrade your account once payment is received.

**Q: Can I get a refund?**  
A: [Your refund policy here]

---

## 💡 Pro Tips

1. **Use Test Mode First:** Always test with Razorpay test keys before going live
2. **Monitor Conversions:** Track how many trials convert to paid
3. **Send Reminders:** Email users 1 day before trial ends
4. **Offer Extensions:** Consider 7-day trials for special cases
5. **Automate Upgrades:** Build Edge Function to automate Studio/Brand upgrades later

---

## 📊 What to Monitor

### **Daily:**
- Trial signups
- Cancellations

### **Weekly:**
- Trial → Paid conversion rate
- Upgrade requests
- Support emails

### **Monthly:**
- Revenue
- Churn rate
- Plan distribution (Solo vs Studio vs Brand)

---

## 🚀 Next Steps

1. ✅ Complete setup (Steps 1-3 above)
2. ✅ Test thoroughly
3. 🔄 Create Edge Functions for webhooks
4. 🔄 Add SubscriptionSettings to user menu
5. 🔄 Set up email notifications
6. 🔄 Go live!

---

**Need Help?** Check:
- `NEW_PAYMENT_FLOW.md` - Complete flow details
- `PAYMENT_SYSTEM_v2_COMPLETE.md` - Full implementation docs
- `PAYMENT_TESTING_GUIDE.md` - Testing scenarios

---

**Status:** ✅ Ready to Start!  
**Estimated Setup Time:** 20 minutes  
**Ready for Production:** Yes (after Edge Functions)




