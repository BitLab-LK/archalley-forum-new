"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Suspense } from "react"
import LazyPostCreator from "@/components/lazy-post-creator"
import PostCard from "@/components/post-card"
import LazySidebar from "@/components/lazy-sidebar"
import SearchParamsHandler from "@/components/homepage-search-params"
import { Button } from "@/components/ui/button"
import { useIsHydrated } from "@/hooks/use-performance"

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
  categories?: {    // Primary category object
    id: string
    name: string
    color: string
    slug: string
  }
  allCategories?: Array<{  // Multiple categories
    id: string
    name: string
    color: string
    slug: string
  }>
  aiCategories?: string[]  // AI-suggested category names
  isAnonymous: boolean
  isPinned: boolean
  upvotes: number
  downvotes: number
  userVote?: "up" | "down" | null
  comments: number
  timeAgo: string
  images?: string[]
  topComment?: {
    author: {
      name: string
      image?: string
    }
    content: string
    upvotes: number
    downvotes: number
    isBestAnswer: boolean
  }
}

interface Pagination {
  total: number
  pages: number
  currentPage: number
  limit: number
}

export default function HomePageInteractive({
  initialPosts,
  initialPagination,
}: {
  initialPosts: Post[];
  initialPagination: Pagination;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || [])
  const [pagination, setPagination] = useState(initialPagination)
  const [isLoading, setIsLoading] = useState(false) // Start with false since we have initial data
  const hasHydrated = useIsHydrated() // Track hydration status
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)
  const router = useRouter()

  const fetchPosts = useCallback(async (page: number = 1, retries: number = 3) => {
    setIsLoading(true)
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10'
        })
        
        const response = await fetch(`/api/posts?${params.toString()}`, {
          // Use default caching for better performance on subsequent loads
          headers: {
            'Accept': 'application/json',
          },
          // Shorter timeout for faster retries
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to fetch posts:', response.status, errorText)
          
          // For 503 errors, show a more specific message
          if (response.status === 503) {
            throw new Error('Service temporarily unavailable. Please refresh the page.')
          } else if (response.status >= 500) {
            throw new Error('Server error. Please try again in a moment.')
          } else {
            throw new Error(`Failed to fetch posts: ${response.status}`)
          }
        }
        
        const data = await response.json()
        
        // Validate response data
        if (!data || !Array.isArray(data.posts)) {
          throw new Error('Invalid response format')
        }
        
        setPosts(data.posts || [])
        setPagination(data.pagination || { total: 0, pages: 1, currentPage: 1, limit: 10 })
        setIsLoading(false)
        return // Success, exit retry loop
        
      } catch (error) {
        console.error(`Homepage posts fetch error (attempt ${attempt + 1}/${retries + 1}):`, error)
        
        // If this is the last attempt, handle the error
        if (attempt === retries) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load posts'
          
          // Show different messages based on error type
          if (errorMessage.includes('503')) {
            toast.error("Server is temporarily unavailable. Please try again in a few moments.")
          } else if (errorMessage.includes('timeout') || errorMessage.includes('TimeoutError')) {
            toast.error("Connection timeout. Please check your internet connection.")
          } else if (errorMessage.includes('Failed to fetch')) {
            toast.error("Network error. Please check your connection.")
          } else {
            toast.error("Failed to load posts. Please refresh the page.")
          }
          
          // Set empty state on error to prevent infinite loading
          setPosts([])
          setPagination({ total: 0, pages: 1, currentPage: 1, limit: 10 })
          setIsLoading(false)
          return
        }
        
        // Wait before retry with shorter delays for faster recovery
        const delay = 500 * (attempt + 1) // 500ms, 1s, 1.5s delays
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }, [posts?.length]) // Use optional chaining to handle null/undefined posts

  // Client-side fallback only when SSR completely fails (no initial data)
  useEffect(() => {
    // Only fetch if we have no initial posts AND we've hydrated AND we're not already loading
    if (hasHydrated && (!initialPosts || initialPosts.length === 0) && posts.length === 0 && !isLoading) {
      console.log("No initial posts from SSR, attempting client-side fetch...")
      fetchPosts(1).catch(error => {
        console.error("Client-side fallback fetch failed:", error)
      })
    }
  }, [hasHydrated, initialPosts, posts.length, isLoading, fetchPosts])

  // Callbacks for search params handler
  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > pagination.pages) return
    if (pagination.currentPage !== page) {
      fetchPosts(page)
    }
  }, [pagination.currentPage, pagination.pages, fetchPosts])

  const handleHighlight = useCallback((postId: string | null) => {
    setHighlightedPostId(postId)
  }, [])

  // Navigation handler for pagination buttons
  const handlePaginationClick = useCallback((page: number) => {
    if (page < 1 || page > pagination.pages) return
    router.push(`/?page=${page}`)
  }, [pagination.pages, router])

  useEffect(() => {
    // Scroll to highlighted post when posts are loaded
    if (highlightedPostId && posts.length > 0) {
      const postElement = document.getElementById(`post-${highlightedPostId}`)
      if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [highlightedPostId, posts])

  const handleCommentCountChange = (postId: string, newCount: number) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, comments: newCount }
          : post
      )
    )
  }

  // Generate pagination range with ellipsis
  const getPaginationRange = () => {
    const range: (number | string)[] = []
    const maxVisible = 5 // Maximum number of page buttons to show
    
    if (pagination.pages <= maxVisible) {
      // Show all pages if total pages is less than maxVisible
      return Array.from({ length: pagination.pages }, (_, i) => i + 1)
    }

    // Always show first page
    range.push(1)

    // Calculate start and end of visible range
    let start = Math.max(2, pagination.currentPage - 1)
    let end = Math.min(pagination.pages - 1, pagination.currentPage + 1)

    // Adjust range if current page is near the beginning or end
    if (pagination.currentPage <= 3) {
      end = Math.min(4, pagination.pages - 1)
    }
    if (pagination.currentPage >= pagination.pages - 2) {
      start = Math.max(2, pagination.pages - 3)
    }

    // Add ellipsis after first page if needed
    if (start > 2) {
      range.push('...')
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      range.push(i)
    }

    // Add ellipsis before last page if needed
    if (end < pagination.pages - 1) {
      range.push('...')
    }

    // Always show last page (if it's not already shown)
    if (pagination.pages > 1) {
      range.push(pagination.pages)
    }

    return range
  }

  // Show skeleton loading when we're loading and have no posts, OR when we haven't hydrated yet
  if ((isLoading && posts.length === 0) || !hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="homepage-layout">
            {/* Main content - ensure consistent width */}
            <div className="homepage-content skeleton-container">
              {/* Skeleton for PostCreator - match actual PostCreator dimensions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="animate-pulse">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
              </div>

              {/* Skeleton for posts - match actual PostCard dimensions */}
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 min-h-[200px]">
                  <div className="animate-pulse">
                    {/* Header section */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                    
                    {/* Content section */}
                    <div className="space-y-3 mb-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                    </div>
                    
                    {/* Actions section */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-4">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar skeleton - ensure consistent width */}
            <div className="homepage-sidebar skeleton-container">
              <div className="space-y-6">
                {/* Categories skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
                    <div className="space-y-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Trending posts skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="homepage-layout">
          {/* Main content - consistent width with skeleton */}
          <div className="homepage-content layout-stable">
            <LazyPostCreator onPostCreated={(result) => {
              if (result?.success) {
                // Refresh posts to show the new post
                fetchPosts(1).catch(console.error)
              }
            }} />
            
            {posts.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Be the first to share something with the community!
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Refresh Page
                </Button>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onCommentCountChange={handleCommentCountChange}
                  />
                ))}

                {/* Loading indicator for subsequent loads */}
                {isLoading && posts.length > 0 && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePaginationClick(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                    >
                      Previous
                    </Button>

                    {getPaginationRange().map((page, index) => (
                      <Button
                        key={index}
                        variant={page === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => typeof page === 'number' ? handlePaginationClick(page) : undefined}
                        disabled={typeof page !== 'number'}
                        className={typeof page !== 'number' ? 'cursor-default' : ''}
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePaginationClick(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar - consistent width with skeleton */}
          <div className="homepage-sidebar layout-stable">
            <LazySidebar />
          </div>
        </div>
      </div>

      {/* Search params handler */}
      <Suspense fallback={null}>
        <SearchParamsHandler
          onPageChange={handlePageChange}
          onHighlight={handleHighlight}
        />
      </Suspense>
    </div>
  )
}