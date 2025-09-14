"use client"

import { useState, useCallback, useMemo, memo, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, MessageCircle, Flag, CheckCircle, Trash2, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGlobalVoteState } from "@/lib/vote-sync"
import { activityEventManager } from "@/lib/activity-events"
import { getCategoryBackground } from "@/lib/category-colors"
import { useSocket } from "@/lib/socket-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import PostImage from "@/components/post-image"
import PostModal from "./post-modal"
import { PostBadges } from "./post-badges"
import ShareDropdown from "./share-dropdown"

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
      badges?: Array<{
        id: string
        badges: {
          id: string
          name: string
          description: string
          icon: string
          color: string
          level: string
          type: string
        }
        earnedAt: Date
      }>
    }
    content: string
    category: string  // Primary category (for backward compatibility)
    categories?: {    // Single category object (primary category)
      id: string
      name: string
      color: string
      slug: string
    }
    allCategories?: Array<{  // Multiple categories from new structure
      id: string
      name: string
      color: string
      slug: string
    }>
    aiCategories?: string[]  // AI-suggested categories as strings
    isAnonymous: boolean
    isPinned: boolean
    upvotes: number
    downvotes: number
    userVote?: "up" | "down" | null
    comments: number
    timeAgo: string
    images?: string[]
    isOptimistic?: boolean // Flag for optimistic posts
    topComment?: {
      author: {
        name: string
        image?: string
      }
      content: string
      upvotes: number
      downvotes: number
      isBestAnswer: boolean
      userVote?: "up" | "down"
    }
  }
  onDelete?: () => void | Promise<void>
  onCommentCountChange?: (postId: string, newCount: number) => void
  onTopCommentVoteChange?: (postId: string, topComment: { id: string, author: { name: string, image?: string }, content: string, upvotes: number, downvotes: number, isBestAnswer: boolean, userVote?: "up" | "down" } | null) => void
}

// Constants
const TEXT_SIZE_CONFIG = [
  { max: 50, class: "text-3xl" },
  { max: 100, class: "text-2xl" },
  { max: 200, class: "text-xl" },
  { max: 300, class: "text-lg" },
] as const

// Utility functions
const getTextSizeClass = (content: string): string => {
  const length = content.length
  return TEXT_SIZE_CONFIG.find(config => length <= config.max)?.class ?? "text-base"
}

