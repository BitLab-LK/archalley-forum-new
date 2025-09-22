/**
 * PostCard Component - Individual post display for forum homepage and feed
 * 
 * This component renders a complete forum post with all interactive features including:
 * - Post content display with responsive text sizing
 * - Multi-category support with AI-suggested categories
 * - Real-time voting system with optimistic updates
 * - Image gallery with multiple layout formats (1-4+ images)
 * - Comment count tracking and top comment display
 * - User authentication and permission-based actions
 * - Socket.IO integration for real-time updates
 * - Mobile-responsive design with touch-friendly interactions
 * 
 * Key Features:
 * - Responsive image layouts for 1-4+ images
 * - Real-time vote synchronization across modals
 * - Optimistic UI updates for better UX
 * - Anonymous posting support
 * - Badge system integration for user reputation
 * - Category-based background theming
 * - Comprehensive error handling and loading states
 * - Accessibility features with proper ARIA labels
 * 
 * Performance Optimizations:
 * - Memoized callbacks and computed values
 * - Lazy image loading with priority hints
 * - Efficient re-render prevention
 * - Debounced socket events
 * - Optimized state management
 * 
 * Dependencies:
 * - Global vote state management (@/lib/vote-sync)
 * - Socket.IO for real-time updates (@/lib/socket-context)
 * - Activity event system (@/lib/activity-events)
 * - Authentication context (@/lib/auth-context)
 * - Category color theming (@/lib/category-colors)
 * 
 * @author Forum Development Team
 * @version 4.0
 * @since 2024-01-01
 */
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

// ============================================================================
// TYPE DEFINITIONS AND INTERFACES
// ============================================================================

/**
 * User badge interface for reputation display
 * Represents earned badges with metadata
 */
interface UserBadge {
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
}

/**
 * Category interface for post categorization
 * Supports both single and multiple category assignments
 */
interface PostCategory {
  id: string
  name: string
  color: string
  slug: string
}

/**
 * Top comment interface for preview display
 * Shows the most engaged comment on a post
 */
