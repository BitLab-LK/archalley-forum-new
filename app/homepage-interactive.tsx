"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import PostCreator from "@/components/post-creator"
import PostCard from "@/components/post-card"
import Sidebar from "@/components/sidebar"
import { Button } from "@/components/ui/button"

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
  const [posts, setPosts] = useState(initialPosts)
  const [pagination, setPagination] = useState(initialPagination)
  const [isLoading, setIsLoading] = useState(false) // Start with false since we have initial data
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const fetchPosts = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`/api/posts?${params.toString()}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch posts:', response.status, errorText)
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }
      const data = await response.json()
      setPosts(data.posts || [])
      setPagination(data.pagination || { total: 0, pages: 1, currentPage: 1, limit: 10 })
    } catch (error) {
      console.error('Homepage posts fetch error:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Request timed out. Please refresh the page.")
      } else {
        toast.error("Failed to load posts")
      }
      // Set empty state on error to prevent infinite loading
      setPosts([])
      setPagination({ total: 0, pages: 1, currentPage: 1, limit: 10 })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1")
    const highlight = searchParams.get("highlight")
    
    if (highlight) {
      setHighlightedPostId(highlight)
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedPostId(null), 3000)
    }
    
    // Only fetch if it's not the first page (since we have SSR data for page 1)
    // and only if we don't already have posts for this page
    if (page !== 1 && pagination.currentPage !== page) {
      fetchPosts(page)
    }
  }, [searchParams])

  useEffect(() => {
    // Scroll to highlighted post when posts are loaded
    if (highlightedPostId && posts.length > 0) {
      const postElement = document.getElementById(`post-${highlightedPostId}`)
      if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [highlightedPostId, posts])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return
    router.push(`/?page=${newPage}`)
  }

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

    // Add ellipsis if needed
    if (start > 2) range.push("...")
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      range.push(i)
    }

    // Add ellipsis if needed
    if (end < pagination.pages - 1) range.push("...")
    
    // Always show last page
    if (pagination.pages > 1) range.push(pagination.pages)

    return range
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 overflow-visible animate-slide-in-up animate-stagger-1">
            <div className="animate-fade-in-up animate-stagger-2 hover-lift smooth-transition">
              <PostCreator onPostCreated={async () => {
                // Optimized refresh with immediate state update and cache busting
                try {
                  // Add cache-busting timestamp to prevent stale data
                  const cacheTimestamp = Date.now()
                  const params = new URLSearchParams({
                    page: '1',
                    limit: pagination?.limit?.toString() || '10',
                    _t: cacheTimestamp.toString() // Cache buster
                  })
                  
                  const controller = new AbortController()
                  const timeoutId = setTimeout(() => controller.abort(), 8000) // Increased timeout
                  
                  const response = await fetch(`/api/posts?${params.toString()}`, {
                    signal: controller.signal,
                    cache: 'no-store',
                    headers: {
                      'Cache-Control': 'no-cache, no-store, must-revalidate',
                      'Pragma': 'no-cache',
                      'Expires': '0',
                      'Accept': 'application/json',
                    }
                  })
                  
                  clearTimeout(timeoutId)
                  
                  if (response.ok) {
                    const data = await response.json()
                    
                    // Immediate state update for real-time feel
                    setPosts(data.posts || [])
                    setPagination(data.pagination || pagination)
                    
                    // Force reload of images with new cache headers
                    if (data.posts && data.posts.length > 0) {
                      data.posts.forEach((post: any) => {
                        if (post.images && post.images.length > 0) {
                          post.images.forEach((imageUrl: string) => {
                            // Preload images to ensure they're cached properly
                            const img = document.createElement('img')
                            img.src = imageUrl
                          })
                        }
                      })
                    }
                    
                    // Reduced scroll delay for faster UX
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 50)
                    
                    // Show success feedback
                    toast.success("Post created and feed updated!")
                  } else {
                    throw new Error('Failed to refresh posts')
                  }
                } catch (error) {
                  console.error('Failed to refresh posts:', error)
                  // Fallback to full refresh if silent update fails
                  toast.info("Post created! Refreshing...")
                  // Force a hard refresh with cache clearing
                  await fetchPosts(1)
                }
              }} />
            </div>

            <div className="space-y-3 sm:space-y-4 overflow-visible">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow animate-pulse">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                      <div className="flex space-x-4">
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                posts.map((post: Post) => (
                  <div 
                    key={post.id}
                    id={`post-${post.id}`}
                    className={`hover-lift smooth-transition ${
                      highlightedPostId === post.id ? 'ring-2 ring-primary ring-offset-2 bg-primary/5 transition-all duration-300' : ''
                    }`}
                  >
                    <PostCard 
                      post={post} 
                      onCommentCountChange={handleCommentCountChange}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Pagination - Mobile Optimized */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-6 sm:mt-8 px-2 animate-fade-in-up animate-delay-500">
                <nav className="flex items-center space-x-1 sm:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="text-xs sm:text-sm px-2 sm:px-3 smooth-transition hover-lift"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  
                  {getPaginationRange().map((page, i) => (
                    page === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-1 sm:px-2 text-xs sm:text-sm">...</span>
                    ) : (
                      <Button
                        key={page}
                        variant={pagination.currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="text-xs sm:text-sm min-w-[32px] sm:min-w-[40px] px-2 sm:px-3 smooth-transition hover-lift"
                      >
                        {page}
                      </Button>
                    )
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.pages}
                    className="text-xs sm:text-sm px-2 sm:px-3 smooth-transition hover-lift"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                  </Button>
                </nav>
              </div>
            )}
          </div>

          {/* Sidebar - Full interactive version */}
          <div className="hidden lg:block lg:col-span-1 animate-slide-in-up animate-stagger-5">
            <div className="hover-scale smooth-transition">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}