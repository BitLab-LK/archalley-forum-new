"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, MessageCircle, Globe, Trash2, MoreHorizontal, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { useGlobalVoteState } from "@/lib/vote-sync"
import { activityEventManager } from "@/lib/activity-events"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ShareDropdown from "@/components/share-dropdown"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface Post {
  id: string
  author: {
    id: string
    name: string
    avatar: string
    isVerified: boolean
    badges?: any[]
  }
  content: string
  category: string
  categories?: any
  isAnonymous: boolean
  isPinned: boolean
  upvotes: number
  downvotes: number
  userVote?: "up" | "down" | null
  comments: number
  timeAgo: string
  images?: string[]
  topComment?: any
}

interface PostDetailPageProps {
  post: Post
}

interface Comment {
  id: string
  author: string
  authorId: string
  authorImage: string
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

export default function PostDetailPage({ post }: PostDetailPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { confirm } = useConfirmDialog()
  const { toast } = useToast()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [, setOptimisticCommentIds] = useState<Set<string>>(new Set()) // eslint-disable-line
  const [isVoting, setIsVoting] = useState(false)
  
  const previousCommentCount = useRef<number>(0)
  
  const { voteState, updateVote } = useGlobalVoteState(post.id, {
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    userVote: post.userVote || null
  })
  
  const { upvotes, downvotes, userVote } = voteState
  
  const hasImages = post.images && post.images.length > 0
  
  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/comments?postId=${post.id}`, {
          cache: 'no-cache'
        })
        
        if (res.ok) {
          const data = await res.json()
          setComments(data.comments || [])
        }
      } catch (error) {
        console.error("Error fetching comments:", error)
      }
    }
    
    fetchComments()
  }, [post.id])
  
  // Update comment count
  useEffect(() => {
    const totalComments = comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0)
    }, 0)
    
    if (totalComments !== previousCommentCount.current) {
      previousCommentCount.current = totalComments
    }
  }, [comments])
  
  // Vote handler
  const handleVote = async (type: "up" | "down") => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on posts",
        variant: "destructive"
      })
      return
    }
    
    if (isVoting) return
    
    setIsVoting(true)
    
    const newUpvotes = type === "up" ? upvotes + 1 : Math.max(0, upvotes - 1)
    const newDownvotes = type === "down" ? downvotes + 1 : Math.max(0, downvotes - 1)
    const newUserVote = userVote === type ? null : type
    
    updateVote({
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: newUserVote
    })
    
    try {
      const response = await fetch(`/api/posts/${post.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      
      if (!response.ok) {
        updateVote({
          upvotes,
          downvotes,
          userVote
        })
      }
    } catch (error) {
      console.error("Error voting:", error)
      updateVote({
        upvotes,
        downvotes,
        userVote
      })
    } finally {
      setIsVoting(false)
    }
  }
  
