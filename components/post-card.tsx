"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, MessageCircle, Share2, Flag, Pin, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PostCardProps {
  post: {
    id: string
    author: {
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

export default function PostCard({ post }: PostCardProps) {
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null)
  const [showComments, setShowComments] = useState(false)

  const handleVote = (type: "up" | "down") => {
    setUserVote(userVote === type ? null : type)
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.isAnonymous ? "/placeholder.svg?height=40&width=40" : post.author.avatar} />
              <AvatarFallback>{post.isAnonymous ? "A" : post.author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{post.isAnonymous ? "Anonymous" : post.author.name}</span>
                {!post.isAnonymous && post.author.isVerified && <CheckCircle className="w-4 h-4 text-blue-500" />}
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
            <Badge className={cn("text-xs", `category-${post.category.toLowerCase()}`)}>{post.category}</Badge>
            <Button variant="ghost" size="sm">
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          {shouldUseColoredBackground(post.content, !!post.images?.length) ? (
            <div
              className={cn(
                "rounded-lg p-8 text-white text-center font-semibold leading-relaxed",
                getCategoryColorClass(post.category),
                getTextSizeClass(post.content),
              )}
            >
              {post.content}
            </div>
          ) : (
            <>
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-base leading-relaxed">
                {post.content}
              </p>
              {post.images && post.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={image || "/placeholder.svg"}
                      alt={`Post image ${index + 1}`}
                      className="rounded-lg object-cover w-full h-48"
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Top Comment */}
        {post.topComment && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-sm">{post.topComment.author}</span>
              {post.topComment.isBestAnswer && (
                <Badge variant="default" className="text-xs bg-green-500">
                  Best Answer
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{post.topComment.content}</p>
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote("up")}
                className={cn(userVote === "up" && "text-primary")}
              >
                <ChevronUp className="w-4 h-4" />
                {post.upvotes}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote("down")}
                className={cn(userVote === "down" && "text-red-500")}
              >
                <ChevronDown className="w-4 h-4" />
                {post.downvotes}
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
              <MessageCircle className="w-4 h-4 mr-1" />
              {post.comments} Comments
            </Button>

            <Button variant="ghost" size="sm">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
