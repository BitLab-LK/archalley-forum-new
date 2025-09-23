"use client"

import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, MessageCircle, Globe, Trash2, MoreHorizontal } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { PostBadges } from "./post-badges"
import { useGlobalVoteState } from "@/lib/vote-sync"
import { activityEventManager } from "@/lib/activity-events"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ShareDropdown from "./share-dropdown"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { useToast } from "@/hooks/use-toast"

interface TextPostModalProps {
  open: boolean
  onClose: () => void
  onCommentAdded?: () => void
  onCommentCountUpdate?: (newCount: number) => void
  onTopCommentVoteChange?: (postId: string, topComment: { id: string, author: { name: string, image?: string }, content: string, upvotes: number, downvotes: number, isBestAnswer: boolean, userVote?: "up" | "down" } | null) => void
  post: {
    id: string
    author: {
      id: string
      name: string
      avatar: string
      isVerified: boolean
      rank: string
      rankIcon: string
      badges?: any[]
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
      author: { name: string, image?: string }
      content: string
      upvotes: number
      downvotes: number
      isBestAnswer: boolean
      userVote?: "up" | "down"
    }
  }
}

interface Comment {
  id: string
  author: string
  authorId: string
  authorImage: string
  authorRank?: string
  authorBadges?: any[]
  authorIsVerified?: boolean
  content: string
  createdAt: string
  parentId: string | null
  upvotes: number
  downvotes: number
  userVote?: "up" | "down" | null
  replies: Comment[]
}

