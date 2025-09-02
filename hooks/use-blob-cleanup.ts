import { useState } from 'react'
import { toast } from 'sonner'

interface CleanupStats {
  totalAttachments: number
  totalPosts: number
  orphanedAttachments: number
  storage: {
    totalBytes: number
    totalMB: number
    averageFileSize: string
    largestFile: string
  }
  recommendations: {
    cleanupNeeded: boolean
    potentialSavings: string
  }
}

interface CleanupResult {
  message: string
  total?: number
  successful?: number
  failed?: number
  savedStorage?: string
  filesFound?: number
  files?: Array<{ filename: string; postId: string; url: string }>
}

export function useBlobCleanup() {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<CleanupStats | null>(null)

  const getStorageStats = async (): Promise<CleanupStats | null> => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/cleanup-blobs', {
        method: 'GET'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get storage stats')
      }

      const data = await response.json()
      setStats(data)
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get storage stats'
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const cleanupBlobs = async (options?: { 
    dryRun?: boolean
    postId?: string 
  }): Promise<CleanupResult | null> => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/cleanup-blobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dryRun: options?.dryRun ?? true,
          postId: options?.postId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Cleanup failed')
      }

      const result = await response.json()
      
      if (options?.dryRun) {
        toast.info(`Dry run: Found ${result.filesFound} files that would be deleted`)
      } else {
        toast.success(`Cleanup complete: ${result.successful} files deleted, saved ${result.savedStorage}`)
      }

      // Refresh stats after cleanup
      if (!options?.dryRun) {
        await getStorageStats()
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cleanup failed'
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete post')
      }

      toast.success('Post and associated images deleted successfully')
      
      // Refresh stats after deletion
      await getStorageStats()
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete post'
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    // State
    isLoading,
    stats,
    
    // Actions
    getStorageStats,
    cleanupBlobs,
    deletePost,
    
    // Computed values
    hasOrphanedFiles: stats?.orphanedAttachments && stats.orphanedAttachments > 0,
    totalStorageMB: stats?.storage.totalMB || 0,
    potentialSavings: stats?.recommendations.potentialSavings || 'None'
  }
}
