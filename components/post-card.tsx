"use client"

import { useState, useCallback, useMemo, memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Flag, Pin, CheckCircle, Trash2, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePostSync } from "@/hooks/use-post-sync"
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
    comments: number
    timeAgo: string
    images?: string[]
    topComment?: {
      author: string
      content: string
      isBestAnswer: boolean
    }
  }
  onDelete?: () => void
  onCommentCountChange?: (postId: string, newCount: number) => void
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

const PostCard = memo(function PostCard({ post, onDelete, onCommentCountChange }: PostCardProps) {
  const { user, isLoading } = useAuth()
  
  // Memoized computed values
  const isAuthor = useMemo(() => user?.id === post.author.id, [user?.id, post.author.id])
  const isAdmin = useMemo(() => user?.role === "ADMIN", [user?.role])
  const canDelete = useMemo(() => isAuthor || isAdmin, [isAuthor, isAdmin])
  
  // Use the new synchronized voting hook for instant updates
  const { userVote, upvotes, downvotes, handleVote, syncState } = usePostSync(post.id, post.upvotes, post.downvotes)
  
  // Local state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments)

  // No need for separate modal vote states - everything syncs instantly now!

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
      
      console.log("Post deleted successfully")
    } catch (error) {
      console.error("Error deleting post:", error)
      setIsDeleting(false)
    }
  }, [onDelete, post.id])

  const handleCommentAdded = useCallback(() => {
    const newCount = commentCount + 1
    setCommentCount(newCount)
    onCommentCountChange?.(post.id, newCount)
  }, [commentCount, onCommentCountChange, post.id])

  const handleCommentCountUpdate = useCallback((newCount: number) => {
    setCommentCount(newCount)
    onCommentCountChange?.(post.id, newCount)
  }, [onCommentCountChange, post.id])

  const openModal = useCallback((imgIdx: number = 0) => {
    setModalImageIndex(imgIdx)
    setModalOpen(true)
  }, [])

  const handleModalVoteUpdate = useCallback((newUpvotes: number, newDownvotes: number, newUserVote: "up" | "down" | null) => {
    // Use the instant sync function for immediate updates across all instances
    syncState(newUpvotes, newDownvotes, newUserVote)
    
    console.log("Modal vote update - instant sync:", {
      newVotes: { upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote }
    })
  }, [syncState])

  // Enhanced vote handler that syncs with modals
  const handleCardVote = useCallback(async (type: "up" | "down") => {
    await handleVote(type)
  }, [handleVote])
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
          <div className="relative w-full max-h-[500px]">
            <Image
              src={images[0]}
              alt="Post image"
              className="object-contain rounded-lg w-full h-auto max-h-[500px]"
              fill
              sizes="100vw"
              priority
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
                    "text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-3",
                    userVote === "up" && "text-primary"
                  )}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  <span>{upvotes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCardVote("down")}
                  className={cn(
                    "text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded-full px-3",
                    userVote === "down" && "text-red-500"
                  )}
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  <span>{downvotes}</span>
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
          {post.topComment && (
            <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-sm">{post.topComment.author}</span>
                {post.topComment.isBestAnswer && (
                  <Badge variant="default" className="text-xs bg-green-500">
                    Best Answer
                  </Badge>
                )}
              </div>
              <p 
                className="text-sm text-gray-700 dark:text-gray-300"
                dir="auto"
              >
                {post.topComment.content}
              </p>
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
          upvotes: upvotes,
          downvotes: downvotes,
          comments: commentCount
        }} 
        initialImage={modalImageIndex} 
        onCommentAdded={handleCommentAdded}
        onCommentCountUpdate={handleCommentCountUpdate}
        onVoteUpdate={handleModalVoteUpdate}
      />
    </>
  )
})

export default PostCard
