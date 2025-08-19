# Deployment Health Check Script (PowerShell)
# Run this after deployment to verify everything is working

Write-Host "🔍 Deployment Health Check" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Check if DEPLOYMENT_URL is set
if (-not $env:DEPLOYMENT_URL) {
    Write-Host "❌ DEPLOYMENT_URL not set. Please set it to your deployment URL" -ForegroundColor Red
    Write-Host "   Example: `$env:DEPLOYMENT_URL = 'https://yourdomain.com'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🌐 Testing deployment: $env:DEPLOYMENT_URL" -ForegroundColor Green
Write-Host ""

# Test 1: Basic connectivity
Write-Host "1️⃣ Testing basic connectivity..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri $env:DEPLOYMENT_URL -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Site is accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Site is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Health endpoint
Write-Host ""
Write-Host "2️⃣ Testing health endpoint..." -ForegroundColor Blue
try {
    $healthResponse = Invoke-RestMethod -Uri "$env:DEPLOYMENT_URL/api/health" -TimeoutSec 10
    if ($healthResponse.status -eq "ok") {
        Write-Host "✅ Health endpoint is working" -ForegroundColor Green
    } else {
        Write-Host "❌ Health endpoint failed. Response: $($healthResponse | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Deployment debug endpoint
Write-Host ""
Write-Host "3️⃣ Testing deployment debug endpoint..." -ForegroundColor Blue
try {
    $debugResponse = Invoke-RestMethod -Uri "$env:DEPLOYMENT_URL/api/debug/deployment" -TimeoutSec 10
    Write-Host "✅ Debug endpoint returns valid JSON" -ForegroundColor Green
    Write-Host "📊 Debug info:" -ForegroundColor Cyan
    $debugResponse | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "❌ Debug endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Database connectivity (through API)
Write-Host ""
Write-Host "4️⃣ Testing database connectivity..." -ForegroundColor Blue
try {
    $dbResponse = Invoke-RestMethod -Uri "$env:DEPLOYMENT_URL/api/debug/deployment" -TimeoutSec 10
    if ($dbResponse.database.status -eq "connected") {
        Write-Host "✅ Database is connected" -ForegroundColor Green
    } else {
        Write-Host "❌ Database connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Database connectivity test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Authentication system
Write-Host ""
Write-Host "5️⃣ Testing authentication system..." -ForegroundColor Blue
try {
    $authResponse = Invoke-RestMethod -Uri "$env:DEPLOYMENT_URL/api/auth/session" -TimeoutSec 10
    Write-Host "✅ Authentication endpoint is working" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🏁 Health Check Complete" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Summary
Write-Host ""
Write-Host "📋 Quick Fixes for Common Issues:" -ForegroundColor Yellow
Write-Host "• If health endpoint fails: Check environment variables" -ForegroundColor White
Write-Host "• If database fails: Verify DATABASE_URL and run 'npx prisma db push'" -ForegroundColor White
Write-Host "• If auth fails: Check NEXTAUTH_URL and NEXTAUTH_SECRET" -ForegroundColor White
Write-Host "• If everything fails: Check deployment logs" -ForegroundColor White
Write-Host ""
Write-Host "🔧 For detailed troubleshooting, see DEPLOYMENT_TROUBLESHOOTING.md" -ForegroundColor Cyan

# Usage example
Write-Host ""
Write-Host "💡 To run this script:" -ForegroundColor Magenta
Write-Host "   `$env:DEPLOYMENT_URL = 'https://yourdomain.com'" -ForegroundColor Gray
Write-Host "   .\scripts\deployment-health-check.ps1" -ForegroundColor Gray
