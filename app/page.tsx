"use client"

import { useEffect, useState, Suspense } from "react"
import PostCreator from "@/components/post-creator"
import PostCard from "@/components/post-card"
import Sidebar from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { refreshAll } = useSidebar() // For refreshing sidebar on post deletion

  const fetchPosts = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts?page=${page}&limit=10`)
      
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
    }
  }

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1")
    fetchPosts(page)
  }, [searchParams])

  useEffect(() => {
    // User loaded effect
  }, [user])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return
    router.push(`/?page=${newPage}`)
  }

  const handleDeletePost = async (postId: string) => {
    try {
      // Start optimistic update - remove post immediately for smooth UX
      const originalPosts = posts
      setPosts(posts.filter(post => post.id !== postId))
      
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include", // Ensure cookies/session are sent
        headers: {
          "Content-Type": "application/json",
        },
      })

      const responseBody = await response.text()

      if (!response.ok) {
        // Restore posts if deletion failed
        setPosts(originalPosts)
        
        let errorData
        try {
          errorData = JSON.parse(responseBody)
        } catch (e) {
          // Could not parse response as JSON
        }
        throw new Error(`Failed to delete post: ${response.status} - ${errorData?.error || responseBody}`)
      }

      toast.success("Post deleted successfully")
      
      // Refresh sidebar data in real-time after successful deletion
      refreshAll()
      
    } catch (error) {
      toast.error("Failed to delete post")
    }
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

  const handleVoteChange = (postId: string, newUpvotes: number, newDownvotes: number, newUserVote: "up" | "down" | null) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote }
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
          <div className="lg:col-span-2">
            <PostCreator onPostCreated={async () => {
              try {
                await fetchPosts(1) // Always go to first page for new posts
              } catch (error) {
                // Error handling for post refresh
              }
            }} />

            {isLoading ? (
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
            ) : (
              <>
            <div className="space-y-3 sm:space-y-4">
                  {posts.map((post: Post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onDelete={
                        user && (user.id === post.author.id || user.role === "ADMIN")
                          ? () => {
                              // Create a delete function that includes animation trigger
                              if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
                                return
                              }
                              handleDeletePost(post.id)
                            }
                          : undefined
                      }
                      onCommentCountChange={handleCommentCountChange}
                      onVoteChange={handleVoteChange}
                    />
              ))}
            </div>

            {/* Pagination - Mobile Optimized */}
                {pagination.pages > 1 && (
            <div className="flex justify-center mt-6 sm:mt-8 px-2">
                    <nav className="flex items-center space-x-1 sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="text-xs sm:text-sm px-2 sm:px-3"
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
                            className="text-xs sm:text-sm min-w-[32px] sm:min-w-[40px] px-2 sm:px-3"
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
                        className="text-xs sm:text-sm px-2 sm:px-3"
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
          <div className="hidden lg:block lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </main>
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
