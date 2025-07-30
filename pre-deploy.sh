#!/bin/bash
# Quick deployment fix script

echo "🔧 Pre-deployment cleanup and verification..."

# Remove any remaining problematic files
echo "Cleaning up test/debug files..."

# Remove any empty directories
find app/api -type d -empty -delete 2>/dev/null || true
find app -type d -empty -delete 2>/dev/null || true

# Verify critical files exist
echo "✅ Verifying critical files..."
if [ ! -f "app/api/users/[id]/activity/route.ts" ]; then
    echo "❌ Missing activity route!"
    exit 1
fi

if [ ! -f "components/activity-feed.tsx" ]; then
    echo "❌ Missing activity feed component!"
    exit 1
fi

if [ ! -f "app/profile/[id]/page.tsx" ]; then
    echo "❌ Missing profile page!"
    exit 1
fi

echo "✅ All critical files present"

# Check for TypeScript errors
echo "🔍 Checking for TypeScript errors..."
npx tsc --noEmit --skipLibCheck

if [ $? -eq 0 ]; then
    echo "✅ No TypeScript errors found"
else
    echo "❌ TypeScript errors found - please fix before deploying"
    exit 1
fi

echo "🚀 Ready for deployment!"
