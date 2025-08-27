"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  MoreHorizontal,
  Globe
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useGlobalVoteState } from "@/lib/vote-sync"
import { activityEventManager } from "@/lib/activity-events"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import ShareDropdown from "./share-dropdown"

// Types
interface Comment {
  id: string
  author: string
  authorId: string
  authorImage: string
  authorRank?: string
  content: string
  createdAt: string
  upvotes: number
  downvotes: number
  userVote?: "up" | "down"
  replies?: Comment[]
  parentId?: string
}

interface ImagePostModalProps {
  open: boolean
  onClose: () => void
  onCommentAdded?: () => void
  onCommentCountUpdate?: (newCount: number) => void
  onVoteChange?: (postId: string, newUpvotes: number, newDownvotes: number, newUserVote: "up" | "down" | null) => void
  onTopCommentVoteChange?: (postId: string, topComment: { id: string, author: string, content: string, upvotes: number, downvotes: number, isBestAnswer: boolean, userVote?: "up" | "down" } | null) => void
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
      isBestAnswer: boolean
    }
  }
  initialImage?: number
}

export default function ImagePostModal({ 
  open, 
  onClose, 
  onCommentAdded, 
  onCommentCountUpdate,
  onVoteChange,
  onTopCommentVoteChange,
  post, 
  initialImage = 0 
}: ImagePostModalProps) {
  // State management
  const [carouselIndex, setCarouselIndex] = useState(initialImage)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [replyInput, setReplyInput] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
    return undefined
  }, [open])
  
  // Refs and hooks
  const commentInputRef = useRef<HTMLInputElement>(null)
  const lastVoteClickTime = useRef<number>(0) // Debounce vote clicks
  const previousCommentCount = useRef<number>(0) // Track previous comment count
  const { user } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirmDialog()
  
  // Effect to update comment count whenever comments change
  useEffect(() => {
    const totalComments = comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0)
    }, 0)
    
    // Only call update if the count actually changed and callback exists
    if (totalComments !== previousCommentCount.current && onCommentCountUpdate) {
      previousCommentCount.current = totalComments
      onCommentCountUpdate(totalComments)
    }
  }, [comments]) // Remove onCommentCountUpdate from dependencies
  
  // Use global vote state for real-time synchronization
  const { voteState, updateVote } = useGlobalVoteState(post.id, {
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    userVote: post.userVote || null
  })
  
  // Extract values for easier use
  const { upvotes, downvotes, userVote } = voteState
  const [isVoting, setIsVoting] = useState(false)
  
  // Simple comment count management for now
  const commentCount = post.comments
  
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
  
  // Computed values
  const images = post.images || []
  const hasImages = images.length > 0

  // Effects
  useEffect(() => {
    setCarouselIndex(initialImage)
  }, [initialImage, open])

  // Fetch comments when modal opens
  useEffect(() => {
    if (!open) return undefined
    
    setLoading(true)
    
    const fetchComments = async () => {
      try {
        const commentsUrl = `/api/comments?postId=${post.id}`;
        
        const res = await fetch(commentsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache'
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('ImageModal: Comments fetch failed:', res.status, errorText);
          throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
        }
        
        const data = await res.json();
        
        if (Array.isArray(data.comments)) {
          setComments(data.comments);
        } else {
          console.warn('ImageModal: Comments data is not an array:', data);
          setComments([]);
        }
      } catch (error) {
        console.error("ImageModal: Error fetching comments:", error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
    return undefined
  }, [open, post.id])

  // Handle vote action with smooth animation and global sync
  const handleVote = async (type: "up" | "down") => {
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
        throw new Error(`Vote failed: ${response.status}`)
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
      } else {
        
      }

} catch (error) {
      console.error('❌ Vote failed:', error)
      
      // Rollback on error using global state
      updateVote({
        upvotes: upvotes,
        downvotes: downvotes,
        userVote: userVote
      })
      
      toast({
        title: "Vote Failed",
        description: "Failed to vote. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsVoting(false)
    }
  }

  // Event handlers
  const handleCommentClick = () => {
    commentInputRef.current?.focus()
    commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const handleDebouncedVote = async (type: "up" | "down") => {
    const now = Date.now()
    if (lastVoteClickTime.current && now - lastVoteClickTime.current < 500) {
      return
    }
    lastVoteClickTime.current = now

await handleVote(type)

}

  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return
    
    const tempComment = {
      id: `temp-${Date.now()}`,
      author: user?.name || "Anonymous",
      authorId: user?.id || "",
      authorImage: user?.image || "/placeholder-user.jpg",
      authorRank: user?.rank || "NEW_MEMBER",
      content: commentInput.trim(),
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      userVote: undefined,
      replies: []
    }
    
    // Add optimistic comment immediately
    setComments(prev => [tempComment, ...prev])
    setCommentInput("")
    
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: tempComment.content,
          postId: post.id
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Replace temp comment with real comment
        setComments(prev => {
          const updatedComments = prev.map(comment => 
            comment.id === tempComment.id 
              ? {
                  ...data.comment,
                  author: data.comment.users?.name || "Anonymous",
                  authorImage: data.comment.users?.image || "/placeholder-user.jpg",
                  authorRank: data.comment.users?.rank || "NEW_MEMBER"
                }
              : comment
          )
          
          // Emit activity event for real-time feed updates
          if (user?.id) {
            activityEventManager.emitComment(user.id, post.id, data.comment.id)
          }
          
          return updatedComments
        })
        
        onCommentAdded?.()
      } else {
        // Remove temp comment on error
        setComments(prev => prev.filter(comment => comment.id !== tempComment.id))
        console.error("Failed to post comment")
      }
    } catch (error) {
      // Remove temp comment on error
      setComments(prev => prev.filter(comment => comment.id !== tempComment.id))
      console.error("Error posting comment:", error)
    }
  }

  const handleReply = (commentId: string) => {
    setReplyTo(commentId)
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const addReplyToComment = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return { ...comment, replies: [...(comment.replies || []), newReply] }
      } else if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: addReplyToComment(comment.replies, parentId, newReply) }
      }
      return comment
    })
  }

  const handleSubmitReply = async () => {
    if (!replyInput.trim() || !replyTo) return
    
    const tempReply = {
      id: `temp-reply-${Date.now()}`,
      author: user?.name || "Anonymous",
      authorId: user?.id || "",
      authorImage: user?.image || "/placeholder-user.jpg",
      authorRank: user?.rank || "NEW_MEMBER",
      content: replyInput.trim(),
      createdAt: new Date().toISOString(),
      parentId: replyTo,
      upvotes: 0,
      downvotes: 0,
      userVote: undefined
    }
    
    // Add optimistic reply immediately
    setComments(prev => prev.map(comment => 
      comment.id === replyTo 
        ? { ...comment, replies: [...(comment.replies || []), tempReply] }
        : comment
    ))
    setReplyInput("")
    setReplyTo(null)
    
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: tempReply.content,
          postId: post.id,
          parentId: replyTo
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Replace temp reply with real reply
        setComments(prev => {
          const updatedComments = prev.map(comment => 
            comment.id === replyTo 
              ? {
                  ...comment,
                  replies: comment.replies?.map((reply: Comment) => 
                    reply.id === tempReply.id 
                      ? {
                          ...data.comment,
                          author: data.comment.users?.name || "Anonymous",
                          authorImage: data.comment.users?.image || "/placeholder-user.jpg",
                          authorRank: data.comment.users?.rank || "NEW_MEMBER"
                        } as Comment
                      : reply
                  ) || []
                }
              : comment
          )
          
          // Emit activity event for real-time feed updates
          if (user?.id) {
            activityEventManager.emitComment(user.id, post.id, data.comment.id)
          }
          
          return updatedComments
        })
        
        onCommentAdded?.()
      } else {
        // Remove temp reply on error
        setComments(prev => prev.map(comment => 
          comment.id === replyTo 
            ? { ...comment, replies: comment.replies?.filter((reply: Comment) => reply.id !== tempReply.id) || [] }
            : comment
        ))
        console.error("Failed to post reply")
      }
    } catch (error) {
      // Remove temp reply on error
      setComments(prev => prev.map(comment => 
        comment.id === replyTo 
          ? { ...comment, replies: comment.replies?.filter((reply: Comment) => reply.id !== tempReply.id) || [] }
          : comment
      ))
      console.error("Error posting reply:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    return `${Math.floor(diffInSeconds / 86400)}d`
  }

  // Format rank for display
  const formatRank = (rank: string) => {
    return rank.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get rank color based on rank level
  const getRankColor = (rank: string) => {
    const rankColors = {
      'NEW_MEMBER': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      'CONVERSATION_STARTER': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'RISING_STAR': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      'VISUAL_STORYTELLER': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      'VALUED_RESPONDER': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'COMMUNITY_EXPERT': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      'TOP_CONTRIBUTOR': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    };
    return rankColors[rank as keyof typeof rankColors] || rankColors.NEW_MEMBER;
  };

  // Render comment function like text post modal
  const renderComment = (comment: Comment, depth: number = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0
    const isExpanded = expandedReplies.has(comment.id)
    const isNested = depth > 0
    const isAuthor = comment.authorId === post.author.id
    
    return (
      <div key={comment.id} className={cn("relative", isNested && "ml-6")}>
        {/* Vertical connecting line for nested replies */}
        {isNested && depth === 1 && (
          <div className="absolute -left-6 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600" />
        )}
        
        <div className="flex items-start gap-2">
          {/* Horizontal connector for nested replies */}
          {isNested && depth === 1 && (
            <div className="absolute -left-6 top-4 w-4 h-px bg-gray-300 dark:bg-gray-600" />
          )}
          
          <Avatar className={cn("flex-shrink-0", isNested ? "h-6 w-6" : "h-8 w-8")}>
            <AvatarImage src={comment.authorImage || "/placeholder-user.jpg"} />
            <AvatarFallback className="bg-orange-500 text-white text-xs">
              {comment.author ? comment.author[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {/* Comment bubble with proper background hierarchy */}
            <div className={cn(
              "rounded-2xl px-3 py-2 relative inline-block max-w-fit",
              depth === 0 && "bg-gray-100 dark:bg-gray-800",
              depth === 1 && "bg-gray-50 dark:bg-gray-750", 
              depth >= 2 && "bg-gray-25 dark:bg-gray-700"
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn(
                      "font-semibold text-gray-900 dark:text-white",
                      isNested ? "text-sm" : "text-sm"
                    )}>
                      {comment.author || "Anonymous"}
                    </span>
                    {comment.authorRank && (
                      <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                        getRankColor(comment.authorRank),
                        isNested ? "text-xs" : "text-xs"
                      )}>
                        {formatRank(comment.authorRank)}
                      </span>
                    )}
                    {isAuthor && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        Author
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-gray-800 dark:text-gray-200 leading-relaxed break-words",
                    isNested ? "text-sm" : "text-sm"
                  )}>
                    {comment.content}
                  </p>
                </div>
                
                {/* Delete button for comment author or admin */}
                {(user?.id === comment.authorId || user?.role === "ADMIN") && (
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="h-6 w-6 p-1 text-gray-400 hover:text-gray-600 cursor-pointer rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center relative z-[1005]"
                          aria-label="More options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="w-32 z-[1010] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
                        side="bottom"
                        sideOffset={5}
                      >
                        <DropdownMenuItem 
                          onClick={() => handleDeleteComment(comment.id)} 
                          className="text-red-600 hover:text-red-700 focus:text-red-700 cursor-pointer flex items-center hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-4 mt-1 text-xs">
              <button 
                onClick={() => handleCommentVote(comment.id, "up")}
                className={cn(
                  "font-semibold transition-all duration-100 hover:underline active:scale-95",
                  comment.userVote === "up" ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-gray-400"
                )}
              >
                {comment.userVote === "up" ? "Unlike" : "Like"}
              </button>
              <button 
                onClick={() => handleCommentVote(comment.id, "down")}
                className={cn(
                  "font-semibold transition-all duration-100 hover:underline active:scale-95",
                  comment.userVote === "down" ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
                )}
              >
                {comment.userVote === "down" ? "Remove Dislike" : "Dislike"}
              </button>
              <button 
                onClick={() => handleReply(comment.id)}
                className="font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:underline transition-all duration-100 active:scale-95"
              >
                Reply
              </button>
              <span className="text-gray-400 text-xs">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {hasReplies && (
                <button 
                  onClick={() => toggleReplies(comment.id)}
                  className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:underline transition-colors duration-75 flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      <svg className="w-3 h-3 transition-transform duration-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Hide replies
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 transition-transform duration-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      View {comment.replies?.length || 0} {(comment.replies?.length || 0) === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </button>
              )}
              {/* Reaction count inline */}
              {(comment.upvotes > 0 || comment.downvotes > 0) && (
                <div className="flex items-center ml-auto gap-3">
                  {comment.upvotes > 0 && (
                    <div className="flex items-center">
                      <div className="flex items-center -space-x-0.5">
                        <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">👍</div>
                        {comment.upvotes > 5 && <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">❤️</div>}
                        {comment.upvotes > 10 && <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">😂</div>}
                      </div>
                      <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">{comment.upvotes}</span>
                    </div>
                  )}
                  {comment.downvotes > 0 && (
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs">👎</div>
                      <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">{comment.downvotes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reply Input */}
            {replyTo === comment.id && (
              <div className="mt-2">
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={user?.image || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-orange-500 text-white text-xs">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full">                  <input 
                    type="text"
                    placeholder="Write a reply..."
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitReply()}
                    autoFocus
                    className="w-full bg-transparent rounded-full px-4 py-2 text-sm border-none focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-150"
                  />
                  </div>
                </div>
              </div>
            )}

            {/* Nested Replies */}
            {hasReplies && isExpanded && (
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-200 ease-out">
                <div className="space-y-2">
                  {comment.replies?.map((reply: Comment) => renderComment(reply, depth + 1))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Keyboard navigation
  useEffect(() => {
    if (!open) return undefined
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCarouselIndex(i => (i > 0 ? i - 1 : images.length - 1))
      if (e.key === "ArrowRight") setCarouselIndex(i => (i < images.length - 1 ? i + 1 : 0))
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, images.length, onClose])

  const handleCommentVote = async (commentId: string, voteType: "up" | "down") => {
    if (!user) return
    
    // Store previous state for rollback
    const previousComments = comments
    
    // Update local state immediately (optimistic update)
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const currentVote = comment.userVote
        let newUpvotes = comment.upvotes || 0
        let newDownvotes = comment.downvotes || 0
        let newUserVote = comment.userVote
        
        if (currentVote === voteType) {
          // Remove vote
          if (voteType === "up") newUpvotes--
          else newDownvotes--
          newUserVote = undefined
        } else if (currentVote) {
          // Switch vote
          if (voteType === "up") {
            newUpvotes++
            newDownvotes--
          } else {
            newUpvotes--
            newDownvotes++
          }
          newUserVote = voteType
        } else {
          // New vote
          if (voteType === "up") newUpvotes++
          else newDownvotes++
          newUserVote = voteType
        }
        
        return { ...comment, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote }
      }
      
      // Check replies
      return {
        ...comment,
        replies: comment.replies?.map((reply: Comment) => {
          if (reply.id === commentId) {
            const currentVote = reply.userVote
            let newUpvotes = reply.upvotes || 0
            let newDownvotes = reply.downvotes || 0
            let newUserVote = reply.userVote
            
            if (currentVote === voteType) {
              if (voteType === "up") newUpvotes--
              else newDownvotes--
              newUserVote = undefined
            } else if (currentVote) {
              if (voteType === "up") {
                newUpvotes++
                newDownvotes--
              } else {
                newUpvotes--
                newDownvotes++
              }
              newUserVote = voteType
            } else {
              if (voteType === "up") newUpvotes++
              else newDownvotes++
              newUserVote = voteType
            }
            
            return { ...reply, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote }
          }
          return reply
        })
      }
    })
    
    // Update state with the new comments
    setComments(updatedComments)
    
    // Check if the top comment has changed after the vote
    const newTopComment = updatedComments.reduce((top, comment) => {
      const currentActivity = (comment.upvotes || 0) + (comment.downvotes || 0)
      const topActivity = (top?.upvotes || 0) + (top?.downvotes || 0)
      return currentActivity > topActivity ? comment : top
    }, updatedComments[0])
    
    // Always notify the parent about top comment changes (even for vote count updates)
    if (onTopCommentVoteChange) {
      if (!newTopComment || (newTopComment.upvotes || 0) + (newTopComment.downvotes || 0) === 0) {
        // No top comment or no votes left
        
        onTopCommentVoteChange(post.id, null)
      } else {
        // Update top comment with complete data
        const topCommentData = {
          id: newTopComment.id,
          author: newTopComment.author,
          content: newTopComment.content,
          upvotes: newTopComment.upvotes || 0,
          downvotes: newTopComment.downvotes || 0,
          isBestAnswer: false, // Comments don't have best answer feature yet
          userVote: newTopComment.userVote // Include user vote state
        }
        
        onTopCommentVoteChange(post.id, topCommentData)
      }
    }
    
    // Send request to server
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType })
      })
      
      if (!response.ok) {
        // Rollback on error
        setComments(previousComments)
        console.error("Failed to vote on comment")
      }
    } catch (error) {
      // Rollback on error
      setComments(previousComments)
      console.error("Error voting on comment:", error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = await confirm({
      title: "Delete Comment",
      description: "Are you sure you want to delete this comment? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    })
    
    if (!confirmed) return
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setComments(prev => {
          const updatedComments = prev.map(comment => {
            if (comment.id === commentId) return null
            
            if (comment.replies && comment.replies.length > 0) {
              comment.replies = comment.replies.filter((reply: Comment) => reply.id !== commentId)
            }
            
            return comment
          }).filter(Boolean) as Comment[]
          
          return updatedComments
        })
      } else {
        console.error("Failed to delete comment:", response.status)
        toast({
          title: "Delete Failed",
          description: "Failed to delete comment. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error",
        description: "An error occurred while deleting the comment. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (!open || !hasImages) return null

  return (
    <div 
      className="modal-backdrop fixed inset-0 z-[99999] flex items-center justify-center bg-black/80"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        margin: 0,
        padding: 0
      }}
    >
      <div className="relative h-[90vh] min-h-[600px] max-h-[800px] w-full max-w-7xl mx-4 flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
        {/* Left: Image Carousel */}
        <div className="flex-1 flex items-center justify-center bg-black relative min-h-[400px]">
          {hasImages && (
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <div className="w-full h-full transition-transform duration-500 ease-in-out flex items-center justify-center">
                  <Image
                    src={images[carouselIndex]}
                    alt={`Post image ${carouselIndex + 1}`}
                    className="object-contain w-full h-full"
                    width={800}
                    height={1200}
                    priority
                  />
                </div>
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-150 active:scale-95"
                      onClick={() => setCarouselIndex(i => (i > 0 ? i - 1 : images.length - 1))}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-150 active:scale-95"
                      onClick={() => setCarouselIndex(i => (i < images.length - 1 ? i + 1 : 0))}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {carouselIndex + 1} / {images.length}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Facebook-style Post Content */}
        <div className="w-full md:w-[450px] lg:w-[550px] xl:w-[550px] flex flex-col bg-white dark:bg-gray-900 h-full max-h-[800px]">
          {/* Header - Compact */}
          <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={post.isAnonymous ? "/placeholder.svg" : post.author.avatar} />
                <AvatarFallback className="bg-orange-500 text-white">{post.isAnonymous ? "A" : post.author.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {post.isAnonymous ? "Anonymous" : post.author.name}
                  </h3>
                  {!post.isAnonymous && post.author.isVerified && (
                    <div className="w-3.5 h-3.5 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {!post.isAnonymous && post.author.rank && (
                    <span className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                      getRankColor(post.author.rank)
                    )}>
                      {formatRank(post.author.rank)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{post.timeAgo}</span>
                  <span>•</span>
                  <Globe className="w-3 h-3" />
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-100 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Post Content - Reduced padding */}
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white text-[15px] leading-relaxed whitespace-pre-line break-words mb-3">
                {post.content}
              </p>
              
              {/* Category Tag (subtle) */}
              {post.category && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    #{post.category}
                  </span>
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center justify-between pt-3 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  {(upvotes > 0 || downvotes > 0) && (
                    <span className="flex items-center gap-1">
                      <div className="flex items-center">
                        {upvotes > 0 && (
                          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                            <ThumbsUp className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {downvotes > 0 && (
                          <div className={cn(
                            "w-5 h-5 bg-red-500 rounded-full flex items-center justify-center",
                            upvotes > 0 && "-ml-1"
                          )}>
                            <ThumbsDown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span>
                        {(upvotes || 0) + (downvotes || 0)}
                      </span>
                    </span>
                  )}
                </div>
                {commentCount > 0 && (
                  <span>{commentCount} comments</span>
                )}
              </div>
            </div>

            {/* Action Buttons - Sticky */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 py-1 z-10">
              <div className="flex items-center justify-between gap-1">
                <button 
                  onClick={() => handleDebouncedVote("up")} 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-100 font-medium active:scale-95",
                    userVote === "up" 
                      ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <ThumbsUp className="w-5 h-5" />
                  {upvotes > 0 && <span className="text-sm">({upvotes})</span>}
                </button>
                <button 
                  onClick={() => handleDebouncedVote("down")} 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-100 font-medium active:scale-95",
                    userVote === "down" 
                      ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <ThumbsDown className="w-5 h-5" />
                  {downvotes > 0 && <span className="text-sm">({downvotes})</span>}
                </button>
                <button 
                  onClick={handleCommentClick} 
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-100 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Comment</span>
                </button>
                <ShareDropdown 
                  post={post}
                  variant="ghost"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-100 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
                  showLabel={true}
                  context="modal"
                />
              </div>
            </div>

            {/* Comments Section */}
            <div className="px-4 py-3 space-y-3">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => renderComment(comment, 0))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>

          {/* Comment Input - Fixed at bottom */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user?.image || "/placeholder-user.jpg"} />
                <AvatarFallback className="bg-orange-500 text-white text-xs">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <input 
                  ref={commentInputRef}
                  type="text" 
                  placeholder="Write a comment..." 
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                  className="w-full bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 pr-10 text-sm border-none focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-150"
                />
                <button 
                  onClick={handleSubmitComment}
                  disabled={!commentInput.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 active:scale-95"
                >
                  {commentInput.trim() ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
