# Deployment Health Check Script for Production Issues
# Run this script after deployment to verify everything is working

Write-Host "🔍 Checking Deployment Health..." -ForegroundColor Cyan

# Check if the app is responding
$baseUrl = Read-Host "Enter your production URL (e.g., https://your-app.vercel.app)"

Write-Host "`n1. Testing basic connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET -UseBasicParsing
    Write-Host "✅ Health check passed: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Testing auth debug endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/debug/auth" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    Write-Host "✅ Auth debug response:" -ForegroundColor Green
    Write-Host "   Environment: $($content.environment)"
    Write-Host "   Has Session: $($content.hasSession)"
    Write-Host "   Timestamp: $($content.timestamp)"
} catch {
    Write-Host "❌ Auth debug failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.Content.ReadAsStringAsync().Result
        Write-Host "   Error content: $errorContent" -ForegroundColor Red
    }
}

Write-Host "`n3. Testing categories endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/categories" -Method GET -UseBasicParsing
    Write-Host "✅ Categories endpoint working: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Categories endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Testing posts GET endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/posts?limit=1" -Method GET -UseBasicParsing
    Write-Host "✅ Posts GET endpoint working: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Posts GET endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. Testing posts POST endpoint (should fail without auth)..." -ForegroundColor Yellow
try {
    $body = @{
        content = "test"
        categoryId = "test"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/posts" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "⚠️ Posts POST unexpectedly succeeded: $($response.StatusCode)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Posts POST correctly returns 401 Unauthorized" -ForegroundColor Green
    } else {
        Write-Host "❌ Posts POST failed with unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorContent = $_.Exception.Response.Content.ReadAsStringAsync().Result
            Write-Host "   Error content: $errorContent" -ForegroundColor Red
        }
    }
}

Write-Host "`n🔍 Health check complete!" -ForegroundColor Cyan
Write-Host "`nIf you see HTML content in any error responses, that indicates the issue." -ForegroundColor Yellow
Write-Host "The API should always return JSON, never HTML." -ForegroundColor Yellow