const PostCard = memo(function PostCard({ post, onDelete, onCommentCountChange, onTopCommentVoteChange }: PostCardProps) {
  const { user } = useAuth()
  const { confirm } = useConfirmDialog()
  const { toast } = useToast()
  
  // Memoized computed values
  const isAuthor = useMemo(() => user?.id === post.author.id, [user?.id, post.author.id])
  const cardBackgroundClasses = useMemo(() => {
    // Card always has white/dark background
    return "shadow-sm border-0 overflow-visible bg-white dark:bg-gray-800"
  }, [])
  const contentBackgroundClasses = useMemo(() => {
    // Use light category-based background only for text posts content (posts without images)
    const hasImages = post.images && post.images.length > 0
    if (hasImages) {
      return ""
    }
    return getCategoryBackground(post.category.toLowerCase())
  }, [post.category, post.images])
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
  const handleTopCommentVoteChange = useCallback((postId: string, newTopComment: { id: string, author: { name: string, image?: string }, content: string, upvotes: number, downvotes: number, isBestAnswer: boolean } | null) => {
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
  
  // Local state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  // Use refs to track previous values for parent notifications - initialize with current hook values
  const prevCommentCount = useRef(commentCount)

  // Socket.IO for real-time updates
  const { socket, joinPost, leavePost } = useSocket()
  
  // Join post room on mount, leave on unmount
  useEffect(() => {
    if (socket) {
      joinPost(post.id)
      
      // Listen for real-time vote updates
      const handleVoteUpdate = (data: { upvotes: number; downvotes: number; userVote: string | null }) => {
        updateVote({
          upvotes: data.upvotes,
          downvotes: data.downvotes,
          userVote: data.userVote as "up" | "down" | null
        })
      }
      
      // Listen for new comments
      const handleNewComment = (commentData: any) => {
        // Update comment count or handle as needed
        // Could trigger a refetch or update local state
        console.log('New comment received:', commentData)
      }
      
      socket.on('vote-update', handleVoteUpdate)
      socket.on('new-comment', handleNewComment)
      
      return () => {
        socket.off('vote-update', handleVoteUpdate)
        socket.off('new-comment', handleNewComment)
        leavePost(post.id)
      }
    }
    
    return () => {
      // Cleanup function when socket is not available
    }
  }, [socket, post.id, joinPost, leavePost, updateVote])

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
    // Always show confirmation dialog first
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
    
    // Only set deleting state AFTER confirmation
    setIsDeleting(true)
    
    // If onDelete prop exists, use it
    if (onDelete) {
      await onDelete()
      setIsDeleting(false)
      return
    }
    
    // Otherwise, handle deletion ourselves
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
      
      // Show success message
      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
      
      // Refresh the page to update the post list
      window.location.reload()
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
      setIsDeleting(false)
    }
  }, [onDelete, post.id, confirm, toast])

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
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on posts",
        variant: "destructive"
      })
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
      
      // Emit socket event for real-time updates to other users
      if (socket) {
        socket.emit('vote', {
          postId: post.id,
          type: type.toUpperCase()
        })
      }
      
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
        toast({
          title: "Network Error",
          description: "Unable to connect to server. Please check if the development server is running.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Vote Failed",
          description: errorMessage || 'Unknown error',
          variant: "destructive"
        })
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
  }, [user, isVoting, post.id, userVote, upvotes, downvotes, socket, updateVote])

  // Enhanced vote handler that syncs with modals and provides instant feedback
  const handleCardVote = useCallback(async (type: "up" | "down") => {
    try {
      await handleVote(type)
    } catch (error) {
      console.error('Vote failed:', error)
    }
  }, [handleVote])

  // Memoized image renderer for better performance
  const renderImages = useCallback((images: string[]) => {
    const count = images.length
    
    // Helper function to render a single image with error handling
    const renderSingleImage = (src: string, alt: string, className: string, sizes: string, index: number) => {
      return (
        <>
          <PostImage
            src={src}
            alt={alt}
            className={className}
            fill
            sizes={sizes}
            priority={index === 0}
            onClick={() => openModal(index)}
            enableDownload={true}
          />
        </>
      )
    }
    
    if (count === 1) {
      return (
        <div className="w-full flex justify-center items-center">
          <div className="relative w-full h-[400px]">
            {renderSingleImage(images[0], "Post image", "object-contain rounded-lg", "100vw", 0)}
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
              className="relative w-1/2 aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden max-h-[350px]" 
            >
              {renderSingleImage(img, `Post image ${i + 1}`, "object-cover w-full h-full", "50vw", i)}
            </div>
          ))}
        </div>
      )
    }
    
    if (count === 3) {
      return (
        <div className="grid grid-cols-3 gap-2 mt-2 h-[350px]">
          <div className="relative col-span-2 row-span-2 h-full rounded-lg overflow-hidden bg-gray-100">
            {renderSingleImage(images[0], "Post image 1", "object-cover w-full h-full", "66vw", 0)}
          </div>
          <div className="flex flex-col gap-2 h-full">
            {[1, 2].map(i => (
              <div key={i} className="relative flex-1 rounded-lg overflow-hidden bg-gray-100">
                {renderSingleImage(images[i], `Post image ${i + 1}`, "object-cover w-full h-full", "33vw", i)}
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
            <div key={i} className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
              {renderSingleImage(img, `Post image ${i + 1}`, "object-cover w-full h-full", "50vw", i)}
            </div>
          ))}
        </div>
      )
    }
    
    // More than 4 images
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-2 mt-2 h-[350px]">
        {images.slice(0, 3).map((img, i) => (
          <div key={i} className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
            {renderSingleImage(img, `Post image ${i + 1}`, "object-cover w-full h-full", "50vw", i)}
          </div>
        ))}
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
          {renderSingleImage(images[3], "Post image 4", "object-cover w-full h-full", "50vw", 3)}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
            <span className="text-white text-2xl font-bold">+{count - 4}</span>
          </div>
        </div>
      </div>
    )
  }, [openModal])

  return (
    <>
      <div className={cn(
        "transition-all duration-700 ease-in-out",
        isDeleting 
          ? "max-h-0 opacity-0 -mb-4 transform scale-95 overflow-hidden" 
          : "max-h-[2000px] opacity-100 mb-4 transform scale-100 overflow-visible"
      )}>
        <Card className={cardBackgroundClasses}>
            <CardContent className="p-4 overflow-visible">
            {/* Post Header */}
            <div className="mb-4">
              {/* Mobile: Stacked layout, Desktop: Side by side */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                {/* User Info Section */}
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarImage src={post.isAnonymous ? "/placeholder.svg" : post.author.avatar} />
                    <AvatarFallback>{post.isAnonymous ? "A" : post.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    {/* Name and verification badges */}
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span className="font-semibold text-sm sm:text-base truncate">
                        {post.isAnonymous ? "Anonymous" : post.author.name}
                      </span>
                      {!post.isAnonymous && post.author.isVerified && (
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  
                  {/* Badges and time - responsive layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    {/* User badges */}
                    {!post.isAnonymous && post.author.badges && post.author.badges.length > 0 && (
                      <div className="flex-shrink-0">
                        <PostBadges 
                          badges={post.author.badges.map(b => b.badges)} 
                          maxDisplay={2} 
                          size="xs"
                        />
                      </div>
                    )}
                    {/* Time */}
                    <span className="text-xs sm:text-sm text-gray-500">
                      {post.timeAgo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Badges - show multiple categories */}
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                {post.allCategories && post.allCategories.length > 0 ? (
                  // Show all categories from allCategories array
                  post.allCategories.map((category: any) => (
                    <Badge 
                      key={category.id}
                      className={cn(
                        "text-xs px-2 py-0.5 sm:px-2.5 sm:py-1", 
                        `category-${category.name.toLowerCase()}`
                      )}
                    >
                      {category.name}
                    </Badge>
                  ))
                ) : post.categories ? (
                  // Fallback to single primary category
                  <Badge 
                    key={post.categories.id}
                    className={cn(
                      "text-xs px-2 py-0.5 sm:px-2.5 sm:py-1", 
                      `category-${post.categories.name.toLowerCase()}`
                    )}
                  >
                    {post.categories.name}
                  </Badge>
                ) : (
                  // Final fallback to category string
                  <Badge className={cn(
                    "text-xs px-2 py-0.5 sm:px-2.5 sm:py-1", 
                    `category-${post.category.toLowerCase()}`
                  )}>
                    {post.category}
                  </Badge>
                )}
                
                {/* AI-suggested categories as additional badges - only show if not already in allCategories */}
                {post.aiCategories && post.aiCategories.length > 0 && post.allCategories && (
                  post.aiCategories
                    .filter(categoryName => {
                      // Only show AI category if it's not already in allCategories
                      return !post.allCategories?.some(cat => 
                        cat.name.toLowerCase() === categoryName.toLowerCase()
                      )
                    })
                    .map((categoryName, index) => (
                      <Badge 
                        key={`ai-${index}`}
                        className={cn(
                          "text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 border-dashed opacity-80", 
                          `category-${categoryName.toLowerCase()}`
                        )}
                        title="AI-suggested category"
                      >
                        {categoryName}
                      </Badge>
                    ))
                )}
                
                {/* Options Menu */}
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
                        onClick={async () => {
                          if (!isDeleting) {
                            await handleDelete()
                          }
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isDeleting ? "Deleting..." : (isAdmin && !isAuthor ? "Delete Post (Admin)" : "Delete Post")}
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
          </div>

          {/* Post Content */}
          <div className={cn("mb-4 p-4 rounded-lg", contentBackgroundClasses)}>
            <p 
              className={cn(
                "text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed mb-4",
                // For short text posts without images, use larger text and center alignment
                !post.images?.length && post.content.length <= 300 
                  ? `text-center font-semibold ${getTextSizeClass(post.content)}` 
                  : "text-base"
              )}
              dir="auto"
            >
              {post.content}
            </p>

            {/* Image Grid */}
            {Array.isArray(post.images) && post.images.length > 0 && renderImages(post.images)}
          </div>

          {/* Post Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t space-y-2 sm:space-y-0">
            {/* Mobile: Stacked layout, Desktop: Horizontal layout */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-hide">
              {/* Vote buttons group */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCardVote("up")}
                  className={cn(
                    "text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-2 sm:px-3 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95",
                    userVote === "up" && "text-primary",
                    isVoting && "opacity-70 cursor-not-allowed"
                  )}
                  disabled={isVoting}
                >
                  <ThumbsUp className={cn("w-3 h-3 sm:w-4 sm:h-4 mr-1 transition-transform duration-200", userVote === "up" && "scale-110")} />
                  <span className="transition-all duration-200 text-xs sm:text-sm">{upvotes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCardVote("down")}
                  className={cn(
                    "text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded-full px-2 sm:px-3 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95",
                    userVote === "down" && "text-red-500",
                    isVoting && "opacity-70 cursor-not-allowed"
                  )}
                  disabled={isVoting}
                >
                  <ThumbsDown className={cn("w-3 h-3 sm:w-4 sm:h-4 mr-1 transition-transform duration-200", userVote === "down" && "scale-110")} />
                  <span className="transition-all duration-200 text-xs sm:text-sm">{downvotes}</span>
                </Button>
              </div>

              {/* Comments button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal(0)}
                className="text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-2 sm:px-3 flex-shrink-0"
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="text-xs sm:text-sm">Comment{commentCount > 0 ? ` ${commentCount}` : ''}</span>
              </Button>

              {/* Share button */}
              <ShareDropdown 
                post={post}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-2 sm:px-3 flex-shrink-0"
              />
            </div>
          </div>

          {/* Top Comment */}
          {topComment && (
            <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={topComment.author?.image || "/placeholder-user.jpg"} />
                  <AvatarFallback className="bg-orange-500 text-white text-xs">
                    {(topComment.author?.name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {topComment.author?.name || "Anonymous"}
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
        onTopCommentVoteChange={handleTopCommentVoteChange}
      />
    </>
  )
})

export default PostCard

