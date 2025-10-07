/**
 * Client-Side Homepage Component - Alternative Implementation
 * 
 * This is an alternative client-side implementation of the homepage that differs from
 * the main homepage-interactive.tsx in several ways:
 * - Uses direct components instead of lazy-loaded ones
 * - Different loading and error handling patterns
 * - Alternative UI/UX approach with different animations
 * - More traditional client-side rendering approach
 * 
 * Key Features:
 * - Client-side post fetching with timeout protection
 * - Real-time post creation and updates
 * - URL-based pagination and post highlighting
 * - Responsive design with mobile optimization
 * - Comment count synchronization
 * - Error handling with user feedback
 * 
 * @author Forum Development Team
 * @version 1.5
 * @deprecated Consider using homepage-interactive.tsx for better performance
 */
"use client"

// React core hooks for state and lifecycle management
import { useEffect, useState } from "react"
// Next.js navigation hooks for URL and routing
import { useSearchParams, useRouter } from "next/navigation"
// Authentication context for user state
import { useAuth } from "@/lib/auth-context"
// Toast notifications for user feedback
import { toast } from "sonner"
// Core components for homepage functionality
import PostCreator from "@/components/post-creator"
import PostCard from "@/components/post-card"
import Sidebar from "@/components/sidebar"
// UI components
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Post interface - Represents a forum post with essential data
 * Note: This is a simplified version compared to the main homepage component
 */
interface Post {
  id: string                              // Unique post identifier
  author: {                               // Post author information
    id: string                            // Author's user ID
    name: string                          // Display name
    avatar: string                        // Profile picture URL
    isVerified: boolean                   // Account verification status
    rank: string                          // User rank/title
    rankIcon: string                      // Rank icon/emoji
  }
  content: string                         // Post text content
  category: string                        // Primary category name
  isAnonymous: boolean                    // Whether posted anonymously
  isPinned: boolean                       // Whether pinned to top
  upvotes: number                         // Number of upvotes
  downvotes: number                       // Number of downvotes
  userVote?: "up" | "down" | null         // Current user's vote status
  comments: number                        // Total comment count
  timeAgo: string                         // Human-readable time since creation
  images?: string[]                       // Attached image URLs
  topComment?: {                          // Featured comment preview
    author: {
      name: string
      image?: string
    }
    content: string
    upvotes: number
    downvotes: number
    isBestAnswer: boolean                 // Whether marked as best answer
  }
}

/**
 * Pagination interface - Defines pagination metadata
 */
interface Pagination {
  total: number                          // Total posts in database
  pages: number                          // Total pages available
  currentPage: number                    // Current page (1-indexed)
  limit: number                          // Posts per page
}

/**
 * Component props interface
 */
interface HomePageClientProps {
  initialPosts: Post[]                   // Initial posts from SSR/parent
  initialPagination: Pagination          // Initial pagination data
}

/**
 * Alternative Client-Side Homepage Component
 * 
 * This component provides an alternative implementation to the main homepage
 * with different performance characteristics and UI patterns.
 * 
 * Key Differences from homepage-interactive.tsx:
 * - Uses direct component imports instead of lazy loading
 * - Simpler error handling without retry logic
 * - Different animation and styling approach
 * - More traditional client-side data fetching
 * 
 * @param initialPosts - Initial posts data
 * @param initialPagination - Initial pagination state
 * @returns JSX element containing the homepage
 */
