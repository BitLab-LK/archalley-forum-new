"use client"

import { useCallback, Suspense } from "react"
import PostCreator from "@/components/post-creator"
import PostCard from "@/components/post-card"
import Sidebar from "@/components/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { useSidebar } from "@/lib/sidebar-context"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { InfiniteScrollSentinel } from "@/components/infinite-scroll-sentinel"
import { toast } from "sonner"

interface Post {
  id: string
  author: {
    id: string
    name: string
    avatar: string
    isVerified: boolean
    rank: string
    rankIcon: string
  }
  content: string
  category: string
  isAnonymous: boolean
  isPinned: boolean
  upvotes: number
  downvotes: number
  userVote?: "up" | "down" | null
  comments: number
  timeAgo: string
  images?: string[]
  topComment?: {
    author: string
    content: string
    upvotes: number
    downvotes: number
    isBestAnswer: boolean
  }
}

// Separate component that implements infinite scroll
function HomePageContent() {
  const { user } = useAuth()
  const { confirm } = useConfirmDialog()
  const { refreshAll } = useSidebar() // For refreshing sidebar on post deletion

  // Fetch function for infinite scroll with retry logic
  const fetchPosts = useCallback(async (page: number) => {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Fetching posts - Page: ${page}, Attempt: ${attempt}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

        const response = await fetch(`/api/posts?page=${page}&limit=10`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        })

        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        
        // Validate response structure
        if (!result.posts || !Array.isArray(result.posts)) {
          throw new Error('Invalid response format')
        }

        console.log(`Posts loaded successfully - Page: ${page}, Count: ${result.posts.length}`)
        
        return {
          data: result.posts,
          hasMore: result.pagination?.currentPage < result.pagination?.pages || false,
          total: result.pagination?.total || result.posts.length
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.warn(`Fetch attempt ${attempt} failed:`, lastError.message)

        // Don't retry on certain errors
        if (lastError.message.includes('HTTP 4') || lastError.message.includes('Unauthorized')) {
          break
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Max 5 seconds
          console.log(`Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All retries failed
    if (lastError) {
      console.error('All fetch attempts failed:', lastError.message)
      toast.error(`Failed to load posts: ${lastError.message}`)
      throw lastError
    }

    throw new Error('Failed to load posts after multiple attempts')
  }, [])

  const {
    data: posts,
    loading,
    hasMore,
    error,
    refresh,
    sentinelRef
  } = useInfiniteScroll<Post>({
    fetchFunction: fetchPosts,
    threshold: 200 // Start loading when 200px from bottom
  })

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include", // Ensure cookies/session are sent
        headers: {
          "Content-Type": "application/json",
        },
      })

      const responseBody = await response.text()

      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseBody)
        } catch (e) {
          // Could not parse response as JSON
        }
        throw new Error(`Failed to delete post: ${response.status} - ${errorData?.error || responseBody}`)
      }

      toast.success("Post deleted successfully")
      
      // Refresh the posts after deletion
      refresh()
      
      // Refresh sidebar data in real-time after successful deletion
      refreshAll()
      
    } catch (error) {
      toast.error("Failed to delete post")
    }
  }

  const handleCommentCountChange = (postId: string, newCount: number) => {
    // Note: This would need to be updated to work with the infinite scroll data
    // For now, we'll rely on refresh for updates
    void postId
    void newCount
  }

  const handleVoteChange = (postId: string, newUpvotes: number, newDownvotes: number, newUserVote: "up" | "down" | null) => {
    // Note: This would need to be updated to work with the infinite scroll data  
    // For now, we'll rely on refresh for updates
    void postId
    void newUpvotes
    void newDownvotes
    void newUserVote
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 overflow-visible">
            <PostCreator onPostCreated={() => {
              // Refresh posts when a new post is created
              refresh()
            }} />

            {/* Error state with retry button */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-1">
                      Failed to load posts
                    </p>
                    <p className="text-red-600 dark:text-red-300 text-xs">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      refresh()
                    }}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Posts container with modern smooth animations */}
            <div className="space-y-3 sm:space-y-4 overflow-visible">
              {posts.map((post: Post, index: number) => (
                <div
                  key={post.id}
                  className="transform transition-all duration-700 ease-out animate-slideInUp"
                  style={{
                    animationDelay: `${(index % 10) * 100}ms`, // Stagger animation for each batch
                    animationFillMode: 'both'
                  }}
                >
                  <PostCard 
                    post={post} 
                    onDelete={
                      user && (user.id === post.author.id || user.role === "ADMIN")
                        ? async () => {
                            const confirmed = await confirm({
                              title: "Delete Post",
                              description: "Are you sure you want to delete this post? This action cannot be undone.",
                              confirmText: "Delete",
                              cancelText: "Cancel",
                              variant: "destructive"
                            })
                            
                            if (!confirmed) {
                              return
                            }
                            handleDeletePost(post.id)
                          }
                        : undefined
                    }
                    onCommentCountChange={handleCommentCountChange}
                    onVoteChange={handleVoteChange}
                  />
                </div>
              ))}
            </div>

            {/* Modern loading indicator for initial load */}
            {posts.length === 0 && loading && (
              <div className="space-y-3 sm:space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow transform transition-all duration-500 ease-out animate-pulse animate-slideInUp"
                    style={{
                      animationDelay: `${i * 150}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-shimmer"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-3 sm:h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-shimmer" style={{ width: '60%' }}></div>
                        <div className="h-2 sm:h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-shimmer" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                    <div className="h-16 sm:h-24 w-full mb-3 sm:mb-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-shimmer"></div>
                    <div className="flex justify-between">
                      <div className="h-6 sm:h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-shimmer" style={{ width: '80px' }}></div>
                      <div className="h-6 sm:h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-shimmer" style={{ width: '80px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <InfiniteScrollSentinel 
              sentinelRef={sentinelRef}
              loading={loading}
              hasMore={hasMore}
            />

            {/* No posts message */}
            {posts.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Be the first to share something with the community!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Hidden on mobile, shown as overlay or separate tab */}
          <div className="hidden lg:block lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </main>

      {/* Modern CSS animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -8px, 0);
          }
          70% {
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }

        @keyframes pulse-scale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-slideInUp {
          animation: slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .animate-shimmer {
          background: linear-gradient(90deg, 
            rgba(255, 255, 255, 0) 0%, 
            rgba(255, 255, 255, 0.4) 50%, 
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200px 100%;
          animation: shimmer 2s infinite linear;
        }

        .dark .animate-shimmer {
          background: linear-gradient(90deg, 
            rgba(255, 255, 255, 0) 0%, 
            rgba(255, 255, 255, 0.1) 50%, 
            rgba(255, 255, 255, 0) 100%
          );
        }

        .animate-bounce-gentle {
          animation: bounce 2s infinite;
        }

        .animate-pulse-scale {
          animation: pulse-scale 2s infinite ease-in-out;
        }

        /* Intersection Observer triggered animations */
        .post-card {
          transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .post-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        /* Dark mode hover effect */
        .dark .post-card:hover {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }

        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }

        /* Loading spinner enhancement */
        .spinner-modern {
          border: 3px solid rgba(59, 130, 246, 0.1);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Staggered animation for post batches */
        .post-batch-0 { animation-delay: 0ms; }
        .post-batch-1 { animation-delay: 100ms; }
        .post-batch-2 { animation-delay: 200ms; }
        .post-batch-3 { animation-delay: 300ms; }
        .post-batch-4 { animation-delay: 400ms; }
        .post-batch-5 { animation-delay: 500ms; }
        .post-batch-6 { animation-delay: 600ms; }
        .post-batch-7 { animation-delay: 700ms; }
        .post-batch-8 { animation-delay: 800ms; }
        .post-batch-9 { animation-delay: 900ms; }
      `}</style>
    </div>
  )
}

// Loading fallback component
function HomePageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-3 sm:space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                    <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 sm:h-4 w-[150px] sm:w-[200px]" />
                      <Skeleton className="h-2 sm:h-3 w-[100px] sm:w-[150px]" />
                    </div>
                  </div>
                  <Skeleton className="h-16 sm:h-24 w-full mb-3 sm:mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 sm:h-8 w-[80px] sm:w-[100px]" />
                    <Skeleton className="h-6 sm:h-8 w-[80px] sm:w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </main>
    </div>
  )
}

// Main page component with Suspense boundary
export default function HomePage() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageContent />
    </Suspense>
  )
}