  // Comment submission
  const handleSubmitComment = async () => {
    if (!commentInput.trim() || !user) return
    
    const optimisticComment = {
      id: `comment-${Date.now()}`,
      author: user.name || "Anonymous",
      authorId: user.id || "",
      authorImage: user.image || "/archalley-pro-pic.png",
      content: commentInput.trim(),
      createdAt: new Date().toISOString(),
      parentId: null,
      upvotes: 0,
      downvotes: 0,
      userVote: undefined,
      replies: []
    }
    
    setOptimisticCommentIds(prev => new Set(prev).add(optimisticComment.id))
    setComments(prev => [...prev, optimisticComment])
    setCommentInput("")
    
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: optimisticComment.content,
          postId: post.id
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setComments(prev => prev.map(c => 
          c.id === optimisticComment.id 
            ? { ...data.comment, replies: [] }
            : c
        ))
        setOptimisticCommentIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(optimisticComment.id)
          return newSet
        })
        
        if (user.id) {
          activityEventManager.emitComment(user.id, post.id, data.comment.id)
        }
      } else {
        setComments(prev => prev.filter(c => c.id !== optimisticComment.id))
        setOptimisticCommentIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(optimisticComment.id)
          return newSet
        })
        toast({
          title: "Error",
          description: "Failed to post comment",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id))
      setOptimisticCommentIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(optimisticComment.id)
        return newSet
      })
    }
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
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    return `${Math.floor(diffInSeconds / 86400)}d`
  }
  
  const renderComment = (comment: Comment, depth: number = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0
    const isExpanded = expandedReplies.has(comment.id)
    const isNested = depth > 0
    const isAuthor = comment.authorId === post.author.id
    
    return (
      <div key={comment.id} className={cn("relative", isNested && "ml-6")}>
        {isNested && depth === 1 && (
          <div className="absolute -left-6 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600" />
        )}
        
        <div className="flex items-start gap-2">
          {isNested && depth === 1 && (
            <div className="absolute -left-6 top-4 w-4 h-px bg-gray-300 dark:bg-gray-600" />
          )}
          
          <Avatar className={cn("flex-shrink-0", isNested ? "h-6 w-6" : "h-8 w-8")}>
            <AvatarImage src={comment.authorImage || "/archalley-pro-pic.png"} />
            <AvatarFallback className="bg-orange-500 text-white text-xs">
              {comment.author && comment.author.length > 0 ? comment.author[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className={cn(
              "rounded-2xl px-3 py-2 relative inline-block max-w-fit",
              depth === 0 && "bg-gray-100 dark:bg-gray-800",
              depth === 1 && "bg-gray-50 dark:bg-gray-750"
            )}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {comment.author || "Anonymous"}
                  </span>
                  {isAuthor && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      Author
                    </span>
                  )}
                </div>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed break-words text-sm">
                  {comment.content}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-1 text-xs">
              <span className="text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
              {hasReplies && (
                <button 
                  onClick={() => toggleReplies(comment.id)}
                  className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  {isExpanded ? 'Hide replies' : `View ${comment.replies.length} replies`}
                </button>
              )}
            </div>

            {hasReplies && isExpanded && (
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-2">
                  {comment.replies.map((reply) => renderComment(reply, depth + 1))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  const canDeletePost = user && (user.id === post.author.id || user.role === "ADMIN" || user.role === "SUPER_ADMIN")
  
  const handleDeletePost = async () => {
    const confirmed = await confirm({
      title: "Delete Post",
      description: "Are you sure you want to delete this post? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    })
    
    if (!confirmed) return
    
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Post deleted successfully",
        })
        router.push('/forum')
      } else {
        toast({
          title: "Error",
          description: "Failed to delete post",
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
  
  const totalCommentCount = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0)
  }, 0)
  
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
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>
      
      {/* Post Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.isAnonymous ? "/archalley-pro-pic.png" : post.author.avatar} />
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
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <span>{post.timeAgo}</span>
                <span>•</span>
                <Globe className="w-3 h-3" />
              </div>
            </div>
          </div>
          
          {canDeletePost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 p-1 text-gray-400 hover:text-gray-600 cursor-pointer rounded-full hover:bg-gray-200 flex items-center justify-center">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem 
                  onClick={handleDeletePost}
                  className="text-red-600 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Images Carousel */}
        {hasImages && (
          <div className="relative bg-black w-full aspect-square max-h-[600px]">
            <Image
              src={post.images![currentImageIndex]}
              alt={`Post image ${currentImageIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
            
            {post.images!.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {post.images!.length}
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
          
          {post.category && (
            <div className="mt-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                #{post.category}
              </span>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleVote("up")}
                disabled={isVoting}
                className={cn(
                  "flex items-center gap-2 text-gray-600 hover:text-primary transition-colors",
                  userVote === "up" && "text-primary",
                  isVoting && "opacity-70"
                )}
              >
                <ThumbsUp className="w-5 h-5" />
                <span>{upvotes}</span>
              </button>
              <button
                onClick={() => handleVote("down")}
                disabled={isVoting}
                className={cn(
                  "flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors",
                  userVote === "down" && "text-red-500",
                  isVoting && "opacity-70"
                )}
              >
                <ThumbsDown className="w-5 h-5" />
                <span>{downvotes}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span>{totalCommentCount}</span>
              </div>
            </div>
            
            <ShareDropdown post={post} variant="ghost" />
          </div>
        </div>
        
        {/* Comments */}
        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {comments.map((comment) => renderComment(comment))}
          
          {user && (
            <div className="flex items-start gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user.image || "/archalley-pro-pic.png"} />
                <AvatarFallback className="bg-orange-500 text-white text-xs">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                <input 
                  type="text"
                  placeholder="Write a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                  className="w-full bg-transparent rounded-full px-4 py-2 text-sm border-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

