"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, ChevronLeft, ChevronRight, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import ImagePostModal from "./image-post-modal"
import TextPostModal from "./text-post-modal"

// Utility functions (copy from post-card.tsx)
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

interface PostModalProps {
  open: boolean
  onClose: () => void
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

export default function PostModal({ open, onClose, post, initialImage }: PostModalProps) {
  if (post.images && post.images.length > 0) {
    return <ImagePostModal open={open} onClose={onClose} post={post} initialImage={initialImage} />
  }
  return <TextPostModal open={open} onClose={onClose} post={post} />
} 