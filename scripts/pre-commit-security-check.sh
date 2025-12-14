#!/bin/bash
# ============================================================================
# Pre-commit Security Check
# ============================================================================
# This script checks for exposed API keys before committing
# Add to .git/hooks/pre-commit or run manually before commits
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 Running security checks..."

# Patterns to detect API keys
PATTERNS=(
    "AIzaSy[A-Za-z0-9_-]{35}"  # Gemini API keys
    "sk_live_[A-Za-z0-9]{24,}"  # Stripe secret keys
    "pk_live_[A-Za-z0-9]{24,}"  # Stripe publishable keys
    "rzp_live_[A-Za-z0-9]{16,}"  # Razorpay keys
    "sk-[A-Za-z0-9]{32,}"  # Generic secret keys
)

# Files to check (staged files)
FILES=$(git diff --cached --name-only --diff-filter=ACM)

FOUND_KEYS=false

for file in $FILES; do
    # Skip binary files and already ignored files
    if [[ "$file" == *.png ]] || [[ "$file" == *.jpg ]] || [[ "$file" == *.svg ]] || [[ "$file" == *.ico ]]; then
        continue
    fi
    
    # Check each pattern
    for pattern in "${PATTERNS[@]}"; do
        if git diff --cached "$file" | grep -qE "$pattern"; then
            echo -e "${RED}❌ SECURITY WARNING:${NC} Potential API key found in $file"
            echo -e "${YELLOW}   Pattern: $pattern${NC}"
            FOUND_KEYS=true
        fi
    done
    
    # Check for .env files
    if [[ "$file" == .env* ]] && [[ "$file" != .env.example ]]; then
        echo -e "${RED}❌ SECURITY WARNING:${NC} .env file detected: $file"
        echo -e "${YELLOW}   .env files should not be committed!${NC}"
        FOUND_KEYS=true
    fi
    
    # Check for SQL files with production in name
    if [[ "$file" == *production*.sql ]] && [[ "$file" != *.example ]]; then
        echo -e "${YELLOW}⚠️  WARNING:${NC} Production SQL file detected: $file"
        echo -e "${YELLOW}   Make sure it doesn't contain real credentials!${NC}"
    fi
done

if [ "$FOUND_KEYS" = true ]; then
    echo ""
    echo -e "${RED}🚨 BLOCKED: Potential API keys or secrets detected!${NC}"
    echo -e "${YELLOW}Please:${NC}"
    echo "  1. Remove API keys from files"
    echo "  2. Use environment variables or database storage instead"
    echo "  3. Use .example files for templates"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Security check passed!${NC}"
exit 0

