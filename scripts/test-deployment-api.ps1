#!/usr/bin/env pwsh
# Simple deployment test script for post creation API

param(
    [Parameter(Mandatory=$true)]
    [string]$DeploymentUrl
)

Write-Host "🧪 Testing Post Creation API on Deployment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Basic API connectivity
Write-Host "1️⃣ Testing basic API connectivity..." -ForegroundColor Blue
try {
    $testResponse = Invoke-RestMethod -Uri "$DeploymentUrl/api/test" -TimeoutSec 10
    Write-Host "✅ Test endpoint working: $($testResponse.status)" -ForegroundColor Green
    Write-Host "   Environment: $($testResponse.environment)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Test endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This indicates basic API routing issues" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Authentication test
Write-Host "2️⃣ Testing authentication endpoint..." -ForegroundColor Blue
try {
    $authTestData = @{
        content = "Test post content"
        categoryId = "test-category"
        isAnonymous = $false
        tags = "[]"
    } | ConvertTo-Json

    $authTestResponse = Invoke-WebRequest -Uri "$DeploymentUrl/api/test" -Method POST -Body $authTestData -ContentType "application/json" -TimeoutSec 10
    $authResult = $authTestResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ POST test endpoint working" -ForegroundColor Green
    Write-Host "   Authenticated: $($authResult.authenticated)" -ForegroundColor Gray
    
    if (-not $authResult.authenticated) {
        Write-Host "⚠️  User not authenticated - this is expected if you're not logged in" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ POST test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Categories endpoint (needed for post creation)
Write-Host "3️⃣ Testing categories endpoint..." -ForegroundColor Blue
try {
    $categoriesResponse = Invoke-RestMethod -Uri "$DeploymentUrl/api/categories" -TimeoutSec 10
    Write-Host "✅ Categories endpoint working" -ForegroundColor Green
    Write-Host "   Categories found: $($categoriesResponse.categories.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Categories endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This will prevent post creation" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Check response content types
Write-Host "4️⃣ Testing response content types..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "$DeploymentUrl/api/test" -TimeoutSec 10
    $contentType = $response.Headers.'Content-Type'
    
    if ($contentType -like "*application/json*") {
        Write-Host "✅ Correct content type: $contentType" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong content type: $contentType" -ForegroundColor Red
        Write-Host "   Expected: application/json" -ForegroundColor Yellow
    }
    
    # Check if response is HTML
    if ($response.Content.Trim().StartsWith("<!DOCTYPE") -or $response.Content.Trim().StartsWith("<html")) {
        Write-Host "❌ Response is HTML instead of JSON!" -ForegroundColor Red
        Write-Host "   This is the 'Unexpected token <' error you're seeing" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Response is valid JSON" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Content type test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 Diagnostic Summary" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you're still getting 'Unexpected token <' errors:" -ForegroundColor Yellow
Write-Host "1. The API routes are returning HTML instead of JSON" -ForegroundColor White
Write-Host "2. This usually means:" -ForegroundColor White
Write-Host "   • Your deployment doesn't have the latest code" -ForegroundColor Gray
Write-Host "   • Environment variables are not set correctly" -ForegroundColor Gray
Write-Host "   • Authentication middleware is blocking requests" -ForegroundColor Gray
Write-Host "   • Database connection is failing" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Redeploy with latest code" -ForegroundColor White
Write-Host "2. Check environment variables in deployment dashboard" -ForegroundColor White
Write-Host "3. Test the /api/test endpoint directly in your browser" -ForegroundColor White
Write-Host "4. Check deployment logs for errors" -ForegroundColor White
