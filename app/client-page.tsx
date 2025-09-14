"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import PostCreator from "@/components/post-creator"
import PostCard from "@/components/post-card"
import Sidebar from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

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

interface HomePageClientProps {
  initialPosts: Post[]
  initialPagination: Pagination
}

export default function HomePageClient({ initialPosts, initialPagination }: HomePageClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [pagination, setPagination] = useState<Pagination>(initialPagination)
  const [isLoading, setIsLoading] = useState(false) // Start with false since we have initial data
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

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
      // Clear highlight after 3 seconds (reduced from 5)
      setTimeout(() => setHighlightedPostId(null), 3000)
    }
    
    // Only fetch if we're not on page 1 or if we need to highlight a post
    if (page !== 1 || highlight) {
      // Use requestAnimationFrame to defer the fetch to next tick
      requestAnimationFrame(() => {
        fetchPosts(page)
      })
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

  useEffect(() => {
    // User loaded effect
  }, [user])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return
    router.push(`/?page=${newPage}`)
  }

  const handleCommentCountChange = (postId: string, newCount: number) => {
    setPosts((prevPosts: Post[]) => 
      prevPosts.map((post: Post) => 
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
                // Optimized refresh with minimal delay
                try {
                  const params = new URLSearchParams({
                    page: '1',
                    limit: pagination?.limit?.toString() || '10'
                  })
                  
                  const controller = new AbortController()
                  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout for refresh
                  
                  const response = await fetch(`/api/posts?${params.toString()}`, {
                    signal: controller.signal,
                    cache: 'no-store',
                    headers: {
                      'Cache-Control': 'no-cache',
                      'Accept': 'application/json',
                    }
                  })
                  
                  clearTimeout(timeoutId)
                  
                  if (response.ok) {
                    const data = await response.json()
                    // Update state immediately
                    setPosts(data.posts || [])
                    setPagination(data.pagination || pagination)
                    
                    // Reduced scroll delay for faster UX
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 50)
                    
                    // Show success feedback
                    toast.success("Post created successfully!")
                  } else {
                    throw new Error('Failed to refresh posts')
                  }
                } catch (error) {
                  console.error('Failed to refresh posts:', error)
                  // Fallback to full refresh if silent update fails
                  toast.info("Post created! Refreshing...")
                  await fetchPosts(1)
                }
              }} />
            </div>

            {isLoading ? (
              <div className="space-y-3 sm:space-y-4 animate-fade-in">
                {[...Array(2)].map((_, i) => (
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
            ) : (
              <>
            <div className="space-y-3 sm:space-y-4 overflow-visible">
                  {posts.map((post: Post) => (
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
                  ))}
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
                        className="px-2 sm:px-3 text-xs sm:text-sm"
                      >
                        Previous
                      </Button>
                      
                      {getPaginationRange().map((page, index) => (
                        <div key={index}>
                          {typeof page === "string" ? (
                            <span className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm text-gray-500">
                              {page}
                            </span>
                          ) : (
                            <Button
                              variant={page === pagination.currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="px-2 sm:px-3 text-xs sm:text-sm min-w-[32px] sm:min-w-[36px]"
                            >
                              {page}
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.pages}
                        className="px-2 sm:px-3 text-xs sm:text-sm"
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
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