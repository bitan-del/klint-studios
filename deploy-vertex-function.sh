#!/bin/bash

# Deploy Vertex AI Supabase Edge Function
# Run this script from the project root directory

echo "🚀 Deploying Vertex AI Edge Function to Supabase"
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/functions/vertex-ai/index.ts" ]; then
    echo "❌ Error: vertex-ai function not found!"
    echo "   Please run this script from the project root directory"
    exit 1
fi

# Step 1: Login to Supabase
echo "Step 1: Logging in to Supabase..."
echo "   (This will open a browser for authentication)"
npx supabase login

if [ $? -ne 0 ]; then
    echo "❌ Login failed. Please try again."
    exit 1
fi

echo "✅ Login successful!"
echo ""

# Step 2: Get project reference
echo "Step 2: Linking your Supabase project..."
echo ""
echo "📝 You need your Supabase project reference ID."
echo "   Find it in your Supabase dashboard URL:"
echo "   https://app.supabase.com/project/YOUR_PROJECT_REF"
echo ""
read -p "Enter your project reference ID: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project reference ID is required!"
    exit 1
fi

# Link the project
npx supabase link --project-ref "$PROJECT_REF"

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project. Please check your project reference ID."
    exit 1
fi

echo "✅ Project linked successfully!"
echo ""

# Step 3: Deploy the function
echo "Step 3: Deploying vertex-ai function..."
npx supabase functions deploy vertex-ai

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Go to Supabase Dashboard → Edge Functions → Secrets"
echo "   2. Add secret: GOOGLE_SERVICE_ACCOUNT_JSON"
echo "   3. Paste your Google Cloud service account JSON"
echo "   4. Configure Vertex AI in Admin Panel → Integrations"
echo ""
