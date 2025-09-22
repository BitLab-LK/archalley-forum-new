/**
 * Homepage Interactive Component - Main client-side homepage implementation
 * 
 * This component handles all client-side interactions for the forum homepage including:
 * - Post fetching with retry logic and error handli      author: {
        id: postData.isAnonymous ? 'anonymous' : (postData.author?.id || 'unknown'),
        name: postData.isAnonymous ? 'Anonymous' : (postData.author?.name || 'User'),
        avatar: postData.isAnonymous ? '/placeholder-user.jpg' : (postData.author?.avatar || '/placeholder-user.jpg'),
        isVerified: false,
        rank: 'Member',
        rankIcon: '🧑'
      },tion management and navigation
 * - Post highlighting from URL parameters
 * - Real-time post updates and comment count changes
 * - Loading states and skeleton UI
 * - Progressive enhancement from SSR data
 * 
 * Architecture:
 * - Receives initial data from SSR for optimal performance
 * - Falls back to client-side fetching if SSR fails
 * - Implements retry logic for robust error handling
 * - Uses lazy loading for performance optimization
 * - Maintains consistent layout during loading states
 * 
 * @author Forum Development Team
 * @version 2.0
 */
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
import { useSocket } from "@/lib/socket-context"

/**
 * Post interface - Represents a complete forum post with all associated data
 * This interface ensures type safety across the homepage components
 */
interface Post {
  id: string                              // Unique post identifier
  author: {                               // Post author information
    id: string                            // Author's user ID
    name: string                          // Display name ("Anonymous" for anonymous posts)
    avatar: string                        // Profile picture URL
    isVerified: boolean                   // Verification status
    rank: string                          // User rank/badge name
    rankIcon: string                      // Rank icon/emoji
  }
  content: string                         // Post text content
  category: string                        // Primary category name (for backward compatibility)
  categories?: {                          // Primary category object with full details
    id: string
    name: string
    color: string                         // Category color for UI styling
    slug: string                          // URL-friendly category identifier
  }
  allCategories?: Array<{                 // Multiple categories for multi-category posts
    id: string
    name: string
    color: string
    slug: string
  }>
  aiCategories?: string[]                 // AI-suggested category names
  isAnonymous: boolean                    // Whether post was made anonymously
  isPinned: boolean                       // Whether post is pinned to top
  upvotes: number                         // Number of upvotes
  downvotes: number                       // Number of downvotes
  userVote?: "up" | "down" | null         // Current user's vote (if any)
  comments: number                        // Total comment count
  timeAgo: string                         // Human-readable time since post creation
  images?: string[]                       // Array of attached image URLs
  topComment?: {                          // Featured/best comment preview
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
 * Pagination interface - Defines pagination state and metadata
 */
interface Pagination {
  total: number                          // Total number of posts in database
  pages: number                          // Total number of pages available
  currentPage: number                    // Current page number (1-indexed)
  limit: number                          // Number of posts per page
}

/**
 * HomePageInteractive Props Interface
 */
interface HomePageInteractiveProps {
  initialPosts: Post[]                   // Initial posts from SSR
  initialPagination: Pagination          // Initial pagination from SSR
}

/**
 * Main Homepage Interactive Component
 * 
 * This component manages the interactive homepage experience including:
 * - Post display and pagination
 * - Client-side data fetching with retry logic
 * - Loading states and error handling
 * - Post highlighting and URL parameter management
 * - Real-time updates for comment counts
 * 
 * @param initialPosts - Posts data from server-side rendering
 * @param initialPagination - Pagination data from server-side rendering
 * @returns JSX element containing the interactive homepage
 */
export default function HomePageInteractive({
  initialPosts,
  initialPagination,
}: HomePageInteractiveProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Core data state - initialized with SSR data for optimal performance
  const [posts, setPosts] = useState<Post[]>(initialPosts || [])
  const [pagination, setPagination] = useState(initialPagination)
  
  // Loading state - starts false since we have initial SSR data
  const [isLoading, setIsLoading] = useState(false)
  
  // Hydration tracking - ensures client-side logic only runs after hydration
  const hasHydrated = useIsHydrated()
  
  // Post highlighting state - for highlighting specific posts via URL parameters
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)
  
  // Real-time updates state
  const [optimisticPosts, setOptimisticPosts] = useState<Post[]>([])
  
  // Navigation hook for programmatic routing
  const router = useRouter()
  
  // Socket.IO integration for real-time updates
  const { socket } = useSocket()

  // ============================================================================
  // OPTIMISTIC UPDATES FOR REAL-TIME EXPERIENCE
  // ============================================================================
  
  /**
   * Add a post optimistically to the UI for immediate feedback
   * This function creates a temporary post that appears instantly while the real post is being processed
   * 
   * @param postData - The post data from the creation form
   * @returns The temporary post ID for later replacement
   */
  const addOptimisticPost = useCallback((postData: {
    content: string
    isAnonymous: boolean
    images?: string[]
    author?: {
      id: string
      name: string
      avatar: string
    }
  }) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const optimisticPost: Post = {
      id: tempId,
      content: postData.content,
      author: postData.isAnonymous ? {
        id: 'anonymous',
        name: 'Anonymous',
        avatar: '/placeholder-user.jpg',
        isVerified: false,
        rank: 'Member',
        rankIcon: '👤'
      } : {
        id: postData.author?.id || 'unknown',
        name: postData.author?.name || 'User',
        avatar: postData.author?.avatar || '/placeholder-user.jpg',
        isVerified: false,
        rank: 'Member',
        rankIcon: '👤'
      },
      category: 'informative', // Default category
      categories: {
        id: 'informative',
        name: 'Informative',
        color: '#0D9488',
        slug: 'informative'
      },
      isAnonymous: postData.isAnonymous,
      isPinned: false,
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      comments: 0,
      timeAgo: 'Just now',
      images: postData.images || []
    }
    
    // Add to optimistic posts list
    setOptimisticPosts(prev => [optimisticPost, ...prev])
    
    // Remove the optimistic post after 30 seconds if it hasn't been replaced
    setTimeout(() => {
      setOptimisticPosts(prev => prev.filter(post => post.id !== tempId))
    }, 30000)
    
    return tempId
  }, [])
  
