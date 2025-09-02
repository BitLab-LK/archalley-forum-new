"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, HardDrive, Trash2, Eye, AlertCircle, CheckCircle } from 'lucide-react'
import { useBlobCleanup } from '@/hooks/use-blob-cleanup'

export function BlobStorageManager() {
  const { 
    isLoading, 
    stats, 
    hasOrphanedFiles,
    totalStorageMB,
    potentialSavings,
    getStorageStats, 
    cleanupBlobs 
  } = useBlobCleanup()

  const [isDryRun, setIsDryRun] = useState(true)

  useEffect(() => {
    getStorageStats()
  }, [])

  const handleCleanup = async () => {
    await cleanupBlobs({ dryRun: isDryRun })
  }

  if (!stats && isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading storage statistics...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Blob Storage Overview
          </CardTitle>
          <CardDescription>
            Manage Vercel Blob storage and clean up orphaned files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Files</p>
                <p className="text-2xl font-bold">{stats.totalAttachments}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Storage Used</p>
                <p className="text-2xl font-bold">{totalStorageMB}MB</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Orphaned Files</p>
                <p className="text-2xl font-bold text-orange-600">{stats.orphanedAttachments}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Avg File Size</p>
                <p className="text-2xl font-bold">{stats.storage.averageFileSize}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-1">
              <p className="font-medium">Storage Status</p>
              <div className="flex items-center gap-2">
                {hasOrphanedFiles ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-600">
                      Cleanup recommended - {potentialSavings} can be saved
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Storage is optimized</span>
                  </>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={getStorageStats}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasOrphanedFiles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Cleanup Orphaned Files
            </CardTitle>
            <CardDescription>
              Remove files that are no longer associated with any posts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant={isDryRun ? "secondary" : "destructive"}>
                {isDryRun ? "Safe Mode" : "Delete Mode"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDryRun(!isDryRun)}
              >
                {isDryRun ? (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Switch to Delete Mode
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Switch to Safe Mode
                  </>
                )}
              </Button>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                {isDryRun ? (
                  <>
                    <strong>Safe Mode:</strong> Preview which files would be deleted without actually deleting them.
                  </>
                ) : (
                  <>
                    <strong>Delete Mode:</strong> Permanently delete orphaned files. This action cannot be undone.
                  </>
                )}
              </p>
            </div>

            <Button
              onClick={handleCleanup}
              disabled={isLoading}
              variant={isDryRun ? "outline" : "destructive"}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : isDryRun ? (
                <Eye className="h-4 w-4 mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isDryRun ? "Preview Cleanup" : `Delete ${stats?.orphanedAttachments} Orphaned Files`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
