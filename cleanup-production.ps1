# Production Cleanup Script
# Run this to remove test, debug, and development files

Write-Host "🧹 Starting Production Cleanup..." -ForegroundColor Green

# List of files/folders to remove for production optimization
$filesToRemove = @(
    # Test files
    "test-db-connection.js",
    "app\test-posts",
    "app\test-blob-url", 
    "app\test-blob",
    "app\api\test-public-access",
    "app\api\test-blob-token",
    "app\api\test-blob",
    "app\api\test-blob-config",
    "app\api\test-blob-permissions",
    
    # Debug files  
    "app\debug-post",
    "app\debug-images",
    "app\debug-blob",
    "app\api\debug-db-images",
    
    # Cleanup utilities (keep scripts, remove API routes)
    "app\api\cleanup-blob-urls",
    "app\api\complete-blob-test",
    "app\api\fix-blob-urls",
    
    # Test scripts (keep essential ones)
    "scripts\test-vercel-blob.js",
    
    # Development files
    "CODEBASE_REVIEW_REPORT.md",
    "DEBUG_REPORT_2025-07-14.md", 
    "LATEST_DEBUG_SUMMARY.txt",
    "test-images",
    "test\sync-test.ts"
)

$removedCount = 0

foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Recurse -Force
            Write-Host "✅ Removed: $file" -ForegroundColor Green
            $removedCount++
        }
        catch {
            Write-Host "❌ Failed to remove: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "⚠️  Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Cleanup complete! Removed $removedCount files/folders." -ForegroundColor Green
Write-Host "💡 Your application should now run faster with reduced file overhead." -ForegroundColor Cyan

# Additional recommendations
Write-Host "`n📋 Additional Performance Recommendations:" -ForegroundColor Magenta
Write-Host "1. ✅ Reduced activity feed API limit from 20 to 10 items"
Write-Host "2. ✅ Removed unused metadata from activity interface"  
Write-Host "3. ✅ Simplified activity rendering (removed vote/comment counts)"
Write-Host "4. ✅ Optimized ActivityFeed component imports"
Write-Host "5. 🔄 Consider adding Redis caching for activity feeds"
Write-Host "6. 🔄 Add database indexes on frequently queried columns"