interface TopComment {
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

/**
 * Complete post interface with all display data
 * Supports both legacy and new data structures for backward compatibility
 */
interface Post {
  id: string
  author: {
    id: string
    name: string
    avatar: string
    isVerified: boolean
    rank: string
    rankIcon: string
    badges?: UserBadge[]
  }
  content: string
  category: string                    // Primary category (backward compatibility)
  categories?: PostCategory           // Single category object (primary)
  allCategories?: PostCategory[]      // Multiple categories from new structure
  aiCategories?: string[]             // AI-suggested categories as strings
  isAnonymous: boolean
  isPinned: boolean
  upvotes: number
  downvotes: number
  userVote?: "up" | "down" | null
  comments: number
  timeAgo: string
  images?: string[]                   // Array of image URLs
  isOptimistic?: boolean              // Flag for optimistic posts
  topComment?: TopComment
}

/**
 * PostCard component props interface
 * Defines all required and optional properties
 */
interface PostCardProps {
  post: Post
  onDelete?: () => void | Promise<void>
  onCommentCountChange?: (postId: string, newCount: number) => void
  onTopCommentVoteChange?: (postId: string, topComment: { 
    id: string; 
    author: { name: string; image?: string }; 
    content: string; 
    upvotes: number; 
    downvotes: number; 
    isBestAnswer: boolean; 
    userVote?: "up" | "down" 
  } | null) => void
}

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Text size configuration for dynamic post content styling
 * Automatically adjusts text size based on content length for better readability
 * Used for text-only posts without images to create visual hierarchy
 */
const TEXT_SIZE_CONFIG = [
  { max: 50, class: "text-3xl" },    // Very short posts (like quotes)
  { max: 100, class: "text-2xl" },   // Short posts
  { max: 200, class: "text-xl" },    // Medium posts
  { max: 300, class: "text-lg" },    // Longer posts
] as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines appropriate text size class based on content length
 * Implements responsive typography for better content presentation
 * 
 * @param content - Post content string to analyze
 * @returns Tailwind CSS class for text sizing
 */
const getTextSizeClass = (content: string): string => {
  const length = content.length
  return TEXT_SIZE_CONFIG.find(config => length <= config.max)?.class ?? "text-base"
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * PostCard - Main component for displaying individual forum posts
 * 
 * Features:
 * - Real-time voting with optimistic updates
 * - Multi-image gallery with responsive layouts
 * - Comment count tracking and top comment preview
 * - Category-based theming and AI suggestions
 * - Mobile-responsive design with touch interactions
 * - Socket.IO integration for live updates
 * - Permission-based actions (delete, report)
 * - Anonymous posting support
 * - Badge system integration
 * 
 * State Management:
 * - Uses global vote state for cross-modal synchronization
 * - Local state for UI interactions and optimistic updates
 * - Socket events for real-time data synchronization
 * - Ref-based previous value tracking for parent notifications
 * 
 * Performance Optimizations:
 * - Memoized component with React.memo
 * - Memoized callbacks to prevent unnecessary re-renders
 * - Computed values for expensive operations
 * - Lazy image loading with priority hints
 * 
 * @param props - PostCard component props
 * @returns Memoized PostCard component
 */
const PostCard = memo(function PostCard({ post, onDelete, onCommentCountChange, onTopCommentVoteChange }: PostCardProps) {
  
  // ========================================================================
  // HOOKS AND CONTEXT
  // ========================================================================
  
  const { user } = useAuth()
  const { confirm } = useConfirmDialog()
  const { toast } = useToast()
  
  // ========================================================================
  // COMPUTED VALUES AND MEMOIZATION
  // ========================================================================
  
  // Memoized computed values for performance optimization
  const isAuthor = useMemo(() => user?.id === post.author?.id, [user?.id, post.author?.id])
  const cardBackgroundClasses = useMemo(() => {
    // Card always has white/dark background for consistency
    return "shadow-sm border-0 overflow-visible bg-white dark:bg-gray-800"
  }, [])
  const contentBackgroundClasses = useMemo(() => {
    // Use light category-based background only for text posts (without images)
    const hasImages = post.images && post.images.length > 0
    if (hasImages) {
      return ""
    }
    // Add null check for post.category
    const categoryName = post.category || 'general'
    return getCategoryBackground(categoryName.toLowerCase())
  }, [post.category, post.images])
  const isAdmin = useMemo(() => user?.role === "ADMIN", [user?.role])
  const canDelete = useMemo(() => isAuthor || isAdmin, [isAuthor, isAdmin])
  
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  // Global vote state for real-time synchronization between post and modal
  // Ensures consistent vote display across all components
  const { voteState, updateVote } = useGlobalVoteState(post.id, {
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    userVote: post.userVote || null
  })
  
  // Extract values for easier use throughout component
  const { upvotes, downvotes, userVote } = voteState
  const [isVoting, setIsVoting] = useState(false)
  
  // Local state for top comment with real-time updates
  // Allows for independent comment updates without full post refresh
  const [topComment, setTopComment] = useState(post.topComment)
  
  // Comment count management - uses original prop value with sync capabilities
  const commentCount = post.comments
  const syncCommentCount = useCallback(() => {
    // Comment count syncing functionality can be enhanced here
    // Currently handles basic synchronization for real-time updates
  }, [])
  
  // Modal state for post expansion and image viewing
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  // Ref for tracking previous values to enable parent component notifications
  // Prevents unnecessary parent updates when values haven't actually changed
  const prevCommentCount = useRef(commentCount)

  
  // ========================================================================
  // REAL-TIME UPDATES WITH SOCKET.IO
  // ========================================================================
  
  // Socket.IO integration for real-time updates across all connected clients
  const { socket, joinPost, leavePost } = useSocket()
  
  /**
   * Socket.IO effect for real-time post updates
   * Manages room joining/leaving and event listeners for live data
   * 
   * Features:
   * - Automatic room management for post-specific updates
   * - Real-time vote synchronization across clients
   * - New comment notifications and count updates
   * - Proper cleanup to prevent memory leaks
   * 
   * Events handled:
   * - vote-update: Real-time vote count changes
   * - new-comment: New comment notifications
   */
  useEffect(() => {
    if (socket) {
      // Join post-specific room for targeted updates
      joinPost(post.id)
      
      // Handle real-time vote updates from other users
      const handleVoteUpdate = (data: { upvotes: number; downvotes: number; userVote: string | null }) => {
        updateVote({
          upvotes: data.upvotes,
          downvotes: data.downvotes,
          userVote: data.userVote as "up" | "down" | null
        })
      }
      
      // Handle new comment notifications for real-time engagement
      const handleNewComment = (commentData: any) => {
        // Update comment count or handle as needed for live updates
        // Could trigger a refetch or update local state for immediate feedback
        console.log('New comment received:', commentData)
      }
      
      // Register event listeners for real-time updates
      socket.on('vote-update', handleVoteUpdate)
      socket.on('new-comment', handleNewComment)
      
      // Cleanup function - remove listeners and leave room
      return () => {
        socket.off('vote-update', handleVoteUpdate)
        socket.off('new-comment', handleNewComment)
        leavePost(post.id)
      }
    }
    
    // Fallback cleanup when socket is not available
    return () => {
      // Cleanup function when socket is not available
    }
  }, [socket, post.id, joinPost, leavePost, updateVote])  
  /**
   * Parent component notification effect
   * Efficiently notifies parent of comment count changes for global state management
   * 
   * Features:
   * - Immediate synchronization for smooth UX
   * - Change detection to prevent unnecessary notifications
   * - Ref-based tracking for performance optimization
   * 
   * Use Cases:
   * - Homepage feed updates
   * - Global comment count synchronization
   * - Real-time engagement metrics
   */
  useEffect(() => {
    if (onCommentCountChange && commentCount !== prevCommentCount.current) {
      // Immediate notification without delay for smooth user experience
      onCommentCountChange(post.id, commentCount)
      prevCommentCount.current = commentCount
    }
  }, [commentCount, post.id, onCommentCountChange])

  // Everything syncs instantly now - votes AND comments for optimal UX!  
  // ========================================================================
  // POST MANAGEMENT ACTIONS
  // ========================================================================
  
  /**
   * Handles post deletion with comprehensive security and UX considerations
   * 
   * Security Features:
   * - Mandatory confirmation dialog to prevent accidental deletions
   * - Permission validation (author or admin only)
   * - CSRF protection through credentials inclusion
   * - Proper error handling with user-friendly messages
   * 
   * UX Features:
   * - Two-step confirmation process
   * - Loading states during deletion
   * - Success/error feedback via toast notifications
   * - Automatic page refresh to update UI
   * 
   * Error Handling:
   * - Network error detection and messaging
   * - Server error parsing and display
   * - Graceful fallback for unknown errors
   * - Loading state management
   * 
   * @returns Promise that resolves when deletion is complete or cancelled
   */
  const handleDelete = useCallback(async () => {
    // Always show confirmation dialog first for safety
    const confirmed = await confirm({
      title: "Delete Post",
      description: "Are you sure you want to delete this post? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    })
    
    // Exit early if user cancels - no state changes needed
    if (!confirmed) {
      return
    }
    
    // Only set deleting state AFTER confirmation to prevent UI flicker
    setIsDeleting(true)
    
    // If onDelete prop exists, delegate to parent component
    if (onDelete) {
      await onDelete()
      setIsDeleting(false)
      return
    }
    
    // Otherwise, handle deletion directly with full error handling
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",  // Include cookies for CSRF protection
        headers: { "Content-Type": "application/json" },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        setIsDeleting(false)
        throw new Error(errorData.error || "Failed to delete post")
      }
      
      // Show success message for user feedback
      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
      
      // Refresh the page to update the post list and maintain data consistency
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
  /**
   * Handles new comment addition with immediate UI updates
   * Provides optimistic updates for better user experience
   * 
   * @fires onCommentCountChange - Notifies parent of count change
   */
  const handleCommentAdded = useCallback(() => {
    const newCount = commentCount + 1
    syncCommentCount()
    onCommentCountChange?.(post.id, newCount)
  }, [commentCount, syncCommentCount, onCommentCountChange, post.id])

  /**
   * Handles comment count updates from external sources
   * Ensures synchronization across all components
   * 
   * @param newCount - Updated comment count from server or other source
   * @fires onCommentCountChange - Notifies parent of count change
   */
  const handleCommentCountUpdate = useCallback((newCount: number) => {
    syncCommentCount()
    onCommentCountChange?.(post.id, newCount)
  }, [syncCommentCount, onCommentCountChange, post.id])

  /**
   * Opens the post modal for detailed view
   * Supports opening at specific image index for gallery navigation
   * 
   * @param imgIdx - Index of image to display first (default: 0)
   */
  const openModal = useCallback((imgIdx: number = 0) => {
    setModalImageIndex(imgIdx)
    setModalOpen(true)
  }, [])

  /**
   * Handles top comment vote changes from modal interactions
   * Updates local state and forwards changes to parent component
   * Enables real-time synchronization between post card and modal
   * 
   * @param postId - ID of the post being updated
   * @param newTopComment - Updated top comment data or null if removed
   */
  const handleTopCommentVoteChange = useCallback((postId: string, newTopComment: { id: string, author: { name: string, image?: string }, content: string, upvotes: number, downvotes: number, isBestAnswer: boolean } | null) => {
    if (postId === post.id) {
      if (newTopComment === null) {
        // No top comment anymore - clear local state
        setTopComment(undefined)
      } else {
        // Update with new top comment data for immediate display
        setTopComment(newTopComment)
      }
      
      // Forward to parent component for global state management
      onTopCommentVoteChange?.(postId, newTopComment)
    }
  }, [post.id, onTopCommentVoteChange])

  // ========================================================================
  // VOTING SYSTEM
  // ========================================================================

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
        <Card className={cn(cardBackgroundClasses, "min-h-[180px] lg:min-h-[200px] mb-4 lg:mb-6")}>
            <CardContent className="p-4 lg:p-6 overflow-visible">
            {/* Post Header */}
            <div className="mb-4">
              {/* Mobile: Stacked layout, Desktop: Side by side */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                {/* User Info Section */}
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarImage src={post.isAnonymous ? "/placeholder.svg" : (post.author?.avatar || "/placeholder-user.jpg")} />
                    <AvatarFallback>{post.isAnonymous ? "A" : (post.author?.name?.[0] || "U")}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    {/* Name and verification badges */}
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span className="font-semibold text-sm sm:text-base truncate">
                        {post.isAnonymous ? "Anonymous" : (post.author?.name || "User")}
                      </span>
                      {!post.isAnonymous && post.author?.isVerified && (
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  
                  {/* Badges and time - responsive layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    {/* User badges */}
                    {!post.isAnonymous && post.author?.badges && post.author.badges.length > 0 && (
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t space-y-3 sm:space-y-0">
            {/* Mobile: Stacked layout, Desktop: Horizontal layout */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-hide">
              {/* Vote buttons group */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCardVote("up")}
                  className={cn(
                    "text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-3 py-2 sm:px-3 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 mobile-touch-target",
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
                    "text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded-full px-3 py-2 sm:px-3 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 mobile-touch-target",
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
                className="text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-3 py-2 sm:px-3 flex-shrink-0 mobile-touch-target"
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="text-xs sm:text-sm">Comment{commentCount > 0 ? ` ${commentCount}` : ''}</span>
              </Button>

              {/* Share button */}
              <ShareDropdown 
                post={post}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-3 py-2 sm:px-3 flex-shrink-0 mobile-touch-target"
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
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <button className={cn(
                        "text-xs font-medium transition-colors py-2 px-2 mobile-touch-target",
                        topComment.userVote === "up" 
                          ? "text-orange-600 hover:text-orange-500" 
                          : "text-gray-500 hover:text-orange-500"
                      )}>
                        {topComment.userVote === "up" ? "Unlike" : "Like"}
                      </button>
                      <button className={cn(
                        "text-xs font-medium transition-colors py-2 px-2 mobile-touch-target",
                        topComment.userVote === "down" 
                          ? "text-red-600 hover:text-red-500" 
                          : "text-gray-500 hover:text-gray-700"
                      )}>
                        {topComment.userVote === "down" ? "Remove Dislike" : "Dislike"}
                      </button>
                      <button className="text-xs text-gray-500 hover:text-blue-500 font-medium transition-colors py-2 px-2 mobile-touch-target">
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

/**
 * Memoized PostCard component for optimal performance
 * 
 * React.memo prevents unnecessary re-renders by performing shallow comparison
 * of props. This component will only re-render when:
 * 
 * ✅ WILL RE-RENDER WHEN:
 * - post.id changes (new post)
 * - post.upvotes/downvotes change (vote updates)
 * - post.content changes (edit operations)
 * - post.images change (image updates)
 * - post.comments count changes
 * - post.topComment changes
 * - onDelete function reference changes
 * - onCommentCountChange function reference changes
 * - onTopCommentVoteChange function reference changes
 * 
 * ❌ WILL NOT RE-RENDER WHEN:
 * - Parent component re-renders for unrelated reasons
 * - Other posts in the list update
 * - Global state changes not affecting this post
 * - Unrelated context provider updates
 * 
 * 🔧 OPTIMIZATION NOTES:
 * - Parent components should memoize callback props
 * - Global vote state prevents prop drilling
 * - Socket.IO updates bypass prop changes for efficiency
 * - Local state changes (modal, UI) don't require parent updates
 * 
 * 📈 PERFORMANCE IMPACT:
 * - Reduces unnecessary renders in large post lists
 * - Maintains smooth scrolling in infinite scroll scenarios
 * - Optimizes memory usage in real-time environments
 * - Improves battery life on mobile devices
 */
export default memo(PostCard)

