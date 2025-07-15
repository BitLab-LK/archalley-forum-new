"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, ChevronLeft, ChevronRight, Globe, Trash2, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { usePostVote } from "@/hooks/use-post-vote"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ImagePostModalProps {
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
  initialImage?: number
}

export default function ImagePostModal({ open, onClose, onCommentAdded, post, initialImage = 0 }: ImagePostModalProps) {
  const [carouselIndex, setCarouselIndex] = useState(initialImage)
  const [comments, setComments] = useState<any[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [replyInput, setReplyInput] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const images = post.images || []
  const hasImages = images.length > 0
  const { userVote, upvotes, downvotes, handleVote } = usePostVote(post.id, null, post.upvotes, post.downvotes)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  useEffect(() => { setCarouselIndex(initialImage) }, [initialImage, open])

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
        }
      })
      .catch(error => {
        console.error("Error fetching comments:", error)
        setComments([])
      })
      .finally(() => setLoading(false))
  }, [open, post.id])

  const handleCommentClick = () => {
    commentInputRef.current?.focus()
    commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/posts/" + post.id)
      alert("Post link copied to clipboard!")
    } catch {
      alert("Failed to copy link")
    }
  }

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
        setReplyTo(null)
        
        // Add reply to local state
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
          userVote: undefined
        }
        
        setComments(prev => prev.map(comment => 
          comment.id === replyTo 
            ? { ...comment, replies: [...(comment.replies || []), newReply] }
            : comment
        ))
        
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

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
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
    
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType })
      })
      
      if (response.ok) {
        // Update local state optimistically
        setComments(prev => prev.map(comment => {
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
            replies: comment.replies?.map((reply: any) => {
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
        }))
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
        // Remove comment from local state
        setComments(prev => prev.filter(comment => {
          // Remove top-level comment
          if (comment.id === commentId) return false
          
          // Remove from replies
          comment.replies = comment.replies?.filter((reply: any) => reply.id !== commentId) || []
          return true
        }))
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  if (!open || !hasImages) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4">
      <div className="relative h-[80vh] min-h-[500px] max-h-[700px] w-full max-w-6xl flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
        {/* Left: Image Carousel */}
        <div className="flex-1 flex items-center justify-center bg-black relative min-h-[400px]">
          {hasImages && (
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <div className="w-full h-full transition-transform duration-500 ease-in-out flex items-center justify-center">
                  <Image
                    src={images[carouselIndex]}
                    alt={`Post image ${carouselIndex + 1}`}
                    className="object-contain max-h-[80vh] max-w-full"
                    width={800}
                    height={1200}
                    priority
                  />
                </div>
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                      onClick={() => setCarouselIndex(i => (i > 0 ? i - 1 : images.length - 1))}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
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
        <div className="w-full md:w-[400px] flex flex-col bg-white dark:bg-gray-900 h-full max-h-[700px]">
          {/* Header - Fixed */}
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
                  {(upvotes > 0 || downvotes > 0) && (
                    <span className="flex items-center gap-1">
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <ThumbsUp className="w-3 h-3 text-white" />
                        </div>
                        {downvotes > 0 && (
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center -ml-1">
                            <ThumbsDown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span>{upvotes + downvotes}</span>
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
                <button 
                  onClick={() => handleVote("up")} 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium",
                    userVote === "up" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span>Like</span>
                </button>
                <button 
                  onClick={handleCommentClick} 
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Comment</span>
                </button>
                <button 
                  onClick={handleShare} 
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="px-4 py-3 space-y-3">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.authorImage || "/placeholder-user.jpg"} />
                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                        {comment.author ? comment.author[0].toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {comment.author || "Anonymous"}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        {(user?.id === comment.authorId || user?.role === "ADMIN") && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 cursor-pointer rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center">
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
                      <p className="text-sm text-gray-800 dark:text-gray-200">{comment.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button 
                          onClick={() => handleCommentVote(comment.id, "up")} 
                          className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                            comment.userVote === "up" 
                              ? "text-blue-600 dark:text-blue-400" 
                              : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          {comment.upvotes > 0 && <span>{comment.upvotes}</span>}
                          Like
                        </button>
                        <button 
                          onClick={() => handleReply(comment.id)} 
                          className="text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        >
                          Reply
                        </button>
                        {comment.upvotes > 0 && (
                          <span className="text-xs text-gray-500">
                            {comment.upvotes} {comment.upvotes === 1 ? 'like' : 'likes'}
                          </span>
                        )}
                      </div>

                      {/* Replies Section - Nested Comments */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-2">
                          {comment.replies.map((reply: any) => (
                            <div key={reply.id} className="flex items-start gap-3 mt-2">
                              <Avatar className="h-7 w-7 flex-shrink-0">
                                <AvatarImage src={reply.authorImage || "/placeholder-user.jpg"} />
                                <AvatarFallback className="bg-blue-500 text-white text-xs">
                                  {reply.author ? reply.author[0].toUpperCase() : "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                      {reply.author || "Anonymous"}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimeAgo(reply.createdAt)}
                                    </span>
                                  </div>
                                  {(user?.id === reply.authorId || user?.role === "ADMIN") && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <div className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 cursor-pointer rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center">
                                          <MoreHorizontal className="w-4 h-4" />
                                        </div>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteComment(reply.id)} 
                                          className="text-red-600 focus:text-red-600 cursor-pointer"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-200">{reply.content}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <button 
                                    onClick={() => handleCommentVote(reply.id, "up")} 
                                    className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                                      reply.userVote === "up" 
                                        ? "text-blue-600 dark:text-blue-400" 
                                        : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    }`}
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                    {reply.upvotes > 0 && <span>{reply.upvotes}</span>}
                                    Like
                                  </button>
                                  <button 
                                    onClick={() => handleReply(comment.id)} 
                                    className="text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                  >
                                    Reply
                                  </button>
                                  {reply.upvotes > 0 && (
                                    <span className="text-xs text-gray-500">
                                      {reply.upvotes} {reply.upvotes === 1 ? 'like' : 'likes'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input - Conditional rendering */}
                      {replyTo === comment.id && (
                        <div className="mt-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src="/placeholder-user.jpg" />
                              <AvatarFallback className="bg-blue-500 text-white text-xs">U</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <textarea 
                                placeholder="Write a reply..." 
                                value={replyInput}
                                onChange={(e) => setReplyInput(e.target.value)}
                                disabled={loading}
                                autoFocus
                                className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm border-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 resize-none min-h-[60px]"
                              />
                              <div className="flex gap-2 mt-2">
                                <button 
                                  onClick={handleSubmitReply}
                                  disabled={!replyInput.trim() || loading}
                                  className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {loading ? "Posting..." : "Reply"}
                                </button>
                                <button 
                                  onClick={() => {
                                    setReplyTo(null)
                                    setReplyInput("")
                                  }}
                                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
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
                  ref={commentInputRef}
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
                  {loading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} strokeLinecap="round" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
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