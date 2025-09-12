"use client"

import { useEffect, useState, Suspense } from "react"
import PostCreator from "@/components/post-creator"
import PostCard from "@/components/post-card"
import Sidebar from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
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

// Separate component that uses useSearchParams
function HomePageContent() {
  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    pages: 1,
    currentPage: 1,
    limit: 10,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true) // Track if this is first load
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
      
      const response = await fetch(`/api/posts?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }
      
      const data = await response.json()
      
      setPosts(data.posts)
      setPagination(data.pagination)
    } catch (error) {
      toast.error("Failed to load posts")
    } finally {
      setIsLoading(false)
      setIsInitialLoad(false) // Mark initial load as complete
    }
  }

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1")
    const highlight = searchParams.get("highlight")
    
    if (highlight) {
      setHighlightedPostId(highlight)
      // Clear highlight after 5 seconds
      setTimeout(() => setHighlightedPostId(null), 5000)
    }
    
    fetchPosts(page)
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
                // Immediate refresh with no delay for instant feedback
                try {
                  // Force immediate refresh to get the latest posts including the new one
                  const params = new URLSearchParams({
                    page: '1',
                    limit: pagination?.limit?.toString() || '10'
                  })
                  
                  const response = await fetch(`/api/posts?${params.toString()}`, {
                    cache: 'no-store',
                    headers: {
                      'Cache-Control': 'no-cache',
                    }
                  })
                  
                  if (response.ok) {
                    const data = await response.json()
                    // Update state immediately
                    setPosts(data.posts)
                    setPagination(data.pagination)
                    
                    // Scroll to top to show the new post
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 100)
                    
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
              <div className="space-y-3 sm:space-y-4 animate-fade-in animate-delay-200">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow hover-lift animate-shimmer animate-delay-${(i + 1) * 100}`}>
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
                  {posts.map((post: Post, index: number) => (
                    <div 
                      key={post.id}
                      id={`post-${post.id}`}
                      className={`hover-lift smooth-transition ${isInitialLoad ? 'animate-slide-in-up' : ''} ${
                        highlightedPostId === post.id ? 'ring-2 ring-primary ring-offset-2 bg-primary/5 transition-all duration-300' : ''
                      }`}
                      style={isInitialLoad ? { animationDelay: `${index * 100}ms` } : {}}
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
              </>
            )}
          </div>

          {/* Sidebar - Hidden on mobile, shown as overlay or separate tab */}
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

// Loading fallback component
function HomePageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in-up">
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2 animate-slide-in-up animate-stagger-1">
            <div className="space-y-3 sm:space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow animate-shimmer animate-stagger-${i + 1} hover-lift smooth-transition`}>
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

// Main page component with Suspense boundary
export default function HomePage() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageContent />
    </Suspense>
  )
}
