"use client"

import { useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface TextPostModalProps {
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
}

export default function TextPostModal({ open, onClose, post }: TextPostModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open || (post.images && post.images.length > 0)) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 md:p-8">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800 h-full" style={{ fontFamily: 'Roboto, Helvetica, Arial, sans-serif', maxHeight: '90vh' }}>
        {/* Header (sticky) */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 px-4 pt-4 pb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.isAnonymous ? "/placeholder.svg" : post.author.avatar} />
            <AvatarFallback>{post.isAnonymous ? "A" : post.author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{post.isAnonymous ? "Anonymous" : post.author.name}</span>
              <span className="text-xs text-gray-500">• {post.timeAgo}</span>
              <Globe className="w-4 h-4 text-gray-400 ml-1" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {!post.isAnonymous && (
                <Badge variant="secondary" className="text-xs">
                  {post.author.rank}
                </Badge>
              )}
            </div>
          </div>
          <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-light focus:outline-none">&times;</button>
        </div>
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ minHeight: 0 }}>
          {/* Post Text */}
          <div className="text-gray-900 dark:text-gray-100 text-base leading-relaxed whitespace-pre-line" style={{ fontFamily: 'inherit' }}>{post.content}</div>
          {/* Action Buttons */}
          <div className="flex gap-2 w-full justify-between border-t border-b border-gray-100 dark:border-gray-800 py-3 bg-white dark:bg-gray-900 sticky top-0 z-5">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-200 font-medium text-sm focus:outline-none">
              <ThumbsUp className="w-5 h-5" /> Like
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-200 font-medium text-sm focus:outline-none">
              <ThumbsDown className="w-5 h-5" /> Dislike
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-200 font-medium text-sm focus:outline-none">
              <MessageCircle className="w-5 h-5" /> Comment
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-200 font-medium text-sm focus:outline-none">
              <Share2 className="w-5 h-5" /> Share
            </button>
          </div>
          {/* Comment List */}
          <div className="flex flex-col gap-3">
            {/* Example comments, replace with real data */}
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">JohnSmith</span>
                  <span className="text-xs text-gray-400">3h ago</span>
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">Great point! I was thinking the same thing.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">AliceDoe</span>
                  <span className="text-xs text-gray-400">2h ago</span>
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">Could you elaborate on the last part? I'm curious to hear more.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>BD</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">BobDylan</span>
                  <span className="text-xs text-gray-400">1h ago</span>
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">This is a really insightful perspective. Thanks for sharing!</div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer (sticky) */}
        <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <input type="text" placeholder="Write a comment..." className="flex-1 rounded-full border border-gray-200 dark:border-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button className="text-primary hover:text-primary-dark p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 20v-3a2 2 0 012-2h12a2 2 0 012 2v3M16 8a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
} 