export default function TextPostModal({ open, onClose, onCommentAdded, onCommentCountUpdate: _onCommentCountUpdate, onTopCommentVoteChange, post }: TextPostModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [replyInput, setReplyInput] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [optimisticCommentIds, setOptimisticCommentIds] = useState<Set<string>>(new Set()) // Track optimistic comments
  
  const previousCommentCount = useRef<number>(0) // Track previous comment count
  const { user } = useAuth()
  const { confirm } = useConfirmDialog()
  const { toast } = useToast()
  
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
  
  // Effect to update comment count whenever comments change
  useEffect(() => {
    const totalComments = comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0)
    }, 0)
    
    // Only call update if the count actually changed and callback exists
    if (totalComments !== previousCommentCount.current && _onCommentCountUpdate) {
      previousCommentCount.current = totalComments
      _onCommentCountUpdate(totalComments)
    }
  }, [comments]) // Remove _onCommentCountUpdate from dependencies
  
  // Use global vote state for real-time synchronization
  const { voteState, updateVote } = useGlobalVoteState(post.id, {
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    userVote: post.userVote || null
  })
  
  // Extract values for easier use
  const { upvotes, downvotes, userVote } = voteState
  const [isVoting, setIsVoting] = useState(false)
  
  // Check if this is an image post
  const hasImages = post.images && post.images.length > 0

  // Handle image navigation
  const nextImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev + 1) % post.images!.length)
    }
  }

  const prevImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev - 1 + post.images!.length) % post.images!.length)
    }
  }

  useEffect(() => {
    if (!open) return undefined
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", handleKey, { capture: true })
    return () => window.removeEventListener("keydown", handleKey, { capture: true })
  }, [open, onClose])

  // Fetch comments when modal opens
  useEffect(() => {
    if (!open) return undefined
    
    // Fetch both comments and post votes
    const fetchData = async () => {
      try {
        const commentsUrl = `/api/comments?postId=${post.id}`;
        
        const commentsRes = await fetch(commentsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache'
        });
        
        // Handle comments response
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          
          if (Array.isArray(commentsData.comments)) {
            setComments(commentsData.comments);
            
            // Keep all replies collapsed by default (empty Set)
            setExpandedReplies(new Set<string>());
          } else {
            console.warn('Comments data is not an array:', commentsData);
            setComments([]);
          }
        } else {
          const errorText = await commentsRes.text();
          console.error('Comments fetch failed:', commentsRes.status, errorText);
          setComments([]);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        setComments([]);
      }
    };
    
    fetchData();
    return undefined
  }, [open, post.id])

  // Vote handler with real-time synchronization
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
      console.error('❌ Modal Vote failed:', error)
      
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

  const handleDebouncedVote = async (type: "up" | "down") => {
    if (isVoting) {
      return // Prevent multiple clicks while processing
    }
    
    await handleVote(type)
  }

  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return
    
    // Create optimistic comment for instant UI update
    const optimisticComment = {
      id: `comment-${Date.now()}`,
      content: commentInput.trim(),
      createdAt: new Date().toISOString(),
      parentId: null,
      author: user?.name || "Anonymous",
      authorId: user?.id || "",
      authorImage: user?.image || "/placeholder-user.jpg",
      authorRank: user?.rank || "NEW_MEMBER",
      upvotes: 0,
      downvotes: 0,
      userVote: undefined,
      replies: []
    }
    
    // Track this as an optimistic comment
    setOptimisticCommentIds(prev => new Set(prev).add(optimisticComment.id))
    
    // Update UI immediately
    setComments(prev => [...prev, optimisticComment])
    setCommentInput("")
    
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentInput.trim(),
          postId: post.id
        })
      })
      
      if (response.ok) {
        // Replace optimistic comment with real one
        const data = await fetch(`/api/comments?postId=${post.id}`).then(res => res.json())
        if (Array.isArray(data.comments)) {
          setComments(data.comments)
          // Comment count will be handled by parent component
        }
        
        // Remove from optimistic tracking
        setOptimisticCommentIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(optimisticComment.id)
          return newSet
        })
        
        // Emit activity event for real-time feed updates
        if (user?.id) {
          activityEventManager.emitComment(user.id, post.id, optimisticComment.id)
        }
        
        onCommentAdded?.()
      } else {
        // Remove optimistic comment on error
        setComments(prev => prev.filter(c => c.id !== optimisticComment.id))
        setOptimisticCommentIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(optimisticComment.id)
          return newSet
        })
        setCommentInput(optimisticComment.content)
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id))
      setOptimisticCommentIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(optimisticComment.id)
        return newSet
      })
      setCommentInput(optimisticComment.content)
    }
  }

  const handleCommentVote = async (commentId: string, voteType: "up" | "down") => {
    if (!user) return
    
    // Prevent voting on optimistic comments (temporary comments that haven't been saved to server yet)
    if (optimisticCommentIds.has(commentId)) {
      console.warn('Cannot vote on optimistic comment, please wait for it to be saved')
      return
    }
    
    // Store original comments state for potential revert
    const originalComments = [...comments]
    
    // Optimistic update FIRST for instant UI response
    const updateVoteRecursively = (comments: any[]): any[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          const currentVote = comment.userVote
          let newUpvotes = comment.upvotes
          let newDownvotes = comment.downvotes
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
        
        // Check replies recursively
        if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: updateVoteRecursively(comment.replies) }
        }
        
        return comment
      })
    }
    
    // Update UI immediately
    const updatedComments = updateVoteRecursively(comments)
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
        // Update top comment with complete data - handle both string and object author
        const authorName = typeof newTopComment.author === 'string' 
          ? newTopComment.author 
          : (newTopComment.author as any)?.name || "Anonymous"
        const authorImage = typeof newTopComment.author === 'string' 
          ? (newTopComment as any).authorImage 
          : (newTopComment.author as any)?.image
          
        onTopCommentVoteChange(post.id, {
          id: newTopComment.id,
          author: {
            name: authorName,
            image: authorImage || "/placeholder-user.jpg"
          },
          content: newTopComment.content,
          upvotes: newTopComment.upvotes || 0,
          downvotes: newTopComment.downvotes || 0,
          isBestAnswer: false, // Comments don't have best answer feature yet
          userVote: newTopComment.userVote // Include user vote state
        })
      }
    }
    
    // Then send request in background
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType })
      })
      
      if (!response.ok) {
        // Revert to original state on error
        setComments(originalComments)
        const errorText = await response.text()
        console.error(`Failed to vote on comment ${commentId}: ${response.status} ${response.statusText}`, errorText)
        
        // Also revert the top comment change
        if (onTopCommentVoteChange) {
          const originalTopComment = originalComments.reduce((top, comment) => {
            const currentActivity = (comment.upvotes || 0) + (comment.downvotes || 0)
            const topActivity = (top?.upvotes || 0) + (top?.downvotes || 0)
            return currentActivity > topActivity ? comment : top
          }, originalComments[0])
          
          if (!originalTopComment || (originalTopComment.upvotes || 0) + (originalTopComment.downvotes || 0) === 0) {
            onTopCommentVoteChange(post.id, null)
          } else {
            // Use fallback values to avoid type issues
            const authorData = originalTopComment as any
            onTopCommentVoteChange(post.id, {
              id: originalTopComment.id,
              author: {
                name: authorData.author?.name || authorData.author || "Anonymous",
                image: authorData.author?.image || "/placeholder-user.jpg"
              },
              content: originalTopComment.content,
              upvotes: originalTopComment.upvotes || 0,
              downvotes: originalTopComment.downvotes || 0,
              isBestAnswer: false,
              userVote: originalTopComment.userVote || undefined
            })
          }
        }
        
        throw new Error(`Failed to vote on comment ${commentId}: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      // Revert to original state on error
      setComments(originalComments)
      console.error(`Error voting on comment ${commentId}, reverted:`, error)
      
      // Also revert the top comment change
      if (onTopCommentVoteChange) {
        const originalTopComment = originalComments.reduce((top, comment) => {
          const currentActivity = (comment.upvotes || 0) + (comment.downvotes || 0)
          const topActivity = (top?.upvotes || 0) + (top?.downvotes || 0)
          return currentActivity > topActivity ? comment : top
        }, originalComments[0])
        
        if (!originalTopComment || (originalTopComment.upvotes || 0) + (originalTopComment.downvotes || 0) === 0) {
          onTopCommentVoteChange(post.id, null)
        } else {
          // Use fallback values to avoid type issues
          const authorData = originalTopComment as any
          onTopCommentVoteChange(post.id, {
            id: originalTopComment.id,
            author: {
              name: authorData.author?.name || authorData.author || "Anonymous",
              image: authorData.author?.image || "/placeholder-user.jpg"
            },
            content: originalTopComment.content,
            upvotes: originalTopComment.upvotes || 0,
            downvotes: originalTopComment.downvotes || 0,
            isBestAnswer: false,
            userVote: originalTopComment.userVote || undefined
          })
        }
      }
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
        // Remove comment from local state recursively
        const removeCommentRecursively = (comments: any[]): any[] => {
          return comments.filter(comment => {
            if (comment.id === commentId) return false
            if (comment.replies && comment.replies.length > 0) {
              comment.replies = removeCommentRecursively(comment.replies)
            }
            return true
          })
        }
        
        setComments(prev => {
          const updatedComments = removeCommentRecursively(prev)
          
          return updatedComments
        })
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const handleReply = (commentId: string) => {
    // Instant focus on reply input
    setReplyTo(commentId)
  }

  const toggleReplies = (commentId: string) => {
    // Instant UI update with no delay
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

  const addReplyToComment = (comments: any[], parentId: string, newReply: any): any[] => {
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
    
    // Create optimistic reply for instant UI update
    const optimisticReply = {
      id: `comment-${Date.now()}`,
      author: user?.name || "Anonymous",
      authorId: user?.id || "",
      authorImage: user?.image || "/placeholder-user.jpg", 
      authorRank: user?.rank || "NEW_MEMBER",
      content: replyInput.trim(),
      createdAt: new Date().toISOString(),
      parentId: replyTo,
      upvotes: 0,
      downvotes: 0,
      userVote: undefined,
      replies: []
    }
    
    // Track this as an optimistic comment
    setOptimisticCommentIds(prev => new Set(prev).add(optimisticReply.id))
    
    // Update UI immediately
    const currentReplyTo = replyTo
    setComments(prev => addReplyToComment(prev, currentReplyTo, optimisticReply))
    setReplyInput("")
    setReplyTo(null)
    
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: optimisticReply.content,
          postId: post.id,
          parentId: currentReplyTo
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Replace optimistic reply with real one
        const realReply = {
          id: data.comment.id,
          author: data.comment.users.name,
          authorId: data.comment.authorId,
          authorImage: data.comment.users.image,
          authorRank: data.comment.users.rank,
          content: data.comment.content,
          createdAt: data.comment.createdAt,
          parentId: data.comment.parentId,
          upvotes: 0,
          downvotes: 0,
          userVote: undefined,
          replies: []
        }
        
        // Remove optimistic and add real reply
        const removeOptimisticAndAddReal = (comments: any[]): any[] => {
          return comments.map(comment => {
            if (comment.id === currentReplyTo) {
              return { 
                ...comment, 
                replies: [
                  ...comment.replies.filter((r: any) => r.id !== optimisticReply.id),
                  realReply
                ]
              }
            } else if (comment.replies && comment.replies.length > 0) {
              return { ...comment, replies: removeOptimisticAndAddReal(comment.replies) }
            }
            return comment
          })
        }
        
        setComments(prev => {
          const updatedComments = removeOptimisticAndAddReal(prev)
          
          // Emit activity event for real-time feed updates
          if (user?.id) {
            activityEventManager.emitComment(user.id, post.id, data.comment.id)
          }
          
          return updatedComments
        })
        
        // Remove from optimistic tracking
        setOptimisticCommentIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(optimisticReply.id)
          return newSet
        })
        
        onCommentAdded?.()
      } else {
        // Remove optimistic reply on error and restore input
        const removeOptimistic = (comments: any[]): any[] => {
          return comments.map(comment => {
            if (comment.id === currentReplyTo) {
              return { ...comment, replies: comment.replies.filter((r: any) => r.id !== optimisticReply.id) }
            } else if (comment.replies && comment.replies.length > 0) {
              return { ...comment, replies: removeOptimistic(comment.replies) }
            }
            return comment
          })
        }
        setComments(prev => removeOptimistic(prev))
        setOptimisticCommentIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(optimisticReply.id)
          return newSet
        })
        setReplyInput(optimisticReply.content)
        setReplyTo(currentReplyTo)
      }
    } catch (error) {
      console.error("Error posting reply:", error)
      // Remove optimistic reply on error and restore input
      const removeOptimistic = (comments: any[]): any[] => {
        return comments.map(comment => {
          if (comment.id === currentReplyTo) {
            return { ...comment, replies: comment.replies.filter((r: any) => r.id !== optimisticReply.id) }
          } else if (comment.replies && comment.replies.length > 0) {
            return { ...comment, replies: removeOptimistic(comment.replies) }
          }
          return comment
        })
      }
      setComments(prev => removeOptimistic(prev))
      setOptimisticCommentIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(optimisticReply.id)
        return newSet
      })
      setReplyInput(optimisticReply.content)
      setReplyTo(currentReplyTo)
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

  const renderComment = (comment: any, depth: number = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0
    const isExpanded = expandedReplies.has(comment.id)
    const isNested = depth > 0
    const isAuthor = comment.authorId === post.author.id
    
    return (
      <div key={comment.id} className={cn("relative", isNested && "ml-6")}>
        {/* Vertical connecting line for nested replies - positioned correctly */}
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
              {comment.author && comment.author.length > 0 ? comment.author[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {/* Comment bubble with proper background hierarchy and flexible width */}
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
                          onClick={() => {
                            handleDeleteComment(comment.id);
                          }} 
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
            
            {/* Action buttons - Facebook style with timestamp */}
            <div className="flex items-center gap-4 mt-1 text-xs">
              <button 
                onClick={() => handleCommentVote(comment.id, "up")}
                disabled={optimisticCommentIds.has(comment.id)}
                className={cn(
                  "font-semibold transition-colors duration-75 hover:underline",
                  comment.userVote === "up" ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-gray-400",
                  optimisticCommentIds.has(comment.id) && "opacity-50 cursor-not-allowed"
                )}
              >
                {comment.userVote === "up" ? "Unlike" : "Like"}
              </button>
              <button 
                onClick={() => handleCommentVote(comment.id, "down")}
                disabled={optimisticCommentIds.has(comment.id)}
                className={cn(
                  "font-semibold transition-colors duration-75 hover:underline",
                  comment.userVote === "down" ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400",
                  optimisticCommentIds.has(comment.id) && "opacity-50 cursor-not-allowed"
                )}
              >
                {comment.userVote === "down" ? "Remove Dislike" : "Dislike"}
              </button>
              <button 
                onClick={() => handleReply(comment.id)}
                className="font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:underline transition-colors duration-75"
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
                      View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
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
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <input 
                      type="text"
                      placeholder="Write a reply..."
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitReply()}
                      autoFocus
                      className="w-full bg-transparent rounded-full px-4 py-2 text-sm border-none focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Nested Replies - Compact Facebook style */}
            {hasReplies && isExpanded && (
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-2">
                  {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Handle post deletion
  const handleDeletePost = async () => {
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
    
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Post deleted successfully",
        })
        onClose() // Close the modal
        // Optionally, you can call a callback to refresh the parent component
        // if you need to update the post list
        window.location.reload() // Force refresh to update post list
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete post",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    }
  }

  // Check if user can delete this post (author or admin)
  const canDeletePost = user && (user.id === post.author.id || user.role === "ADMIN")

  // Calculate total comment count including replies
  const totalCommentCount = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0)
  }, 0)

  // Early return after all hooks are declared
  if (!open) return null

  const modalContent = (
    <div 
      className="fixed bg-black/80 backdrop-blur-sm z-[99999] animate-in fade-in-0 duration-200 flex items-center justify-center p-2"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation()
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ 
        position: 'fixed',
        top: '64px', // Space for navigation bar (adjust this value based on your nav height)
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <div className={cn(
        "relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-2 zoom-in-95 duration-300 mx-auto my-auto",
        hasImages ? "w-full max-w-3xl h-full max-h-[calc(100vh-120px)] md:flex-row" : "w-full max-w-2xl max-h-[calc(100vh-120px)] min-h-[60vh]"
      )}>
        {hasImages ? (
          // Image post layout - Facebook style with image on left, content on right
          <div className="flex h-full">
            {/* Left side - Images */}
            <div className="flex-1 bg-black relative">
              <img
                src={post.images![currentImageIndex]}
                alt={`Post image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
              
              {/* Image navigation */}
              {post.images!.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Image counter */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    {currentImageIndex + 1} / {post.images!.length}
                  </div>
                </>
              )}
              
              {/* Close button */}
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Right side - Content and Comments */}
            <div className="w-full md:w-[240px] lg:w-[280px] xl:w-[320px] flex flex-col bg-white dark:bg-gray-900 relative z-[1001]">
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between p-2.5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.isAnonymous ? "/placeholder.svg" : post.author.avatar} />
                    <AvatarFallback className="bg-orange-500 text-white">{post.isAnonymous ? "A" : post.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {post.isAnonymous ? "Anonymous" : post.author.name}
                      </h3>
                      {!post.isAnonymous && post.author.isVerified && (
                        <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {!post.isAnonymous && post.author.badges && post.author.badges.length > 0 && (
                      <div className="flex items-center mt-1">
                        <PostBadges 
                          badges={post.author.badges.map ? post.author.badges.map(b => b.badges) : post.author.badges}
                          maxDisplay={2}
                          size="xs"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{post.timeAgo}</span>
                      <span>•</span>
                      <Globe className="w-3 h-3" />
                    </div>
                  </div>
                </div>
                
                {/* Delete Post Button */}
                {canDeletePost && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 w-8 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem 
                        onClick={async () => {
                          await handleDeletePost()
                        }}
                        className="text-red-600 hover:text-red-700 focus:text-red-700 cursor-pointer flex items-center hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Post Content */}
              {post.content && (
                <div className="flex-shrink-0 p-2.5 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-gray-900 dark:text-white text-[15px] leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                  
                  {/* Category Tag */}
                  {post.category && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        #{post.category}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-2 py-1">
                <div className="flex items-center justify-center gap-1">
                  <button 
                    onClick={() => handleDebouncedVote("up")}
                    className={cn(
                      "flex items-center justify-center gap-1 py-3 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 font-medium min-w-[80px]",
                      userVote === "up" 
                        ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950" 
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                      isVoting && "opacity-70 cursor-not-allowed"
                    )}
                    disabled={isVoting}
                  >
                    <ThumbsUp className={cn("w-4 h-4", userVote === "up" && "scale-110")} />
                    <span className="text-sm">{upvotes}</span>
                  </button>
                  <button 
                    onClick={() => handleDebouncedVote("down")}
                    className={cn(
                      "flex items-center justify-center gap-1 py-3 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 font-medium min-w-[80px]",
                      userVote === "down" 
                        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" 
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                      isVoting && "opacity-70 cursor-not-allowed"
                    )}
                    disabled={isVoting}
                  >
                    <ThumbsDown className={cn("w-4 h-4", userVote === "down" && "scale-110")} />
                    <span className="text-sm">{downvotes}</span>
                  </button>
                  <button className="flex items-center justify-center gap-1 py-3 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium min-w-[80px]">
                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {totalCommentCount}
                    </span>
                  </button>
                  <ShareDropdown 
                    post={post}
                    variant="ghost"
                    className="flex items-center justify-center gap-1 py-3 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium min-w-[80px]"
                    showLabel={true}
                    context="modal"
                  />
                </div>
              </div>
              
              {/* Comments Section */}
              <div className="flex-1 overflow-y-auto overflow-x-visible min-h-0 px-2.5 py-2.5 space-y-2.5">
                {comments.length > 0 ? (
                  comments.map((comment) => renderComment(comment, 0))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-2.5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={user?.image || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-orange-500 text-white text-xs">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Write a comment..." 
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                      className="w-full bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 pr-10 text-sm border-none focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-100"
                    />
                    <button 
                      onClick={handleSubmitComment}
                      disabled={!commentInput.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-75"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Text post layout - optimized with reduced spacing
          <>
            {/* Facebook-style Header - Compact */}
            <div className="flex-shrink-0 flex items-center justify-between p-2.5 border-b border-gray-200 dark:border-gray-700">
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
                  </div>
                  {!post.isAnonymous && post.author.badges && post.author.badges.length > 0 && (
                    <div className="flex items-center mt-1">
                      <PostBadges 
                        badges={post.author.badges.map ? post.author.badges.map(b => b.badges) : post.author.badges}
                        maxDisplay={2}
                        size="xs"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{post.timeAgo}</span>
                    <span>•</span>
                    <Globe className="w-3 h-3" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Delete Post Button */}
                {canDeletePost && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-7 w-7 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem 
                        onClick={async () => {
                          await handleDeletePost()
                        }}
                        className="text-red-600 hover:text-red-700 focus:text-red-700 cursor-pointer flex items-center hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {/* Close Button */}
                <button 
                  onClick={onClose} 
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Scrollable Content Area - No top padding */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Post Content - Reduced padding */}
              <div className="p-2.5 pb-2">
                <p className="text-gray-900 dark:text-white text-[15px] leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
                
                {/* Category Tag (subtle) */}
                {post.category && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      #{post.category}
                    </span>
                  </div>
                )}

              </div>

              {/* Action Buttons - Compact */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 py-1 z-10">
                <div className="flex items-center justify-between gap-1">
                  <button 
                    onClick={() => handleDebouncedVote("up")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100 font-medium active:scale-95",
                      userVote === "up" 
                        ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950" 
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    {upvotes > 0 && <span className="text-sm">{upvotes}</span>}
                  </button>
                  <button 
                    onClick={() => handleDebouncedVote("down")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100 font-medium active:scale-95",
                      userVote === "down" 
                        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" 
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <ThumbsDown className="w-5 h-5" />
                    {downvotes > 0 && <span className="text-sm">{downvotes}</span>}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium active:scale-95">
                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm whitespace-nowrap">
                      Comment{totalCommentCount > 0 ? ` ${totalCommentCount}` : ''}
                    </span>
                  </button>
                  <ShareDropdown 
                    post={post}
                    variant="ghost"
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    showLabel={true}
                    context="modal"
                  />
                </div>
              </div>
              
              {/* Comments Section */}
              <div className="px-2.5 py-2.5 space-y-2.5">
                {comments.length > 0 ? (
                  comments.map((comment) => renderComment(comment, 0))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comment Input - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-2.5 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user?.image || "/placeholder-user.jpg"} />
                  <AvatarFallback className="bg-orange-500 text-white text-xs">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">                    <input 
                      type="text" 
                      placeholder="Write a comment..." 
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                      className="w-full bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 pr-10 text-sm border-none focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-100"
                    />
                    <button 
                      onClick={handleSubmitComment}
                      disabled={!commentInput.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-75"
                    >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  // Use portal to render modal at document body level to ensure it covers entire homepage
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
