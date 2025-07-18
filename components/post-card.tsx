"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Flag, Pin, CheckCircle, Trash2, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePostVote } from "@/hooks/use-post-vote"
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

const getTextSizeClass = (content: string) => {
  const length = content.length
  if (length <= 50) return "text-3xl"
  if (length <= 100) return "text-2xl"
  if (length <= 200) return "text-xl"
  if (length <= 300) return "text-lg"
  return "text-base"
}

const getCategoryColorClass = (category: string) => {
  const colorMap: Record<string, string> = {
    business: "bg-blue-500",
    design: "bg-purple-500",
    career: "bg-green-500",
    construction: "bg-yellow-500",
    academic: "bg-indigo-500",
    informative: "bg-cyan-500",
    other: "bg-gray-500",
  }
  return colorMap[category.toLowerCase()] || "bg-gray-500"
}

const shouldUseColoredBackground = (content: string, hasImages: boolean) => {
  return !hasImages && content.length <= 300
}

export default function PostCard({ post, onDelete, onCommentCountChange }: PostCardProps) {
  const { user, isLoading } = useAuth()
  
  // Use the same voting hook as the modals
  const { userVote, upvotes, downvotes, handleVote } = usePostVote(post.id, null, post.upvotes, post.downvotes)
  
  const isAuthor = user?.id === post.author.id
  const isAdmin = user?.role === "ADMIN"
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  // State to track modal vote updates for better synchronization
  const [modalUpvotes, setModalUpvotes] = useState(upvotes)
  const [modalDownvotes, setModalDownvotes] = useState(downvotes)
  const [commentCount, setCommentCount] = useState(post.comments)

  // Update modal vote state when post card votes change
  useEffect(() => {
    setModalUpvotes(upvotes)
    setModalDownvotes(downvotes)
  }, [upvotes, downvotes, userVote])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></span>
        Loading...
      </div>
    );
  }

  const handleDelete = async () => {
    // Start delete animation immediately
    setIsDeleting(true)
    
    // Use the onDelete prop if provided (which includes proper session handling and confirmation)
    if (onDelete) {
      onDelete()
      return
    }
    
    // Fallback confirmation dialog only if no onDelete prop
    if (!confirm("Are you sure you want to delete this post?")) {
      setIsDeleting(false) // Reset animation if user cancels
      return
    }
    
    // Fallback to direct API call (with proper credentials)
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        setIsDeleting(false) // Reset animation on error
        throw new Error(errorData.error || "Failed to delete post")
      }
      
      // Optionally, you could emit an event or refresh the page
      // For now, we'll just log success
      console.log("Post deleted successfully")
    } catch (error) {
      console.error("Error deleting post:", error)
      setIsDeleting(false) // Reset animation on error
    }
  }

  // Facebook-style image grid logic
  const renderImages = (images: string[]) => {
    const count = images.length
    if (count === 1) {
      return (
        <div className="w-full flex justify-center items-center cursor-pointer" onClick={() => openModal(0)}>
          <div className="relative w-full" style={{ maxHeight: 500 }}>
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
            <div key={i} className="relative w-1/2 aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer" style={{ maxHeight: 350 }} onClick={() => openModal(i)}>
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
        <div className="grid grid-cols-3 gap-2 mt-2" style={{ height: 350 }}>
          <div className="relative col-span-2 row-span-2 h-full rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => openModal(0)}>
            <Image
              src={images[0]}
              alt="Post image 1"
              className="object-cover w-full h-full"
              fill
              sizes="66vw"
            />
          </div>
          <div className="flex flex-col gap-2 h-full">
            <div className="relative flex-1 rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => openModal(1)}>
              <Image
                src={images[1]}
                alt="Post image 2"
                className="object-cover w-full h-full"
                fill
                sizes="33vw"
              />
            </div>
            <div className="relative flex-1 rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => openModal(2)}>
              <Image
                src={images[2]}
                alt="Post image 3"
                className="object-cover w-full h-full"
                fill
                sizes="33vw"
              />
            </div>
          </div>
        </div>
      )
    }
    if (count === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-2 mt-2" style={{ height: 350 }}>
          {images.map((img, i) => (
            <div key={i} className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => openModal(i)}>
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
    // More than 4 images
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-2 mt-2" style={{ height: 350 }}>
        {images.slice(0, 3).map((img, i) => (
          <div key={i} className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => openModal(i)}>
            <Image
              src={img}
              alt={`Post image ${i + 1}`}
              className="object-cover w-full h-full"
              fill
              sizes="50vw"
            />
          </div>
        ))}
        {/* Last image with overlay */}
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => openModal(3)}>
          <Image
            src={images[3]}
            alt={`Post image 4`}
            className="object-cover w-full h-full"
            fill
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">+{count - 4}</span>
          </div>
        </div>
      </div>
    )
  }

  const handleCommentAdded = () => {
    // Update local comment count immediately
    setCommentCount(prev => prev + 1)
    // Also notify parent if callback exists
    onCommentCountChange?.(post.id, commentCount + 1)
  }

  const handleCommentCountUpdate = (newCount: number) => {
    // Update comment count from modal
    setCommentCount(newCount)
    onCommentCountChange?.(post.id, newCount)
  }

  const openModal = (imgIdx = 0) => {
    setModalImageIndex(imgIdx)
    setModalOpen(true)
  }

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
                  {(isAuthor || isAdmin) && (
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
                  onClick={() => handleVote("up")}
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
                  onClick={() => handleVote("down")}
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
          upvotes: modalUpvotes,
          downvotes: modalDownvotes,
          comments: commentCount
        }} 
        initialImage={modalImageIndex} 
        onCommentAdded={handleCommentAdded}
        onCommentCountUpdate={handleCommentCountUpdate}
        onVoteUpdate={(newUpvotes, newDownvotes, newUserVote) => {
          // Update modal vote state when voting happens in the modal
          setModalUpvotes(newUpvotes)
          setModalDownvotes(newDownvotes)
          
          // The Socket.IO synchronization should handle updating the main post card
          // but we can add a small delay to ensure the socket event has time to propagate
          setTimeout(() => {
            console.log("Modal vote update - ensuring sync:", {
              modalVotes: { upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote },
              cardVotes: { upvotes, downvotes, userVote }
            })
          }, 100)
        }}
      />
    </>
  )
}
