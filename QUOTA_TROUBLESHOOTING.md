# Troubleshooting: 429 Error Despite "Unlimited" Quota

## 🔍 The Issue

You're seeing **429 errors** even though the quota shows **"Unlimited"** for:
- `gemini-3.0-pro-image-preview_default_res`

This is because there are **multiple quota layers** that can limit your requests.

---

## 📊 Check These Other Quotas

Even if one quota is unlimited, you might be hitting limits on:

### 1. **Project-Level Quotas** (Most Common)

Search for these in the Quotas page:

```
GenerateContent requests per minute per project
GenerateContent requests per hour per project  
GenerateContent requests per day per project
```

**These are usually the culprit!** Even if model-specific quotas are unlimited, project-level quotas can still limit you.

### 2. **Regional vs Global Endpoint Quotas**

Since Gemini 3 Pro Image uses the `global` endpoint, check:

```
GenerateContent requests per minute (global endpoint)
GenerateContent requests per hour (global endpoint)
```

### 3. **Billing Account Quotas**

If billing isn't fully enabled or there are payment issues:

```
Billing account quota
Payment method status
```

### 4. **Service Account Quotas**

Check if your service account has any limits:

```
Service account quota
IAM quota limits
```

---

## 🔎 How to Find the Real Limit

### Step 1: Filter for ALL GenerateContent Quotas

In the Quotas page, use these filters:

1. **Filter 1**: `GenerateContent`
   - This shows ALL GenerateContent-related quotas

2. **Filter 2**: `aiplatform.googleapis.com`
   - Shows all Vertex AI API quotas

3. **Filter 3**: `per minute` or `per hour`
   - Shows rate limits

### Step 2: Look for Non-Unlimited Values

Look through the list for quotas that show:
- ❌ A **specific number** (not "Unlimited")
- ❌ **"Exceeded"** status
- ❌ **High usage percentage** (>80%)

### Step 3: Check Usage Graphs

For each quota:
1. Click on it to see details
2. Check the **usage graph**
3. See if usage spikes match when you get 429 errors

---

## 🎯 Most Likely Culprits

Based on common issues:

### 1. **Project-Level Rate Limit**
```
Name: GenerateContent requests per minute per project
Value: 60 (or similar low number)
Status: Exceeded
```

**Solution**: Request increase for this specific quota

### 2. **Free Tier Daily Limit**
```
Name: GenerateContent requests per day per project
Value: 1,500 (free tier limit)
Status: Exceeded
```

**Solution**: Enable billing or wait for daily reset

### 3. **Preview Model Restrictions**
Even if unlimited, preview models may have:
- **Soft limits** (not shown in UI)
- **Beta access restrictions**
- **Regional availability issues**

---

## 🔧 Quick Fixes

### Option 1: Check All Quotas at Once

1. Go to: https://console.cloud.google.com/iam-admin/quotas?project=tranquil-lotus-475216-j9
2. Filter: `aiplatform.googleapis.com`
3. Sort by: **"Usage"** or **"Limit"**
4. Look for any quotas that are:
   - Not "Unlimited"
   - Showing high usage
   - Marked as "Exceeded"

### Option 2: Check Billing Status

1. Go to: https://console.cloud.google.com/billing?project=tranquil-lotus-475216-j9
2. Verify:
   - ✅ Billing account is linked
   - ✅ Payment method is valid
   - ✅ No payment issues

### Option 3: Check API Status

1. Go to: https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/overview?project=tranquil-lotus-475216-j9
2. Verify:
   - ✅ Vertex AI API is enabled
   - ✅ No service disruptions
   - ✅ All required APIs are enabled

---

## 📋 What to Check Right Now

In your Quotas page, look for these specific quotas:

1. ✅ `GenerateContent requests per minute per project` - **Check this first!**
2. ✅ `GenerateContent requests per hour per project`
3. ✅ `GenerateContent requests per day per project`
4. ✅ `GenerateContent requests per minute (global endpoint)`
5. ✅ Any quota with "per project" in the name

**These are usually the ones that limit you, even if model-specific quotas are unlimited.**

---

## 🚀 Request Increases

For each quota that's not unlimited:

1. Click on the quota
2. Click **"Edit Quotas"** or **"Request Increase"**
3. Enter desired limit (e.g., 1000 requests/minute)
4. Add justification: "Need higher limits for production image generation"
5. Submit and wait 24-48 hours

---

## 💡 Why This Happens

Google Cloud has **multiple layers of quotas**:

```
┌─────────────────────────────────────┐
│  Project-Level Quota (e.g., 60/min)│ ← Usually the limit!
├─────────────────────────────────────┤
│  Regional Quota (e.g., 100/min)     │
├─────────────────────────────────────┤
│  Model-Specific Quota (Unlimited)   │ ← What you're seeing
└─────────────────────────────────────┘
```

Even if the bottom layer is unlimited, the top layers can still limit you!

---

## 🔍 Debug Steps

1. **Check the exact error message** in Supabase logs:
   - Look for quota name in the error
   - It might say which specific quota is exceeded

2. **Check usage at the time of error**:
   - Note the exact time you got 429 error
   - Go to quota details and check usage graph at that time
   - See which quota spiked

3. **Try a different model**:
   - Use Gemini 2.5 Flash (which has higher limits)
   - If that works, it confirms it's a Gemini 3 Pro-specific issue

---

## 📞 Still Stuck?

If you've checked all quotas and they're all unlimited, but still getting 429:

1. **Contact Google Cloud Support**:
   - They can check internal quotas not visible in UI
   - They can see if there are soft limits on preview models

2. **Check Service Status**:
   - https://status.cloud.google.com/
   - See if there are any service disruptions

3. **Review Error Details**:
   - The 429 error message might contain the specific quota name
   - Check Supabase Edge Function logs for full error details
