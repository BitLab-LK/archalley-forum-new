"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, MessageCircle, Share2, Flag, Pin, CheckCircle, Trash2, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"

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

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth()
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null)
  const [showComments, setShowComments] = useState(false)
  const isAuthor = user?.id === post.author.id
  const isAdmin = user?.role === "ADMIN"

  const handleVote = async (type: "up" | "down") => {
    try {
      const response = await fetch(`/api/posts/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      if (response.ok) {
        setUserVote(userVote === type ? null : type)
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

  return (
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
                className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-base leading-relaxed"
                dir="auto"
              >
                {post.content}
              </p>
              {post.images && post.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {post.images.map((image, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Post image ${index + 1}`}
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("up")}
              className={cn(
                "text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-3",
                userVote === "up" && "text-primary"
              )}
            >
              <ChevronUp className="w-4 h-4 mr-1" />
              {post.upvotes}
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
              <ChevronDown className="w-4 h-4 mr-1" />
              {post.downvotes}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
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
  )
}