  /**
   * Replace an optimistic post with the real post data
   * 
   * @param tempId - The temporary post ID to replace
   * @param realPost - The real post data from the server
   */
  const replaceOptimisticPost = useCallback((tempId: string, realPost: Post) => {
    // Remove from optimistic posts
    setOptimisticPosts(prev => prev.filter(post => post.id !== tempId))
    
    // Add real post to the beginning of the posts list if it's not already there
    setPosts(prev => {
      const exists = prev.some(post => post.id === realPost.id)
      if (exists) return prev
      return [realPost, ...prev]
    })
  }, [])

  // ============================================================================
  // SOCKET.IO REAL-TIME UPDATES
  // ============================================================================
  
  /**
   * Socket.IO effect for real-time post updates
   * Listens for new posts from other users and updates the UI automatically
   */
  useEffect(() => {
    if (!socket || !hasHydrated) return
    
    /**
     * Handle new post broadcast from other users
     * @param newPost - The new post data from Socket.IO
     */
    const handleNewPost = (newPost: Post) => {
      console.log('📡 Received new post via Socket.IO:', newPost.id)
      
      // If this was an optimistic post, replace it with the real one
      if (newPost.id) {
        const tempId = `temp-${newPost.content?.slice(0, 10) || 'unknown'}`
        replaceOptimisticPost(tempId, newPost)
      }
      
      // Add the new post to the beginning of the list
      setPosts(prev => {
        // Check if post already exists to prevent duplicates
        const exists = prev.some(post => post.id === newPost.id)
        if (exists) return prev
        
        // Add new post at the top
        return [newPost, ...prev]
      })
      
      // Show a subtle notification for new posts from other users
      toast.success('New post added to the feed', {
        duration: 2000,
        position: 'bottom-right'
      })
    }
    
    /**
     * Handle post updates (votes, comments, etc.)
     * @param updatedPost - The updated post data
     */
    const handlePostUpdate = (updatedPost: Partial<Post> & { id: string }) => {
      setPosts(prev => prev.map(post => 
        post.id === updatedPost.id 
          ? { ...post, ...updatedPost }
          : post
      ))
    }
    
    // Register Socket.IO event listeners
    socket.on('new-post', handleNewPost)
    socket.on('post-update', handlePostUpdate)
    
    // Cleanup event listeners
    return () => {
      socket.off('new-post', handleNewPost)
      socket.off('post-update', handlePostUpdate)
    }
  }, [socket, hasHydrated, replaceOptimisticPost])
  
