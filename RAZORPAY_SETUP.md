# Razorpay Integration Setup Guide

## ✅ What's Been Done

1. **Disabled Demo Mode** - Real Razorpay integration is now active
2. **Fixed Invoice Generation** - Invoices are now created automatically after payment
3. **Fixed Subscription Check** - Payment modal won't appear after successful payment
4. **Plan IDs Configured**:
   - Solo: `plan_RWEqJmL9v1aJu2` (3-day trial)
   - Studio: `plan_RWEr3jmdBjVExE` (upfront payment)
   - Brand: `plan_RWErZhQtFet8FP` (upfront payment)

---

## 🔑 How to Add Your Razorpay Keys

### Step 1: Get Your Razorpay API Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **API Keys**
3. Click **Generate Test Keys** (for testing) or **Generate Live Keys** (for production)
4. You'll see:
   - **Key ID** (starts with `rzp_test_` or `rzp_live_`)
   - **Key Secret** (keep this secret!)

### Step 2: Add Keys to Your App

1. **Log in as Super Admin** at http://localhost:3000
2. Open the **Admin Panel** (click your profile → Admin Panel)
3. Find the **Payment Settings** section
4. Paste your keys:
   - **Publishable Key** = Your **Key ID** (rzp_test_... or rzp_live_...)
   - **Secret Key** = Your **Key Secret**
5. Click **Save**

---

## 🧪 Testing the Payment Flow

### With Test Mode (Recommended First)

1. Use **Test Keys** from Razorpay Dashboard
2. Log in as a **regular user** (not super admin)
3. Payment modal will appear
4. Click **"Start 3-Day Trial"** (Solo) or **"Get Studio"**/**"Get Brand"**
5. Use Razorpay's test card:
   - Card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date
   - OTP: `1234`

### With Live Mode (Production)

1. Switch to **Live Keys** in Razorpay Dashboard
2. Update keys in Admin Panel
3. Real cards will be charged
4. Real payments will be processed

---

## 📋 Plan Setup in Razorpay

Your plans are already configured with the correct IDs. Here's what they do:

### Solo Plan (`plan_RWEqJmL9v1aJu2`)
- **3-day free trial**
- After trial: ₹1,179/year (₹999 + 18% GST)
- Users can cancel anytime during trial

### Studio Plan (`plan_RWEr3jmdBjVExE`)
- **No trial** - charged immediately
- ₹3,539/year (₹2,999 + 18% GST)
- Marked as "RECOMMENDED"

### Brand Plan (`plan_RWErZhQtFet8FP`)
- **No trial** - charged immediately
- ₹5,899/year (₹4,999 + 18% GST)
- Premium features

---

## 🔒 Security Notes

1. **Never commit your Secret Key to Git**
2. **Use Test Keys for development**
3. **Use Live Keys only in production**
4. **Keep your Secret Key in the database** (stored in `admin_settings` table)

---

## 🧾 Invoice Generation

Invoices are automatically created when:
- Payment is successful
- User can download from success screen
- User can download later from account settings (coming soon)

Invoice includes:
- Invoice number (INV-2025-0001, etc.)
- Base amount, GST (18%), Total
- User details, GST number (optional)
- Payment transaction ID

---

## 🐛 Troubleshooting

### Payment modal keeps appearing
- Check browser console for errors
- Verify subscription was created in database
- Try logging out and back in

### Invoice download fails
- Check that invoice was created in `invoices` table
- Verify payment ID exists in `payments` table
- Check browser console for detailed error

### Razorpay not opening
- Verify keys are saved in Admin Panel
- Check that keys are correct format (rzp_test_... or rzp_live_...)
- Open browser console and check for errors

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for error messages
2. Check Supabase logs for database errors
3. Check Razorpay Dashboard → Payments for transaction status

---

## ✅ Next Steps

1. **Add Razorpay keys** in Admin Panel
2. **Test with test keys** first
3. **Verify payment flow** works end-to-end
4. **Test invoice generation**
5. **Switch to live keys** when ready for production

---

🎉 **Your payment system is now ready!**

