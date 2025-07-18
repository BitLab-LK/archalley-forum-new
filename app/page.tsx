"use client"

import { useEffect, useState, Suspense } from "react"
import PostCreator from "@/components/post-creator"
import PostCard from "@/components/post-card"
import Sidebar from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
// import { toast } from "sonner"

// Temporary workaround - use console instead
const toast = {
  success: (message: string) => console.log("✅ SUCCESS:", message),
  error: (message: string) => console.error("❌ ERROR:", message),
}

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
  comments: number
  timeAgo: string
  images?: string[]
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

  const fetchPosts = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts?page=${page}&limit=10`)
      if (!response.ok) throw new Error("Failed to fetch posts")
      
      const data = await response.json()
      setPosts(data.posts)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1")
    fetchPosts(page)
  }, [searchParams])

  useEffect(() => {
    if (user) {
      console.log("Current user loaded:", {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      })
    }
  }, [user])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return
    router.push(`/?page=${newPage}`)
  }

  const handleDeletePost = async (postId: string) => {
    try {
      console.log("=== FRONTEND DELETE REQUEST ===")
      console.log("Current user:", {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        name: user?.name
      })
      console.log("Deleting post ID:", postId)
      
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

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)
      
      const responseBody = await response.text()
      console.log("Response body:", responseBody)

      if (!response.ok) {
        // Restore posts if deletion failed
        setPosts(originalPosts)
        
        let errorData
        try {
          errorData = JSON.parse(responseBody)
          console.log("Parsed error data:", errorData)
        } catch (e) {
          console.log("Could not parse response as JSON")
        }
        throw new Error(`Failed to delete post: ${response.status} - ${errorData?.error || responseBody}`)
      }

      toast.success("Post deleted successfully")
    } catch (error) {
      console.error("Error deleting post:", error)
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <PostCreator onPostCreated={() => fetchPosts(pagination.currentPage)} />

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <div className="flex items-center space-x-4 mb-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                    </div>
                    <Skeleton className="h-24 w-full mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-[100px]" />
                      <Skeleton className="h-8 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
            <div className="space-y-4">
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
                    />
              ))}
            </div>

            {/* Pagination */}
                {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
                    <nav className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                      >
                  Previous
                      </Button>
                      
                      {getPaginationRange().map((page, i) => (
                        page === "..." ? (
                          <span key={`ellipsis-${i}`} className="px-2">...</span>
                        ) : (
                          <Button
                            key={page}
                            variant={pagination.currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page as number)}
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
          <div className="lg:col-span-1">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <div className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-8 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
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
