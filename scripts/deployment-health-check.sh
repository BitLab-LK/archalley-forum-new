#!/bin/bash

# Deployment Health Check Script
# Run this after deployment to verify everything is working

echo "🔍 Deployment Health Check"
echo "=========================="

# Check if DEPLOYMENT_URL is set
if [ -z "$DEPLOYMENT_URL" ]; then
    echo "❌ DEPLOYMENT_URL not set. Please set it to your deployment URL"
    echo "   Example: export DEPLOYMENT_URL=https://yourdomain.com"
    exit 1
fi

echo "🌐 Testing deployment: $DEPLOYMENT_URL"
echo ""

# Test 1: Basic connectivity
echo "1️⃣ Testing basic connectivity..."
if curl -s "$DEPLOYMENT_URL" > /dev/null; then
    echo "✅ Site is accessible"
else
    echo "❌ Site is not accessible"
fi

# Test 2: Health endpoint
echo ""
echo "2️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/health" | jq -r '.status' 2>/dev/null)
if [ "$HEALTH_RESPONSE" = "ok" ]; then
    echo "✅ Health endpoint is working"
else
    echo "❌ Health endpoint failed. Response: $HEALTH_RESPONSE"
fi

# Test 3: Deployment debug endpoint
echo ""
echo "3️⃣ Testing deployment debug endpoint..."
DEBUG_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/debug/deployment")
if echo "$DEBUG_RESPONSE" | jq empty 2>/dev/null; then
    echo "✅ Debug endpoint returns valid JSON"
    echo "📊 Debug info:"
    echo "$DEBUG_RESPONSE" | jq .
else
    echo "❌ Debug endpoint failed or returned invalid JSON"
    echo "Response: $DEBUG_RESPONSE"
fi

# Test 4: Database connectivity (through API)
echo ""
echo "4️⃣ Testing database connectivity..."
DB_TEST=$(curl -s "$DEPLOYMENT_URL/api/debug/deployment" | jq -r '.database.status' 2>/dev/null)
if [ "$DB_TEST" = "connected" ]; then
    echo "✅ Database is connected"
else
    echo "❌ Database connection failed"
fi

# Test 5: Authentication system
echo ""
echo "5️⃣ Testing authentication system..."
AUTH_TEST=$(curl -s "$DEPLOYMENT_URL/api/auth/session")
if echo "$AUTH_TEST" | jq empty 2>/dev/null; then
    echo "✅ Authentication endpoint is working"
else
    echo "❌ Authentication endpoint failed"
fi

echo ""
echo "🏁 Health Check Complete"
echo "========================"

# Summary
echo ""
echo "📋 Quick Fixes for Common Issues:"
echo "• If health endpoint fails: Check environment variables"
echo "• If database fails: Verify DATABASE_URL and run 'npx prisma db push'"
echo "• If auth fails: Check NEXTAUTH_URL and NEXTAUTH_SECRET"
echo "• If everything fails: Check deployment logs"
echo ""
echo "🔧 For detailed troubleshooting, see DEPLOYMENT_TROUBLESHOOTING.md"
