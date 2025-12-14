#!/bin/bash

echo "🚀 Redeploying Vertex AI Edge Function..."
echo ""

cd /Users/bitanpurkayastha/Downloads/klint-studios-new

npx supabase functions deploy vertex-ai

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "📝 The new generate-styled-image endpoint is now available."
    echo ""
    echo "🔄 Next steps:"
    echo "   1. Refresh your browser (Command + R)"
    echo "   2. Try generating an image again"
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
fi
