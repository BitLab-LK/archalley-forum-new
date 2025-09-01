"use client"

import { useEffect, useState, Suspense } from "react"
import PostCreator from "@/components/post-creator"
import PostCard from "@/components/post-card"
import Sidebar from "@/components/sidebar"
import { useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
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

// Separate component that uses useSearchParams
function HomePageContent() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { confirm } = useConfirmDialog()
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 overflow-visible">
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

                {/* No posts message */}
                {posts.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No posts yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Be the first to create a post in this community!
                      </p>
                    </div>
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
      
      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideInUp {
          animation: slideInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
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
      
      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideInUp {
          animation: slideInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
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
