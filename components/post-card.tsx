"use client"

import { useState, useCallback, useMemo, memo, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Flag, Pin, CheckCircle, Trash2, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGlobalVoteState } from "@/lib/vote-sync"
import { activityEventManager } from "@/lib/activity-events"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"
import PostModal from "./post-modal"

interface PostCardProps {
  post: {
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
      userVote?: "up" | "down"
    }
  }
  onDelete?: () => void
  onCommentCountChange?: (postId: string, newCount: number) => void
  onVoteChange?: (postId: string, newUpvotes: number, newDownvotes: number, newUserVote: "up" | "down" | null) => void
  onTopCommentVoteChange?: (postId: string, topComment: { id: string, author: string, content: string, upvotes: number, downvotes: number, isBestAnswer: boolean, userVote?: "up" | "down" } | null) => void
}

// Constants
const TEXT_SIZE_CONFIG = [
  { max: 50, class: "text-3xl" },
  { max: 100, class: "text-2xl" },
  { max: 200, class: "text-xl" },
  { max: 300, class: "text-lg" },
] as const

const CATEGORY_COLORS = {
  business: "bg-blue-500",
  design: "bg-purple-500",
  career: "bg-green-500",
  construction: "bg-yellow-500",
  academic: "bg-indigo-500",
  informative: "bg-cyan-500",
  other: "bg-gray-500",
} as const

// Utility functions
const getTextSizeClass = (content: string): string => {
  const length = content.length
  return TEXT_SIZE_CONFIG.find(config => length <= config.max)?.class ?? "text-base"
}

const getCategoryColorClass = (category: string): string => {
  return CATEGORY_COLORS[category.toLowerCase() as keyof typeof CATEGORY_COLORS] ?? "bg-gray-500"
}

const shouldUseColoredBackground = (content: string, hasImages: boolean): boolean => {
  return !hasImages && content.length <= 300
}