  /**
   * Get combined posts list (optimistic + real posts)
   * Optimistic posts appear at the top for immediate feedback
   */
  const combinedPosts = [...optimisticPosts, ...posts]
  
  /**
   * Fetches posts with robust error handling and retry logic
   * 
   * Features:
   * - Automatic retry with exponential backoff
   * - Comprehensive error handling for different HTTP status codes
   * - Request timeout protection
   * - User-friendly error messages
   * - Data validation
   * 
   * @param page - Page number to fetch (1-indexed)
   * @param retries - Number of retry attempts (default: 3)
   */
  const fetchPosts = useCallback(async (page: number = 1, retries: number = 3) => {
    setIsLoading(true)
    
    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10'
        })
        
        // Make API request with timeout protection
        const response = await fetch(`/api/posts?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
          },
          // 10 second timeout prevents hanging requests
          signal: AbortSignal.timeout(10000)
        })
        
        // Handle HTTP errors with specific messaging
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to fetch posts:', response.status, errorText)
          
          // Provide user-friendly error messages based on status code
          if (response.status === 503) {
            throw new Error('Service temporarily unavailable. Please refresh the page.')
          } else if (response.status >= 500) {
            throw new Error('Server error. Please try again in a moment.')
          } else if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment before trying again.')
          } else if (response.status === 404) {
            throw new Error('Posts not found. Page may not exist.')
          } else {
            throw new Error(`Failed to fetch posts: ${response.status}`)
          }
        }
        
        const data = await response.json()
        
        // Validate response data structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format: not an object')
        }
        
        if (!Array.isArray(data.posts)) {
          throw new Error('Invalid response format: posts is not an array')
        }
        
        if (!data.pagination || typeof data.pagination !== 'object') {
          throw new Error('Invalid response format: missing pagination')
        }
        
        // Update state with validated data
        setPosts(data.posts)
        setPagination(data.pagination)
        setIsLoading(false)
        return // Success, exit retry loop
        
      } catch (error) {
        console.error(`Homepage posts fetch error (attempt ${attempt + 1}/${retries + 1}):`, error)
        
        // If this is the last attempt, handle the error gracefully
        if (attempt === retries) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load posts'
          
          // Show contextual error messages based on error type
          if (errorMessage.includes('503')) {
            toast.error("Server is temporarily unavailable. Please try again in a few moments.")
          } else if (errorMessage.includes('timeout') || errorMessage.includes('TimeoutError')) {
            toast.error("Connection timeout. Please check your internet connection.")
          } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            toast.error("Network error. Please check your connection.")
          } else if (errorMessage.includes('429')) {
            toast.error("Too many requests. Please wait before trying again.")
          } else if (errorMessage.includes('Invalid response format')) {
            toast.error("Server returned invalid data. Please try again.")
          } else {
            toast.error("Failed to load posts. Please refresh the page.")
          }
          
          // Set empty state on final failure to prevent infinite loading
          setPosts([])
          setPagination({ total: 0, pages: 1, currentPage: 1, limit: 10 })
          setIsLoading(false)
          return
        }
        
        // Exponential backoff: wait before retry with increasing delays
        const delay = Math.min(500 * Math.pow(2, attempt), 5000) // 500ms, 1s, 2s, 4s, max 5s
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }, []) // Remove posts.length dependency to prevent unnecessary re-renders

  // ============================================================================
  // POST CREATION HANDLERS
  // ============================================================================
  
  /**
   * Handle post creation with optimistic updates
   * @param result - Post creation result from API
   */
  const handlePostCreate = useCallback((result: any) => {
    if (result?.success && result?.post) {
      console.log('✅ Post created successfully:', result.post.id)
      
      // Ensure the post has proper author and category structure
      const postWithAuthor = {
        ...result.post,
        author: result.post.author || {
          id: result.post.isAnonymous ? 'anonymous' : 'unknown',
          name: result.post.isAnonymous ? 'Anonymous' : 'User',
          avatar: '/placeholder-user.jpg',
          isVerified: false,
          rank: 'Member',
          rankIcon: '🧑'
        },
        // Ensure category field exists for PostCard compatibility
        category: result.post.category || result.post.categories?.name || 'General'
      }
      
      // Add optimistic post immediately for smoother UX
      addOptimisticPost(postWithAuthor)
      
      // Update the main posts list
      setPosts(prev => {
        // Check if post already exists to prevent duplicates
        const exists = prev.some(post => post.id === postWithAuthor.id)
        if (exists) return prev
        
        // Add new post at the top
        return [postWithAuthor, ...prev]
      })
      
      // Clear any optimistic posts that might match this content
      setOptimisticPosts(prev => prev.filter(post => 
        post.content !== postWithAuthor.content
      ))
      
      // Show success message
      toast.success(postWithAuthor.images?.length > 0 
        ? '🖼️ Image post created successfully!' 
        : '📝 Post created successfully!', {
        duration: 3000,
        style: {
          border: '1px solid #10b981',
          padding: '16px',
          color: '#047857',
        },
      })
    } else if (result?.error) {
      console.error('❌ Post creation failed:', result.error)
      toast.error('Failed to create post: ' + result.error)
    }
  }, [addOptimisticPost])

  // ============================================================================
  // SIDE EFFECTS AND EVENT HANDLERS
  // ============================================================================
  
  /**
   * Client-side fallback effect
   * Only triggers when SSR completely fails to provide initial data
   * Ensures the homepage still functions even without server-side rendering
   */
  useEffect(() => {
    // Only fetch if we have no initial posts AND we've hydrated AND we're not already loading
    const shouldFallbackFetch = hasHydrated && 
                               (!initialPosts || initialPosts.length === 0) && 
                               posts.length === 0 && 
                               !isLoading
    
    if (shouldFallbackFetch) {
      console.log("🔄 No initial posts from SSR, attempting client-side fallback fetch...")
      fetchPosts(1).catch(error => {
        console.error("❌ Client-side fallback fetch failed:", error)
      })
    }
  }, [hasHydrated, initialPosts, posts.length, isLoading, fetchPosts])

  /**
   * Page change handler for search params
   * Validates page bounds and prevents unnecessary requests
   * 
   * @param page - Target page number
   */
  const handlePageChange = useCallback((page: number) => {
    // Validate page bounds
    if (page < 1 || page > pagination.pages) {
      console.warn(`Invalid page number: ${page}. Valid range: 1-${pagination.pages}`)
      return
    }
    
    // Only fetch if page actually changed
    if (pagination.currentPage !== page) {
      fetchPosts(page)
    }
  }, [pagination.currentPage, pagination.pages, fetchPosts])

  /**
   * Post highlight handler for URL-based post highlighting
   * 
   * @param postId - ID of post to highlight, or null to clear highlight
   */
  const handleHighlight = useCallback((postId: string | null) => {
    setHighlightedPostId(postId)
  }, [])

  /**
   * Navigation handler for pagination buttons
   * Updates URL to trigger page change via search params
   * 
   * @param page - Target page number
   */
  const handlePaginationClick = useCallback((page: number) => {
    // Validate page bounds before navigation
    if (page < 1 || page > pagination.pages) {
      console.warn(`Invalid pagination click: page ${page}. Valid range: 1-${pagination.pages}`)
      return
    }
    
    // Update URL to trigger page change
    router.push(`/?page=${page}`)
  }, [pagination.pages, router])

  /**
   * Effect to handle post highlighting with smooth scrolling
   * Automatically scrolls to highlighted post when posts are loaded
   */
  useEffect(() => {
    // Only scroll if we have a highlighted post and posts are loaded
    if (highlightedPostId && posts.length > 0) {
      // Use setTimeout to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        const postElement = document.getElementById(`post-${highlightedPostId}`)
        if (postElement) {
          postElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        } else {
          console.warn(`Post element not found: post-${highlightedPostId}`)
        }
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
    
    // Return undefined for cases where condition is not met
    return undefined
  }, [highlightedPostId, posts])

  /**
   * Handles real-time comment count updates for posts
   * Updates the local state when comment counts change without requiring a full refresh
   * 
   * @param postId - ID of the post whose comment count changed
   * @param newCount - New comment count
   */
  const handleCommentCountChange = useCallback((postId: string, newCount: number) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, comments: newCount }
          : post
      )
    )
  }, [])

  // ============================================================================
  // PAGINATION LOGIC
  // ============================================================================
  
  /**
   * Generates pagination range with ellipsis for optimal UX
   * Handles large page counts by showing relevant pages with ellipsis
   * 
   * Algorithm:
   * - Always show first and last page
   * - Show current page and adjacent pages
   * - Use ellipsis (...) for gaps
   * - Adjust range based on current position
   * 
   * @returns Array of page numbers and ellipsis strings
   */
  const getPaginationRange = useCallback(() => {
    const range: (number | string)[] = []
    const maxVisible = 5 // Maximum number of page buttons to show
    
    // Handle edge case: no pages or invalid pagination
    if (pagination.pages <= 0) {
      return []
    }
    
    // If total pages is small, show all pages
    if (pagination.pages <= maxVisible) {
      return Array.from({ length: pagination.pages }, (_, i) => i + 1)
    }

    // Always show first page
    range.push(1)

    // Calculate visible range around current page
    let start = Math.max(2, pagination.currentPage - 1)
    let end = Math.min(pagination.pages - 1, pagination.currentPage + 1)

    // Adjust range if current page is near the beginning
    if (pagination.currentPage <= 3) {
      end = Math.min(4, pagination.pages - 1)
    }
    
    // Adjust range if current page is near the end
    if (pagination.currentPage >= pagination.pages - 2) {
      start = Math.max(2, pagination.pages - 3)
    }

    // Add ellipsis after first page if there's a gap
    if (start > 2) {
      range.push('...')
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      range.push(i)
    }

    // Add ellipsis before last page if there's a gap
    if (end < pagination.pages - 1) {
      range.push('...')
    }

    // Always show last page (if it's not already shown)
    if (pagination.pages > 1) {
      range.push(pagination.pages)
    }

    return range
  }, [pagination.currentPage, pagination.pages])

  // ============================================================================
  // LOADING STATES AND SKELETON UI
  // ============================================================================
  
  /**
   * Show skeleton loading UI when:
   * 1. We're loading and have no posts to show, OR
   * 2. We haven't hydrated yet (prevents hydration mismatch)
   * 
   * This ensures smooth user experience during initial load and prevents
   * layout shift between server and client rendering
   */
  if ((isLoading && posts.length === 0) || !hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-no-overflow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          <div className="homepage-layout">
            {/* Main content - ensure consistent width */}
            <div className="homepage-content">
              {/* Skeleton for PostCreator - match actual PostCreator dimensions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 mb-4 lg:mb-6">
                <div className="animate-pulse">
                  <div className="h-4 lg:h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-3 lg:mb-4"></div>
                  <div className="h-20 lg:h-24 bg-gray-200 dark:bg-gray-700 rounded mb-3 lg:mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-8 lg:h-9 bg-gray-200 dark:bg-gray-700 rounded w-16 lg:w-20"></div>
                    <div className="h-8 lg:h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 lg:w-24"></div>
                  </div>
                </div>
              </div>

              {/* Skeleton for posts - match actual PostCard dimensions */}
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 mb-4 lg:mb-6 min-h-[180px] lg:min-h-[200px]">
                  <div className="animate-pulse">
                    {/* Header section */}
                    <div className="flex items-center space-x-3 mb-3 lg:mb-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 lg:h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 lg:w-32"></div>
                        <div className="h-2 lg:h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 lg:w-20"></div>
                      </div>
                      <div className="h-5 lg:h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 lg:w-16"></div>
                    </div>
                    
                    {/* Content section */}
                    <div className="space-y-2 lg:space-y-3 mb-4 lg:mb-6">
                      <div className="h-3 lg:h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-3 lg:h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                      <div className="h-3 lg:h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                    </div>
                    
                    {/* Actions section */}
                    <div className="flex items-center justify-between pt-3 lg:pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-3 lg:space-x-4">
                        <div className="h-7 lg:h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 lg:w-16"></div>
                        <div className="h-7 lg:h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 lg:w-20"></div>
                        <div className="h-7 lg:h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 lg:w-16"></div>
                      </div>
                      <div className="h-7 lg:h-8 bg-gray-200 dark:bg-gray-700 rounded w-10 lg:w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar skeleton - ensure consistent width */}
            <div className="homepage-sidebar">
              <div className="space-y-4 lg:space-y-6">
                {/* Categories skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                  <div className="animate-pulse">
                    <div className="h-5 lg:h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3 lg:mb-4"></div>
                    <div className="space-y-2 lg:space-y-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-3 lg:h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                          <div className="h-3 lg:h-4 bg-gray-200 dark:bg-gray-700 rounded w-6 lg:w-8"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Trending posts skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                  <div className="animate-pulse">
                    <div className="h-5 lg:h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3 lg:mb-4"></div>
                    <div className="space-y-3 lg:space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="h-2 lg:h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 lg:w-16"></div>
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

  // ============================================================================
  // MAIN CONTENT RENDERING
  // ============================================================================
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-no-overflow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="homepage-layout">
          {/* Main content area - maintains consistent width during loading */}
          <div className="homepage-content layout-stable">
            {/* Post creation component with optimistic updates and real-time callback */}
            <LazyPostCreator onPostCreated={handlePostCreate} />
            
            {/* Handle empty state when no posts are available */}
            {combinedPosts.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Be the first to share something with the community!
                </p>
                <Button
                  onClick={() => fetchPosts(1)}
                  variant="outline"
                >
                  Refresh Posts
                </Button>
              </div>
            ) : (
              <>
                {/* Render all posts with optimistic updates and real-time features */}
                {combinedPosts.map((post) => (
                  <div key={post.id} className={`transition-all duration-300 ${
                    post.id.startsWith('temp-') ? 'opacity-75 animate-pulse' : ''
                  } ${
                    highlightedPostId === post.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}>
                    <PostCard
                      post={post}
                      onCommentCountChange={handleCommentCountChange}
                    />
                  </div>
                ))}

                {/* Loading indicator for subsequent page loads */}
                {isLoading && posts.length > 0 && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {/* Pagination controls - only show if multiple pages exist */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-8">
                    {/* Previous page button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePaginationClick(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                      aria-label="Previous page"
                    >
                      Previous
                    </Button>

                    {/* Page number buttons and ellipsis */}
                    {getPaginationRange().map((page, index) => (
                      <Button
                        key={index}
                        variant={page === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => typeof page === 'number' ? handlePaginationClick(page) : undefined}
                        disabled={typeof page !== 'number'}
                        className={typeof page !== 'number' ? 'cursor-default' : ''}
                        aria-label={typeof page === 'number' ? `Page ${page}` : 'Ellipsis'}
                        aria-current={page === pagination.currentPage ? 'page' : undefined}
                      >
                        {page}
                      </Button>
                    ))}

                    {/* Next page button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePaginationClick(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.pages}
                      aria-label="Next page"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar - maintains consistent width during loading states */}
          <div className="homepage-sidebar layout-stable">
            <LazySidebar />
          </div>
        </div>
      </div>

      {/* Search parameters handler - manages URL-based state */}
      {/* Wrapped in Suspense to prevent hydration issues */}
      <Suspense fallback={null}>
        <SearchParamsHandler
          onPageChange={handlePageChange}
          onHighlight={handleHighlight}
        />
      </Suspense>
    </div>
  )
}