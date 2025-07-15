"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Globe, Trash2, MoreHorizontal } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TextPostModalProps {
  open: boolean
  onClose: () => void
  onCommentAdded?: () => void
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
    comments: number
    timeAgo: string
    images?: string[]
    topComment?: {
      author: string
      content: string
      isBestAnswer: boolean
    }
  }
}

export default function TextPostModal({ open, onClose, onCommentAdded, post }: TextPostModalProps) {
  const [comments, setComments] = useState<any[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [replyInput, setReplyInput] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  // Fetch comments when modal opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/comments?postId=${post.id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data.comments)) {
          setComments(data.comments)
          
          // Auto-expand comments that have replies
          const commentsWithReplies = new Set<string>()
          const findCommentsWithReplies = (comments: any[]) => {
            comments.forEach(comment => {
              if (comment.replies && comment.replies.length > 0) {
                commentsWithReplies.add(comment.id)
                // Also recursively check nested replies
                findCommentsWithReplies(comment.replies)
              }
            })
          }
          findCommentsWithReplies(data.comments)
          setExpandedReplies(commentsWithReplies)
        }
      })
      .catch(error => {
        console.error("Error fetching comments:", error)
        setComments([])
      })
      .finally(() => setLoading(false))
  }, [open, post.id])

  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return
    
    setLoading(true)
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
        setCommentInput("")
        // Refresh comments
        const data = await fetch(`/api/comments?postId=${post.id}`).then(res => res.json())
        if (Array.isArray(data.comments)) {
          setComments(data.comments)
        }
        // Notify parent component about new comment
        onCommentAdded?.()
      }
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentVote = async (commentId: string, voteType: "up" | "down") => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType })
      })
      
      if (response.ok) {
        // Update local state optimistically with recursive function
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
        
        setComments(prev => updateVoteRecursively(prev))
      }
    } catch (error) {
      console.error("Error voting on comment:", error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return
    
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
        
        setComments(prev => removeCommentRecursively(prev))
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
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
    
    setLoading(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyInput.trim(),
          postId: post.id,
          parentId: replyTo
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setReplyInput("")
        const currentReplyTo = replyTo
        setReplyTo(null)
        
        // Add reply to local state using recursive function
        const newReply = {
          id: data.comment.id,
          author: data.comment.users.name,
          authorId: data.comment.authorId,
          authorImage: data.comment.users.image,
          content: data.comment.content,
          createdAt: data.comment.createdAt,
          parentId: data.comment.parentId,
          upvotes: 0,
          downvotes: 0,
          userVote: undefined,
          replies: []
        }
        
        setComments(prev => addReplyToComment(prev, currentReplyTo, newReply))
        
        // Auto-expand replies to show the new reply
        setExpandedReplies(prev => new Set(prev).add(currentReplyTo))
        
        onCommentAdded?.()
      }
    } catch (error) {
      console.error("Error posting reply:", error)
    } finally {
      setLoading(false)
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
      <div key={comment.id} className={cn("relative", isNested && "ml-8")}>
        {/* Vertical connecting line for nested replies - positioned correctly */}
        {isNested && depth === 1 && (
          <div className="absolute -left-8 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600" />
        )}
        
        <div className="flex items-start gap-2">
          {/* Horizontal connector for nested replies */}
          {isNested && depth === 1 && (
            <div className="absolute -left-8 top-4 w-6 h-px bg-gray-300 dark:bg-gray-600" />
          )}
          
          <Avatar className={cn("flex-shrink-0", isNested ? "h-6 w-6" : "h-8 w-8")}>
            <AvatarImage src={comment.authorImage || "/placeholder-user.jpg"} />
            <AvatarFallback className="bg-blue-500 text-white text-xs">
              {comment.author ? comment.author[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {/* Comment bubble with proper background hierarchy */}
            <div className={cn(
              "rounded-2xl px-3 py-2 relative",
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Author
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className={cn(
                    "text-gray-800 dark:text-gray-200 leading-relaxed",
                    isNested ? "text-sm" : "text-sm"
                  )}>
                    {comment.content}
                  </p>
                </div>
                {(user?.id === comment.authorId || user?.role === "ADMIN") && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="h-6 w-6 p-1 text-gray-400 hover:text-gray-600 cursor-pointer rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center">
                        <MoreHorizontal className="w-4 h-4" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleDeleteComment(comment.id)} 
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            {/* Action buttons - Facebook style */}
            <div className="flex items-center gap-4 mt-1 text-xs">
              <button 
                onClick={() => handleCommentVote(comment.id, "up")}
                className={cn(
                  "font-semibold transition-colors hover:underline",
                  comment.userVote === "up" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                )}
              >
                Like
              </button>
              <button 
                onClick={() => handleReply(comment.id)}
                className="font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:underline transition-colors"
              >
                Reply
              </button>
              {hasReplies && (
                <button 
                  onClick={() => toggleReplies(comment.id)}
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                >
                  {isExpanded ? "Hide replies" : `${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                </button>
              )}
              <span className="text-gray-400">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {/* Reaction count inline */}
              {comment.upvotes > 0 && (
                <div className="flex items-center ml-auto">
                  <div className="flex items-center -space-x-0.5">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">👍</div>
                    {comment.upvotes > 5 && <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">❤️</div>}
                    {comment.upvotes > 10 && <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">😂</div>}
                  </div>
                  <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">{comment.upvotes}</span>
                </div>
              )}
            </div>

            {/* Reply Input */}
            {replyTo === comment.id && (
              <div className="mt-2">
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={user?.image || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
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
                      disabled={loading}
                      autoFocus
                      className="w-full bg-transparent rounded-full px-4 py-2 text-sm border-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Nested Replies - Compact Facebook style */}
            {hasReplies && isExpanded && (
              <div className="mt-2 space-y-2">
                {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!open || (post.images && post.images.length > 0)) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-[500px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col h-[80vh] min-h-[500px] max-h-[700px]">
        {/* Facebook-style Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.isAnonymous ? "/placeholder.svg" : post.author.avatar} />
              <AvatarFallback className="bg-blue-500 text-white">{post.isAnonymous ? "A" : post.author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {post.isAnonymous ? "Anonymous" : post.author.name}
                </h3>
                {!post.isAnonymous && post.author.isVerified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <span>{post.timeAgo}</span>
                <span>•</span>
                <Globe className="w-3 h-3" />
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Post Content */}
          <div className="p-4">
            <p className="text-gray-900 dark:text-white text-[15px] leading-relaxed whitespace-pre-line">
              {post.content}
            </p>
            
            {/* Category Tag (subtle) */}
            {post.category && (
              <div className="mt-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  #{post.category}
                </span>
              </div>
            )}
            
            {/* Stats */}
            <div className="flex items-center justify-between mt-3 pt-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                {(post.upvotes > 0 || post.downvotes > 0) && (
                  <span className="flex items-center gap-1">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <ThumbsUp className="w-3 h-3 text-white" />
                      </div>
                      {post.downvotes > 0 && (
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center -ml-1">
                          <ThumbsDown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span>{post.upvotes + post.downvotes}</span>
                  </span>
                )}
              </div>
              {post.comments > 0 && (
                <span>{post.comments} comments</span>
              )}
            </div>
          </div>

          {/* Action Buttons - Sticky */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 py-1 z-10">
            <div className="flex">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <ThumbsUp className="w-5 h-5" />
                <span className="font-medium">Like</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Comment</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Share</span>
              </button>
            </div>
          </div>
          
          {/* Comments Section */}
          <div className="px-4 py-3 space-y-6">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : comments.length > 0 ? (
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
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-blue-500 text-white text-xs">U</AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Write a comment..." 
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                disabled={loading}
                className="w-full bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 pr-10 text-sm border-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
              />
              <button 
                onClick={handleSubmitComment}
                disabled={!commentInput.trim() || loading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
  )
}