const PostCard = memo(function PostCard({ post, onDelete, onCommentCountChange, onVoteChange, onTopCommentVoteChange }: PostCardProps) {
  const { user, isLoading } = useAuth()
  
  // Memoized computed values
  const isAuthor = useMemo(() => user?.id === post.author.id, [user?.id, post.author.id])
  const isAdmin = useMemo(() => user?.role === "ADMIN", [user?.role])
  const canDelete = useMemo(() => isAuthor || isAdmin, [isAuthor, isAdmin])
  
  // Use global vote state for real-time synchronization between post and modal
  const { voteState, updateVote } = useGlobalVoteState(post.id, {
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    userVote: post.userVote || null
  })
  
  // Extract values for easier use
  const { upvotes, downvotes, userVote } = voteState
  const [isVoting, setIsVoting] = useState(false)
  
  // Local state for top comment with real-time updates
  const [topComment, setTopComment] = useState(post.topComment)
  
  // For now, use the original comment count from props
  const commentCount = post.comments
  const syncCommentCount = useCallback(() => {
    // Comment count syncing functionality can be added here if needed
  }, [])
  
  // Handle top comment vote changes from modal
  const handleTopCommentVoteChange = useCallback((postId: string, newTopComment: { id: string, author: string, content: string, upvotes: number, downvotes: number, isBestAnswer: boolean } | null) => {
    if (postId === post.id) {
      if (newTopComment === null) {
        // No top comment anymore
        setTopComment(undefined)
      } else {
        // Update with new top comment data
        setTopComment(newTopComment)
      }
      
      // Also forward to parent component if provided
      onTopCommentVoteChange?.(postId, newTopComment)
    }
  }, [post.id, topComment, onTopCommentVoteChange])
  
  // Notify parent when vote changes
  const prevVoteState = useRef({ upvotes, downvotes, userVote })
  
  useEffect(() => {
    if (onVoteChange && 
        (prevVoteState.current.upvotes !== upvotes || 
         prevVoteState.current.downvotes !== downvotes || 
         prevVoteState.current.userVote !== userVote)) {
      onVoteChange(post.id, upvotes, downvotes, userVote)
      prevVoteState.current = { upvotes, downvotes, userVote }
    }
  }, [upvotes, downvotes, userVote, post.id, onVoteChange])
  
  // Local state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  // Use refs to track previous values for parent notifications - initialize with current hook values
  const prevCommentCount = useRef(commentCount)
  const lastClickTime = useRef(0) // Track last click time for debouncing

  // Notify parent component when comment count changes - immediate sync for smooth UX
  useEffect(() => {
    if (onCommentCountChange && commentCount !== prevCommentCount.current) {
      // Immediate notification without delay
      onCommentCountChange(post.id, commentCount)
      prevCommentCount.current = commentCount
    }
  }, [commentCount, post.id, onCommentCountChange])

  // Everything syncs instantly now - votes AND comments!

  // Memoized callbacks
  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    
    if (onDelete) {
      onDelete()
      return
    }
    
    if (!confirm("Are you sure you want to delete this post?")) {
      setIsDeleting(false)
      return
    }
    
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        setIsDeleting(false)
        throw new Error(errorData.error || "Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      setIsDeleting(false)
    }
  }, [onDelete, post.id])

  const handleCommentAdded = useCallback(() => {
    const newCount = commentCount + 1
    syncCommentCount()
    onCommentCountChange?.(post.id, newCount)
  }, [commentCount, syncCommentCount, onCommentCountChange, post.id])

  const handleCommentCountUpdate = useCallback((newCount: number) => {
    syncCommentCount()
    onCommentCountChange?.(post.id, newCount)
  }, [syncCommentCount, onCommentCountChange, post.id])

  const openModal = useCallback((imgIdx: number = 0) => {
    setModalImageIndex(imgIdx)
    setModalOpen(true)
  }, [])

  // Simple, direct vote handler that actually works
  const handleVote = useCallback(async (type: "up" | "down") => {
    if (!user) {
      alert("Please log in to vote on posts")
      return
    }
    
    if (isVoting) {
      return // Prevent double clicks
    }
    
    setIsVoting(true)

// Calculate optimistic update
    let newUpvotes = upvotes
    let newDownvotes = downvotes
    let newUserVote: "up" | "down" | null = userVote
    
    if (userVote === type) {
      // Remove vote
      newUserVote = null
      if (type === "up") {
        newUpvotes = Math.max(0, upvotes - 1)
      } else {
        newDownvotes = Math.max(0, downvotes - 1)
      }
    } else if (userVote) {
      // Change vote
      if (type === "up") {
        newUpvotes = upvotes + 1
        newDownvotes = Math.max(0, downvotes - 1)
      } else {
        newUpvotes = Math.max(0, upvotes - 1)
        newDownvotes = downvotes + 1
      }
      newUserVote = type
    } else {
      // New vote
      newUserVote = type
      if (type === "up") {
        newUpvotes = upvotes + 1
      } else {
        newDownvotes = downvotes + 1
      }
    }
    
    // Update UI immediately using global state manager
    updateVote({
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: newUserVote
    })
    
    try {
      // Send to server
      const response = await fetch(`/api/posts/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type.toUpperCase() }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Vote failed: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      
      // Update with server response using global state
      updateVote({
        upvotes: result.upvotes,
        downvotes: result.downvotes,
        userVote: result.userVote
      })
      
      // Emit activity event for real-time feed updates
      if (user?.id) {
        activityEventManager.emitVote(user.id, post.id)
      }
      
    } catch (error: unknown) {
      console.error('Vote failed:', error)
      
      // Type-safe error handling
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Check if it's a network error
      if (error instanceof TypeError && errorMessage === 'Failed to fetch') {
        alert('Network error: Unable to connect to server. Please check if the development server is running.')
      } else {
        alert(`Failed to vote: ${errorMessage || 'Unknown error'}`)
      }
      
      // Rollback on error using global state
      updateVote({
        upvotes: upvotes,
        downvotes: downvotes,
        userVote: userVote
      })
    } finally {
      setIsVoting(false)
    }
  }, [user, isVoting, post.id, userVote, upvotes, downvotes])

  // Enhanced vote handler that syncs with modals and provides instant feedback
  const handleCardVote = useCallback(async (type: "up" | "down") => {
    // Prevent rapid clicking - debounce button clicks using ref
    const now = Date.now()
    if (lastClickTime.current && now - lastClickTime.current < 500) {
      return
    }
    lastClickTime.current = now
    
    try {
      await handleVote(type)
    } catch (error) {
      console.error('Vote failed:', error)
    }
  }, [handleVote, post.id, userVote])
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></span>
        Loading...
      </div>
    )
  }

  // Memoized image renderer for better performance
  const renderImages = useCallback((images: string[]) => {
    const count = images.length
    
    if (count === 1) {
      return (
        <div className="w-full flex justify-center items-center cursor-pointer" onClick={() => openModal(0)}>
          <div className="relative w-full h-[400px]">
            <Image
              src={images[0]}
              alt="Post image"
              className="object-contain rounded-lg"
              fill
              sizes="100vw"
              priority
              onError={(e) => {
                console.error('❌ Image failed to load:', images[0], e)
              }}
            />
          </div>
        </div>
      )
    }
    
    if (count === 2) {
      return (
        <div className="flex gap-2 mt-2">
          {images.map((img, i) => (
            <div 
              key={i} 
              className="relative w-1/2 aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden cursor-pointer max-h-[350px]" 
              onClick={() => openModal(i)}
            >
              <Image
                src={img}
                alt={`Post image ${i + 1}`}
                className="object-cover w-full h-full"
                fill
                sizes="50vw"
              />
            </div>
          ))}
        </div>
      )
    }
    
    if (count === 3) {
      return (
        <div className="grid grid-cols-3 gap-2 mt-2 h-[350px]">
          <div className="relative col-span-2 row-span-2 h-full rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => openModal(0)}>
            <Image src={images[0]} alt="Post image 1" className="object-cover w-full h-full" fill sizes="66vw" />
          </div>
          <div className="flex flex-col gap-2 h-full">
            {[1, 2].map(i => (
              <div key={i} className="relative flex-1 rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => openModal(i)}>
                <Image src={images[i]} alt={`Post image ${i + 1}`} className="object-cover w-full h-full" fill sizes="33vw" />
              </div>
            ))}
          </div>
        </div>
      )
    }
    
    if (count === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-2 mt-2 h-[350px]">
          {images.map((img, i) => (
            <div key={i} className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => openModal(i)}>
              <Image src={img} alt={`Post image ${i + 1}`} className="object-cover w-full h-full" fill sizes="50vw" />
            </div>
          ))}
        </div>
      )
    }
    
    // More than 4 images
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-2 mt-2 h-[350px]">
        {images.slice(0, 3).map((img, i) => (
          <div key={i} className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => openModal(i)}>
            <Image src={img} alt={`Post image ${i + 1}`} className="object-cover w-full h-full" fill sizes="50vw" />
          </div>
        ))}
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => openModal(3)}>
          <Image src={images[3]} alt="Post image 4" className="object-cover w-full h-full" fill sizes="50vw" />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">+{count - 4}</span>
          </div>
        </div>
      </div>
    )
  }, [openModal])

  return (
    <>
      <div className={cn(
        "transition-all duration-700 ease-in-out overflow-hidden",
        isDeleting 
          ? "max-h-0 opacity-0 -mb-4 transform scale-95" 
          : "max-h-[2000px] opacity-100 mb-4 transform scale-100"
      )}>
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.isAnonymous ? "/placeholder.svg" : post.author.avatar} />
                <AvatarFallback>{post.isAnonymous ? "A" : post.author.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{post.isAnonymous ? "Anonymous" : post.author.name}</span>
                  {!post.isAnonymous && post.author.isVerified && (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  )}
                  {post.isPinned && <Pin className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {!post.isAnonymous && (
                    <Badge variant="secondary" className="text-xs">
                      {post.author.rank}
                    </Badge>
                  )}
                  <span>{post.timeAgo}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge className={cn("text-xs", `category-${post.category.toLowerCase()}`)}>
                {post.category}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isAdmin && !isAuthor ? "Delete Post (Admin)" : "Delete Post"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Flag className="w-4 h-4 mr-2" />
                    Report Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            {shouldUseColoredBackground(post.content, !!post.images?.length) ? (
              <div
                className={cn(
                  "rounded-lg p-6 text-white text-center font-semibold leading-relaxed",
                  getCategoryColorClass(post.category),
                  getTextSizeClass(post.content),
                )}
                dir="auto"
              >
                {post.content}
              </div>
            ) : (
              <>
                <p 
                  className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-base leading-relaxed mb-4"
                  dir="auto"
                >
                  {post.content}
                </p>

                {/* Image Grid */}
                {Array.isArray(post.images) && post.images.length > 0 && renderImages(post.images)}
              </>
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCardVote("up")}
                  className={cn(
                    "text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-3 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95",
                    userVote === "up" && "text-primary",
                    isVoting && "opacity-70 cursor-not-allowed"
                  )}
                  disabled={isVoting}
                >
                  <ThumbsUp className={cn("w-4 h-4 mr-1 transition-transform duration-200", userVote === "up" && "scale-110")} />
                  <span className="transition-all duration-200">{upvotes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCardVote("down")}
                  className={cn(
                    "text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded-full px-3 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95",
                    userVote === "down" && "text-red-500",
                    isVoting && "opacity-70 cursor-not-allowed"
                  )}
                  disabled={isVoting}
                >
                  <ThumbsDown className={cn("w-4 h-4 mr-1 transition-transform duration-200", userVote === "down" && "scale-110")} />
                  <span className="transition-all duration-200">{downvotes}</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal(0)}
                className="text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-3"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {commentCount} Comments
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-3"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* Top Comment */}
          {topComment && (
            <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-orange-500 text-white text-xs">
                    {topComment.author.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {topComment.author}
                    </span>
                    {topComment.isBestAnswer && (
                      <Badge variant="default" className="text-xs bg-green-500">
                        Best Answer
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                    {topComment.content}
                  </p>
                  
                  {/* Comment Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button className={cn(
                        "text-xs font-medium transition-colors",
                        topComment.userVote === "up" 
                          ? "text-orange-600 hover:text-orange-500" 
                          : "text-gray-500 hover:text-orange-500"
                      )}>
                        {topComment.userVote === "up" ? "Unlike" : "Like"}
                      </button>
                      <button className={cn(
                        "text-xs font-medium transition-colors",
                        topComment.userVote === "down" 
                          ? "text-red-600 hover:text-red-500" 
                          : "text-gray-500 hover:text-gray-700"
                      )}>
                        {topComment.userVote === "down" ? "Remove Dislike" : "Dislike"}
                      </button>
                      <button className="text-xs text-gray-500 hover:text-blue-500 font-medium transition-colors">
                        Reply
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      {topComment.upvotes > 0 && (
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">👍</div>
                          <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">{topComment.upvotes}</span>
                        </div>
                      )}
                      {topComment.downvotes > 0 && (
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs">👎</div>
                          <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">{topComment.downvotes}</span>
                        </div>
                      )}
                      <span>2d</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
      
      {/* Facebook-style Post Popup Modal */}
      <PostModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        post={{
          ...post,
          upvotes: upvotes,        // Current global state, not original props
          downvotes: downvotes,    // Current global state, not original props  
          userVote: userVote,      // Current global state, not original props
          comments: commentCount,
          topComment: topComment   // Use local state for top comment
        }} 
        initialImage={modalImageIndex} 
        onCommentAdded={handleCommentAdded}
        onCommentCountUpdate={handleCommentCountUpdate}
        onVoteChange={onVoteChange}
        onTopCommentVoteChange={handleTopCommentVoteChange}
      />
    </>
  )
})

export default PostCard

