"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Flag, Pin, CheckCircle, Trash2, MoreHorizontal, ChevronLeft, ChevronRight, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import io from "socket.io-client"
import type { Socket } from "socket.io-client"
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

// Lightbox scaffold
function Lightbox({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex)
  if (!images.length) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
      <button className="absolute top-4 right-4 text-white text-3xl" onClick={onClose}>&times;</button>
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl"
        onClick={() => setIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
        aria-label="Previous image"
      >&#8592;</button>
      <img
        src={images[index]}
        alt="Post image"
        className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-lg"
        draggable={false}
      />
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl"
        onClick={() => setIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
        aria-label="Next image"
      >&#8594;</button>
    </div>
  )
}

let socket: Socket | null = null

// Extracted post header/content rendering for reuse
function PostHeaderAndContent({ post, renderImages }: { post: PostCardProps["post"]; renderImages: (images: string[]) => JSX.Element }) {
  return (
    <>
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
    </>
  )
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user, isLoading } = useAuth()
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null)
  const [showComments, setShowComments] = useState(false)
  const isAuthor = user?.id === post.author.id
  const isAdmin = user?.role === "ADMIN"
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const commentListRef = useRef<HTMLDivElement>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></span>
        Loading...
      </div>
    );
  }

  // Connect to Socket.IO and join post room on modal open
  useEffect(() => {
    if (!modalOpen) return
    if (!socket) {
      socket = io({ 
        path: "/api/socketio",
        auth: {
          userId: user?.id
        }
      })
    }
    socket.emit("join-post", post.id)
    // Listen for new comments
    socket.on("new-comment", (comment: any) => {
      const normalizedComment = {
        ...comment,
        upvotes: comment.upvotes ?? 0,
        downvotes: comment.downvotes ?? 0,
        userVote: comment.userVote ?? undefined,
        replies: comment.replies?.map((r: any) => ({
          ...r,
          upvotes: r.upvotes ?? 0,
          downvotes: r.downvotes ?? 0,
          userVote: r.userVote ?? undefined,
        })) ?? []
      }
      setComments((prev) => [normalizedComment, ...prev])
    })
    // Listen for new replies
    socket.on("new-reply", (reply: any) => {
      const normalizedReply = {
        ...reply,
        upvotes: reply.upvotes ?? 0,
        downvotes: reply.downvotes ?? 0,
        userVote: reply.userVote ?? undefined,
      }
      setComments((prev) => prev.map(c =>
        c.id === reply.parentId
          ? { ...c, replies: [...c.replies, normalizedReply] }
          : c
      ))
    })
    // Listen for vote updates
    socket.on("vote-update", (data: { upvotes: number; downvotes: number; userVote: "UP" | "DOWN" | null }) => {
      post.upvotes = data.upvotes
      post.downvotes = data.downvotes
      setUserVote(data.userVote?.toLowerCase() as "up" | "down" | null)
    })
    // Listen for comment vote updates
    socket.on("comment-vote-update", (data: { commentId: string, upvotes: number, downvotes: number, userVote: "UP" | "DOWN" | null }) => {
      setComments(prev => prev.map(c =>
        c.id === data.commentId
          ? { ...c, upvotes: data.upvotes, downvotes: data.downvotes, userVote: data.userVote?.toLowerCase() as "up" | "down" | undefined }
          : {
              ...c,
              replies: c.replies?.map((r: any) =>
                r.id === data.commentId
                  ? { ...r, upvotes: data.upvotes, downvotes: data.downvotes, userVote: data.userVote?.toLowerCase() as "up" | "down" | undefined }
                  : r
              )
            }
      ))
    })
    return () => {
      socket?.off("new-comment")
      socket?.off("new-reply")
      socket?.off("vote-update")
      socket?.off("comment-vote-update")
    }
  }, [modalOpen, post.id, user?.id])

  // Fetch comments from backend on modal open
  useEffect(() => {
    if (!modalOpen) return
    fetch(`/api/comments?postId=${post.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.comments)) {
          setComments(
            data.comments.map((c: any) => ({
              ...c,
              upvotes: c.upvotes ?? 0,
              downvotes: c.downvotes ?? 0,
              replies: c.replies?.map((r: any) => ({
                ...r,
                upvotes: r.upvotes ?? 0,
                downvotes: r.downvotes ?? 0,
              })) ?? []
            }))
          )
        }
      })
  }, [modalOpen, post.id])

  const handleVote = async (type: "up" | "down") => {
    if (!user) {
      alert("Please log in to vote on posts")
      return
    }
    try {
      const response = await fetch(`/api/posts/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type.toUpperCase() }),
      })
      const data = await response.json()
      if (response.ok) {
        // Update UI immediately
        if (userVote === type) {
          // Remove vote
          setUserVote(null)
          if (type === "up") post.upvotes--
          else post.downvotes--
        } else if (userVote) {
          // Change vote
          if (type === "up") {
            post.upvotes++
            post.downvotes--
          } else {
            post.upvotes--
            post.downvotes++
          }
          setUserVote(type)
        } else {
          // New vote
          setUserVote(type)
          if (type === "up") post.upvotes++
          else post.downvotes++
        }
        // Emit vote update via socket
        socket?.emit("vote", { postId: post.id, type: type.toUpperCase() })
      }
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return
    
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          isAdmin: isAdmin
        }),
      })
      if (response.ok && onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error("Error deleting post:", error)
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

  // Add comment or reply (API + real-time)
  const handleAddComment = async () => {
    if (!commentInput.trim()) return
    setPosting(true)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          content: commentInput,
          parentId: replyTo || undefined
        })
      })
      const data = await res.json()
      if (res.ok && data.comment) {
        // Normalize the comment object for real-time update
        const normalizedComment = {
          ...data.comment,
          upvotes: 0,
          downvotes: 0,
          userVote: undefined,
          replies: data.comment.replies?.map((r: any) => ({
            ...r,
            upvotes: 0,
            downvotes: 0,
            userVote: undefined,
          })) ?? []
        }
        // Emit via socket for real-time update
        if (replyTo) {
          socket?.emit("new-reply", { postId: post.id, reply: { ...normalizedComment, parentId: replyTo } })
        } else {
          socket?.emit("new-comment", { postId: post.id, comment: normalizedComment })
          post.comments += 1
        }
        setCommentInput("")
        setReplyTo(null)
        setTimeout(() => {
          if (commentListRef.current) commentListRef.current.scrollTop = 0
        }, 100)
      }
    } finally {
      setPosting(false)
    }
  }

  // Add the handleCommentVote function in the component, similar to handleVote for posts
  const handleCommentVote = async (commentId: string, type: "up" | "down") => {
    if (!user) return;
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        let upvotes = c.upvotes ?? 0;
        let downvotes = c.downvotes ?? 0;
        let newUserVote: "up" | "down" | undefined = c.userVote;
        if (c.userVote === type) {
          // Remove vote
          newUserVote = undefined;
          if (type === "up") upvotes--;
          else downvotes--;
        } else if (c.userVote) {
          // Switch vote
          if (type === "up") {
            upvotes++;
            downvotes--;
          } else {
            upvotes--;
            downvotes++;
          }
          newUserVote = type;
        } else {
          // New vote
          newUserVote = type;
          if (type === "up") upvotes++;
          else downvotes++;
        }
        return { ...c, upvotes, downvotes, userVote: newUserVote };
      }
      return {
        ...c,
        replies: c.replies?.map((r: any) => {
          if (r.id === commentId) {
            let upvotes = r.upvotes ?? 0;
            let downvotes = r.downvotes ?? 0;
            let newUserVote: "up" | "down" | undefined = r.userVote;
            if (r.userVote === type) {
              newUserVote = undefined;
              if (type === "up") upvotes--;
              else downvotes--;
            } else if (r.userVote) {
              if (type === "up") {
                upvotes++;
                downvotes--;
              } else {
                upvotes--;
                downvotes++;
              }
              newUserVote = type;
            } else {
              newUserVote = type;
              if (type === "up") upvotes++;
              else downvotes++;
            }
            return { ...r, upvotes, downvotes, userVote: newUserVote };
          }
          return r;
        })
      };
    }));
    try {
      await fetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: type })
      });
      socket?.emit("comment-vote", { commentId, postId: post.id, type: type.toUpperCase() });
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const openModal = (imgIdx = 0) => {
    setModalImageIndex(imgIdx)
    setModalOpen(true)
  }

  return (
    <>
      <Card className="mb-4 shadow-sm border-0">
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
                  <span>{post.upvotes}</span>
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
                  <span>{post.downvotes}</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal(0)}
                className="text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-3"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {post.comments} Comments
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
      {/* Facebook-style Post Popup Modal */}
      <PostModal open={modalOpen} onClose={() => setModalOpen(false)} post={post} initialImage={modalImageIndex} />
    </>
  )
}
