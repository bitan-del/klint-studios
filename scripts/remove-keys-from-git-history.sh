#!/bin/bash
# ============================================================================
# Remove API Keys from Git History
# ============================================================================
# This script helps remove exposed API keys from your git history
# WARNING: This rewrites git history. Use with caution!
# ============================================================================

set -e

echo "🔒 Removing API keys from git history..."
echo "⚠️  WARNING: This will rewrite git history!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted."
    exit 1
fi

# List of files that might contain API keys
FILES_TO_CLEAN=(
    "WORKING_BACKUP_2025_10_21.md"
    "GOOGLE_OAUTH_WORKING_BACKUP.md"
    ".env.bak"
    "scripts/set-gemini-key-production.sql"
    "scripts/setup-cloudinary.sql"
)

# Check if BFG Repo-Cleaner is installed
if command -v bfg &> /dev/null; then
    echo "✅ Using BFG Repo-Cleaner..."
    
    # Create a replacements file for BFG
    cat > /tmp/replacements.txt << EOF
AIzaSyAJOYH-NS0qvmFsZLR_NTR4grkJQss_jL4==>YOUR_GEMINI_API_KEY_HERE
AIzaSyAJOYH-NS0qvmFsZLR_NTR4grkJqss_jL4==>YOUR_GEMINI_API_KEY_HERE
EOF
    
    # Run BFG to replace keys
    bfg --replace-text /tmp/replacements.txt
    
    # Clean up
    rm /tmp/replacements.txt
    
    echo "✅ BFG cleanup complete!"
    echo "📝 Next steps:"
    echo "   1. Review changes: git reflog"
    echo "   2. Force push: git push origin --force --all"
    echo "   3. Clean up: git reflog expire --expire=now --all && git gc --prune=now --aggressive"
    
else
    echo "⚠️  BFG Repo-Cleaner not found. Using git filter-branch..."
    echo "📦 Install BFG for better performance: brew install bfg"
    echo ""
    
    # Use git filter-branch as fallback
    for file in "${FILES_TO_CLEAN[@]}"; do
        if [ -f "$file" ]; then
            echo "🗑️  Removing $file from history..."
            git filter-branch --force --index-filter \
                "git rm --cached --ignore-unmatch $file" \
                --prune-empty --tag-name-filter cat -- --all
        fi
    done
    
    echo "✅ Git filter-branch complete!"
    echo "📝 Next steps:"
    echo "   1. Review changes: git log --all"
    echo "   2. Force push: git push origin --force --all"
    echo "   3. Clean up: git reflog expire --expire=now --all && git gc --prune=now --aggressive"
fi

echo ""
echo "🔒 IMPORTANT: After cleaning history, rotate all exposed API keys!"
echo "   1. Revoke old keys in Google AI Studio"
echo "   2. Update keys in Supabase database"
echo "   3. Update keys in Vercel/environment variables"

