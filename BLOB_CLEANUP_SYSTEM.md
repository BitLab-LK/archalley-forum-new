# Automatic Blob Cleanup System

## Overview
Implemented automatic cleanup of Vercel Blob storage files when posts are deleted, preventing orphaned files and reducing storage costs.

## Features

### 🗑️ **Automatic Cleanup on Post Deletion**
- When a post is deleted, all associated images are automatically removed from Vercel Blob
- Prevents accumulation of orphaned files
- Reduces storage costs and maintains clean storage

### 🛠️ **Manual Cleanup Tools**
- Admin-only cleanup API for maintenance
- Dry-run mode to preview what would be deleted
- Storage statistics and optimization recommendations

### 📊 **Storage Management Dashboard**
- Real-time storage statistics
- Orphaned file detection
- Storage optimization recommendations

## Implementation Details

### 1. Updated Post Deletion (`/api/posts/[postId]`)
```typescript
// Before deleting from database, clean up blob files
await cleanupPostBlobs(postId)

// Then proceed with database deletion
await prisma.$transaction([...])
```

### 2. Utility Functions (`lib/utils.ts`)
- `cleanupPostBlobs(postId)` - Clean up all blobs for a specific post
- `deleteBlobFile(url)` - Delete a single blob file
- `deleteBlobFiles(urls)` - Delete multiple blob files in parallel

### 3. Admin Cleanup API (`/api/admin/cleanup-blobs`)
- **GET**: Get storage statistics and orphaned file counts
- **POST**: Clean up orphaned files (with dry-run support)

### 4. React Hook (`hooks/use-blob-cleanup.ts`)
- `useBlobCleanup()` - Frontend hook for storage management
- Provides loading states, error handling, and success notifications

### 5. Admin Component (`components/blob-storage-manager.tsx`)
- Visual dashboard for storage management
- Safe mode (dry-run) and delete mode
- Real-time statistics and cleanup controls

## API Usage Examples

### Get Storage Statistics
```typescript
GET /api/admin/cleanup-blobs

Response:
{
  "totalAttachments": 150,
  "totalPosts": 75,
  "orphanedAttachments": 5,
  "storage": {
    "totalBytes": 52428800,
    "totalMB": 50,
    "averageFileSize": "341KB",
    "largestFile": "2MB"
  },
  "recommendations": {
    "cleanupNeeded": true,
    "potentialSavings": "~7MB"
  }
}
```

### Clean Up Orphaned Files (Dry Run)
```typescript
POST /api/admin/cleanup-blobs
{
  "dryRun": true
}

Response:
{
  "message": "Dry run completed - no files were deleted",
  "filesFound": 5,
  "files": [
    {
      "filename": "img_abc12345.webp",
      "postId": "deleted-post-id",
      "url": "https://blob.vercel-storage.com/img_abc12345..."
    }
  ]
}
```

### Clean Up Orphaned Files (Actual Deletion)
```typescript
POST /api/admin/cleanup-blobs
{
  "dryRun": false
}

Response:
{
  "message": "Blob cleanup completed",
  "total": 5,
  "successful": 5,
  "failed": 0,
  "savedStorage": "~7MB"
}
```

## Security Features

### 🔒 **Admin-Only Access**
- Cleanup APIs require admin role
- Prevents unauthorized storage manipulation

### 🛡️ **Safe Defaults**
- Dry-run mode is default for manual cleanup
- Graceful error handling if blob storage is unavailable
- Database consistency maintained even if blob cleanup fails

### 📝 **Comprehensive Logging**
- Detailed logs for all cleanup operations
- Error tracking and troubleshooting information

## Benefits

### 💰 **Cost Savings**
- Prevents accumulation of orphaned files
- Reduces Vercel Blob storage costs
- Automatic cleanup requires no manual intervention

### 🚀 **Performance**
- Faster storage operations with fewer files
- Reduced storage overhead
- Better organization of blob storage

### 🔧 **Maintenance**
- Easy identification of storage issues
- Automated cleanup reduces manual work
- Clear visibility into storage usage

## Error Handling

### Blob Storage Unavailable
```typescript
// If blob deletion fails, database deletion still proceeds
try {
  await cleanupPostBlobs(postId)
} catch (blobError) {
  console.warn("Blob cleanup failed, continuing with database deletion")
  // Database deletion proceeds normally
}
```

### Partial Cleanup Failures
```typescript
// Uses Promise.allSettled for parallel deletion
const results = await deleteBlobFiles(urls)
const successful = results.filter(r => r.status === 'fulfilled').length
const failed = results.filter(r => r.status === 'rejected').length
```

## Usage in Components

### Using the Hook
```typescript
import { useBlobCleanup } from '@/hooks/use-blob-cleanup'

function AdminPanel() {
  const { stats, cleanupBlobs, deletePost, hasOrphanedFiles } = useBlobCleanup()
  
  // Delete post with automatic blob cleanup
  const handleDeletePost = async (postId: string) => {
    const success = await deletePost(postId)
    if (success) {
      // Post and blobs deleted automatically
    }
  }
  
  // Manual cleanup
  const handleCleanup = async () => {
    await cleanupBlobs({ dryRun: false })
  }
}
```

### Using the Component
```typescript
import { BlobStorageManager } from '@/components/blob-storage-manager'

function AdminDashboard() {
  return (
    <div>
      <h1>Storage Management</h1>
      <BlobStorageManager />
    </div>
  )
}
```

## Monitoring and Maintenance

### Regular Cleanup Schedule
Consider setting up periodic cleanup (via cron job or scheduled function):
```typescript
// Weekly cleanup of orphaned files
const cleanup = async () => {
  const result = await fetch('/api/admin/cleanup-blobs', {
    method: 'POST',
    body: JSON.stringify({ dryRun: false })
  })
}
```

### Storage Monitoring
Monitor storage usage and set up alerts:
- Track total storage usage
- Monitor orphaned file count
- Set up notifications for high storage usage

This system ensures your Vercel Blob storage remains clean and cost-effective while providing comprehensive tools for storage management and maintenance.
