# How to Check Your Vertex AI Limits

## 🚨 Current Error: 429 Resource Exhausted

You're seeing this error:
```
Vertex AI API error: 429 { "error": { "code": 429, "message": "Resource exhausted. Please try again later..." }}
```

This means you've hit your **quota limit** or **rate limit** for Vertex AI.

---

## 📊 How to Check Your Vertex AI Quotas

### Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com
2. Make sure you're in the correct project: **`tranquil-lotus-475216-j9`**

### Step 2: Navigate to Quotas

**Option A: Direct Link**
- Go to: https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=tranquil-lotus-475216-j9

**Option B: Manual Navigation**
1. Click the **☰ Menu** (top left)
2. Go to **APIs & Services** → **Quotas**
3. Filter by: **"Vertex AI API"** or **"aiplatform.googleapis.com"**

### Step 3: Find Your Limits

Look for these quotas (they may have different names):

#### **Rate Limits (Requests per minute/hour)**
- `GenerateContent requests per minute`
- `GenerateContent requests per hour`
- `GenerateContent requests per day`

#### **Quota Limits (Total usage)**
- `GenerateContent quota per minute`
- `GenerateContent quota per hour`
- `GenerateContent quota per day`

#### **Model-Specific Limits**
- `gemini-3-pro-image-preview requests per minute`
- `gemini-2.5-flash-image requests per minute`
- `gemini-3-pro-preview-11-2025 requests per minute`

### Step 4: Check Current Usage

1. In the Quotas page, you'll see:
   - **Limit**: Your maximum allowed
   - **Usage**: Current usage (may show as percentage)
   - **Status**: Green (OK) or Red (Exceeded)

2. Click on a quota to see:
   - **Historical usage graph**
   - **Peak usage times**
   - **Current consumption rate**

---

## 🔍 Alternative: Check via API

You can also check quotas programmatically:

```bash
# List all quotas for your project
gcloud alpha services quota list \
  --service=aiplatform.googleapis.com \
  --consumer=projects/tranquil-lotus-475216-j9
```

---

## 📈 Understanding the Limits

### Free Tier Limits
If you're on the **free tier**, typical limits are:
- **60 requests per minute** (for most models)
- **1,500 requests per day**
- **Gemini 3 Pro Preview**: May have stricter limits (e.g., 20 requests/minute)

### Paid Tier Limits
With billing enabled, limits are usually:
- **Higher rate limits** (varies by model)
- **More daily quota**
- **Better support for high-volume usage**

---

## 🚀 How to Increase Limits

### Option 1: Request Quota Increase (Recommended)

1. Go to: https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=tranquil-lotus-475216-j9
2. Find the quota you want to increase
3. Click **"Edit Quotas"** or **"Request Increase"**
4. Fill out the form:
   - **Service**: Vertex AI API
   - **Quota**: Select the specific quota (e.g., "GenerateContent requests per minute")
   - **Requested Limit**: Enter your desired limit
   - **Justification**: Explain your use case
5. Submit the request
6. **Wait for approval** (usually 24-48 hours)

### Option 2: Enable Billing

If you haven't enabled billing:
1. Go to: https://console.cloud.google.com/billing?project=tranquil-lotus-475216-j9
2. Link a billing account
3. This automatically increases many quotas

### Option 3: Use Different Models

- **Gemini 2.5 Flash** has higher limits than Gemini 3 Pro Preview
- Consider using 2.5 Flash for non-critical requests
- Save Gemini 3 Pro for high-quality outputs

---

## ⚡ Quick Fixes for Now

### 1. Wait and Retry
- Quotas reset periodically (per minute/hour/day)
- Wait a few minutes and try again

### 2. Reduce Request Rate
- Add delays between requests
- Batch requests when possible

### 3. Use Fallback Models
The code already falls back to Gemini 2.5 Flash if Gemini 3 Pro fails. This helps because:
- 2.5 Flash has higher quotas
- It's faster and cheaper
- Still produces good results

### 4. Monitor Usage
Set up alerts in Google Cloud Console:
1. Go to **Monitoring** → **Alerting**
2. Create an alert for quota usage > 80%
3. Get notified before hitting limits

---

## 📋 Your Project Details

Based on the logs:
- **Project ID**: `tranquil-lotus-475216-j9`
- **Location**: `us-central1` (for regional models)
- **Global Location**: Used for Gemini 3 Pro Image Preview

---

## 🔗 Direct Links

- **Quotas Dashboard**: https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=tranquil-lotus-475216-j9
- **Vertex AI API**: https://console.cloud.google.com/apis/api/aiplatform.googleapis.com?project=tranquil-lotus-475216-j9
- **Billing**: https://console.cloud.google.com/billing?project=tranquil-lotus-475216-j9
- **IAM & Admin**: https://console.cloud.google.com/iam-admin/quotas?project=tranquil-lotus-475216-j9

---

## 💡 Best Practices

1. **Monitor Usage**: Check quotas regularly
2. **Request Increases Early**: Don't wait until you hit limits
3. **Use Appropriate Models**: Don't use Gemini 3 Pro for everything
4. **Implement Retry Logic**: Add exponential backoff for 429 errors
5. **Cache Results**: Avoid regenerating the same content

---

## 🆘 Still Hitting Limits?

If you continue to hit limits after requesting increases:

1. **Check if request was approved**: Go back to Quotas page
2. **Contact Google Cloud Support**: For urgent increases
3. **Review your usage patterns**: Maybe optimize your requests
4. **Consider upgrading billing tier**: Higher tiers = higher limits