export default function HomePageClient({ initialPosts, initialPagination }: HomePageClientProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Core data state - initialized with props data
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [pagination, setPagination] = useState<Pagination>(initialPagination)
  
  // Loading state - starts false since we have initial data
  const [isLoading, setIsLoading] = useState(false)
  
  // Post highlighting state - for URL-based post highlighting
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)
  
  // Navigation and routing hooks
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Authentication context
  const { user } = useAuth()

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  
  /**
   * Fetches posts from the API with timeout protection
   * 
   * Features:
   * - Request timeout protection (10 seconds)
   * - Comprehensive error handling
   * - Cache prevention for fresh data
   * - Loading state management
   * - Graceful error recovery
   * 
   * @param page - Page number to fetch (default: 1)
   */
  const fetchPosts = async (page: number = 1) => {
    setIsLoading(true)
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      // Create abort controller for timeout protection
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.warn('Request timed out after 10 seconds')
      }, 10000) // 10 second timeout
      
      // Make API request with cache prevention
      const response = await fetch(`/api/posts?${params.toString()}`, {
        signal: controller.signal,
        cache: 'no-store',           // Prevent caching for fresh data
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
        }
      })
      
      // Clear timeout on successful response
      clearTimeout(timeoutId)
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch posts:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch posts'}`)
      }
      
      // Parse and validate response data
      const data = await response.json()
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format: not an object')
      }
      
      if (!Array.isArray(data.posts)) {
        console.warn('Invalid posts data:', data.posts)
        throw new Error('Invalid response format: posts is not an array')
      }
      
      // Update state with validated data
      setPosts(data.posts)
      setPagination(data.pagination || { total: 0, pages: 1, currentPage: 1, limit: 10 })
      
    } catch (error) {
      console.error('Homepage posts fetch error:', error)
      
      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast.error("Request timed out. Please check your connection and try again.")
        } else if (error.message.includes('HTTP 503')) {
          toast.error("Server is temporarily unavailable. Please try again in a moment.")
        } else if (error.message.includes('HTTP 429')) {
          toast.error("Too many requests. Please wait before trying again.")
        } else if (error.message.includes('Invalid response format')) {
          toast.error("Server returned invalid data. Please try again.")
        } else {
          toast.error("Failed to load posts. Please try again.")
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
      
      // Set empty state on error to prevent infinite loading
      setPosts([])
      setPagination({ total: 0, pages: 1, currentPage: 1, limit: 10 })
      
    } finally {
      // Always clear loading state
      setIsLoading(false)
    }
  }

  // ============================================================================
  // SIDE EFFECTS AND EVENT HANDLERS
  // ============================================================================
  
  /**
   * Main effect for handling URL parameters and page navigation
   * Responds to search parameter changes for pagination and post highlighting
   */
  useEffect(() => {
    // Extract URL parameters
    const page = parseInt(searchParams.get("page") || "1")
    const highlight = searchParams.get("highlight")
    
    // Handle post highlighting
    if (highlight) {
      setHighlightedPostId(highlight)
      // Auto-clear highlight after 3 seconds for better UX
      const timeoutId = setTimeout(() => setHighlightedPostId(null), 3000)
      return () => clearTimeout(timeoutId)
    }
    
    // Only fetch if we're not on page 1 or if we need to highlight a post
    // This prevents unnecessary API calls on initial load
    if (page !== 1) {
      // Use requestAnimationFrame to defer the fetch to next tick
      // This prevents blocking the main thread during rendering
      requestAnimationFrame(() => {
        fetchPosts(page)
      })
    }
    
    // Return empty cleanup function for code paths that don't need cleanup
    return () => {}
  }, [searchParams]) // Dependency on searchParams triggers on URL changes

  /**
   * Effect for handling post highlighting with smooth scrolling
   * Automatically scrolls to highlighted post when it becomes available
   */
  useEffect(() => {
    // Only scroll if we have a highlighted post and posts are loaded
    if (highlightedPostId && posts.length > 0) {
      // Find the highlighted post element
      const postElement = document.getElementById(`post-${highlightedPostId}`)
      if (postElement) {
        // Smooth scroll to center the post in viewport
        postElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      } else {
        // Log warning if post element not found (debugging)
        console.warn(`Post element not found: post-${highlightedPostId}`)
      }
    }
  }, [highlightedPostId, posts]) // Triggers when highlight changes or posts load

  /**
   * Effect for user authentication changes
   * Currently placeholder for future user-specific functionality
   */
  useEffect(() => {
    // TODO: Add user-specific logic here (e.g., personalized content, preferences)
    // This effect runs when user authentication state changes
  }, [user])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /**
   * Handles page navigation by updating the URL
   * Validates page bounds before navigation
   * 
   * @param newPage - Target page number
   */
  const handlePageChange = (newPage: number) => {
    // Validate page bounds
    if (newPage < 1 || newPage > pagination.pages) {
      console.warn(`Invalid page: ${newPage}. Valid range: 1-${pagination.pages}`)
      return
    }
    
    // Update URL to trigger page change via search params
    router.push(`/?page=${newPage}`)
  }

  /**
   * Handles real-time comment count updates for posts
   * Updates local state without requiring a full page refresh
   * 
   * @param postId - ID of the post with updated comment count
   * @param newCount - New comment count
   */
  const handleCommentCountChange = (postId: string, newCount: number) => {
    setPosts((prevPosts: Post[]) => 
      prevPosts.map((post: Post) => 
        post.id === postId 
          ? { ...post, comments: newCount }
          : post
      )
    )
  }

  // ============================================================================
  // PAGINATION UTILITIES
  // ============================================================================
  
  /**
   * Generates pagination range with ellipsis for optimal UX
   * Creates an array of page numbers and ellipsis for pagination display
   * 
   * Algorithm:
   * - Show all pages if total is small (≤5)
   * - Always show first and last page
   * - Show current page and adjacent pages
   * - Use ellipsis (...) for gaps
   * 
   * @returns Array of page numbers and ellipsis strings
   */
  const getPaginationRange = () => {
    const range: (number | string)[] = []
    const maxVisible = 5 // Maximum number of page buttons to show
    
    // Handle edge cases
    if (pagination.pages <= 0) {
      return [] // No pages to show
    }
    
    // If total pages is small, show all pages
    if (pagination.pages <= maxVisible) {
      return Array.from({ length: pagination.pages }, (_, i) => i + 1)
    }

    // Always show first page
    range.push(1)

    // Calculate start and end of visible range around current page
    let start = Math.max(2, pagination.currentPage - 1)
    let end = Math.min(pagination.pages - 1, pagination.currentPage + 1)

    // Add ellipsis after first page if there's a gap
    if (start > 2) {
      range.push("...")
    }
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      range.push(i)
    }

    // Add ellipsis before last page if there's a gap
    if (end < pagination.pages - 1) {
      range.push("...")
    }
    
    // Always show last page (if it's not the first page)
    if (pagination.pages > 1) {
      range.push(pagination.pages)
    }

    return range
  }

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          
          {/* ===== MAIN CONTENT AREA ===== */}
          <div className="lg:col-span-2 overflow-visible animate-slide-in-up animate-stagger-1">
            
            {/* Post Creation Component */}
            <div className="animate-fade-in-up animate-stagger-2 hover-lift smooth-transition">
              <PostCreator onPostCreated={async () => {
                // Optimized post creation handler with fallback strategy
                try {
                  // Build optimized refresh parameters
                  const params = new URLSearchParams({
                    page: '1', // Always refresh to first page to show new post
                    limit: pagination?.limit?.toString() || '10'
                  })
                  
                  // Create timeout controller for faster refresh
                  const controller = new AbortController()
                  const timeoutId = setTimeout(() => {
                    controller.abort()
                    console.warn('Post refresh timed out')
                  }, 5000) // 5 second timeout for refresh operations
                  
                  // Fetch fresh posts data
                  const response = await fetch(`/api/posts?${params.toString()}`, {
                    signal: controller.signal,
                    cache: 'no-store', // Ensure fresh data
                    headers: {
                      'Cache-Control': 'no-cache',
                      'Accept': 'application/json',
                    }
                  })
                  
                  clearTimeout(timeoutId)
                  
                  if (response.ok) {
                    const data = await response.json()
                    
                    // Validate response data
                    if (data && Array.isArray(data.posts)) {
                      // Update state immediately for responsive UX
                      setPosts(data.posts)
                      setPagination(data.pagination || pagination)
                      
                      // Smooth scroll to top to show new post
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }, 50)
                      
                      // Show success feedback
                      toast.success("Post created successfully!")
                    } else {
                      throw new Error('Invalid response format')
                    }
                  } else {
                    throw new Error(`HTTP ${response.status}: Failed to refresh posts`)
                  }
                  
                } catch (error) {
                  console.error('Failed to refresh posts after creation:', error)
                  
                  // Determine error type and provide appropriate feedback
                  if (error instanceof Error) {
                    if (error.name === 'AbortError') {
                      toast.info("Post created! Refresh timed out, please reload manually.")
                    } else {
                      toast.info("Post created! Unable to refresh automatically.")
                    }
                  }
                  
                  // Fallback to full refresh if silent update fails
                  try {
                    await fetchPosts(1)
                    toast.success("Post created and page refreshed!")
                  } catch (refreshError) {
                    console.error('Fallback refresh also failed:', refreshError)
                    toast.error("Post created but failed to refresh. Please reload the page.")
                  }
                }
              }} />
            </div>

            {/* ===== CONTENT RENDERING WITH LOADING STATES ===== */}
            {isLoading ? (
              /* Loading skeleton for better perceived performance */
              <div className="space-y-3 sm:space-y-4 animate-fade-in">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow">
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                      {/* Author avatar skeleton */}
                      <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                      <div className="space-y-2">
                        {/* Author name and details skeleton */}
                        <Skeleton className="h-3 sm:h-4 w-[150px] sm:w-[200px]" />
                        <Skeleton className="h-2 sm:h-3 w-[100px] sm:w-[150px]" />
                      </div>
                    </div>
                    {/* Post content skeleton */}
                    <Skeleton className="h-16 sm:h-24 w-full mb-3 sm:mb-4" />
                    <div className="flex justify-between">
                      {/* Action buttons skeleton */}
                      <Skeleton className="h-6 sm:h-8 w-[80px] sm:w-[100px]" />
                      <Skeleton className="h-6 sm:h-8 w-[80px] sm:w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Main content when not loading */
              <>
                {/* Posts list with highlighting support */}
                <div className="space-y-3 sm:space-y-4 overflow-visible">
                  {posts.map((post: Post) => (
                    <div 
                      key={post.id}
                      id={`post-${post.id}`} // ID for scroll targeting
                      className={`hover-lift smooth-transition ${
                        highlightedPostId === post.id 
                          ? 'ring-2 ring-primary ring-offset-2 bg-primary/5 transition-all duration-300' 
                          : ''
                      }`}
                    >
                      <PostCard 
                        post={post} 
                        onCommentCountChange={handleCommentCountChange}
                        showTitle={false}
                      />
                    </div>
                  ))}
                </div>

                {/* ===== PAGINATION CONTROLS ===== */}
                {/* Only show pagination if there are multiple pages */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center mt-6 sm:mt-8 px-2 animate-fade-in-up animate-delay-500">
                    <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Pagination Navigation">
                      
                      {/* Previous page button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="px-2 sm:px-3 text-xs sm:text-sm"
                        aria-label="Go to previous page"
                      >
                        Previous
                      </Button>
                      
                      {/* Page number buttons and ellipsis */}
                      {getPaginationRange().map((page, index) => (
                        <div key={index}>
                          {typeof page === "string" ? (
                            /* Ellipsis indicator */
                            <span 
                              className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm text-gray-500"
                              aria-label="More pages"
                            >
                              {page}
                            </span>
                          ) : (
                            /* Page number button */
                            <Button
                              variant={page === pagination.currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="px-2 sm:px-3 text-xs sm:text-sm min-w-[32px] sm:min-w-[36px]"
                              aria-label={`Go to page ${page}`}
                              aria-current={page === pagination.currentPage ? "page" : undefined}
                            >
                              {page}
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      {/* Next page button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.pages}
                        className="px-2 sm:px-3 text-xs sm:text-sm"
                        aria-label="Go to next page"
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ===== SIDEBAR COMPONENT ===== */}
          {/* Hidden on mobile, visible on large screens */}
          <div className="hidden lg:block lg:col-span-1 animate-slide-in-up animate-stagger-5">
            <div className="animate-fade-in-up hover-scale smooth-transition">
              <Sidebar />
            </div>
          </div>
          
        </div>
      </main>
    </div>
  )
}