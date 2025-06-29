"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, ChevronLeft, ChevronRight, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { usePostVote } from "@/hooks/use-post-vote"

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

interface ImagePostModalProps {
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

export default function ImagePostModal({ open, onClose, post, initialImage = 0 }: ImagePostModalProps) {
  const [carouselIndex, setCarouselIndex] = useState(initialImage)
  const images = post.images || []
  const hasImages = images.length > 0
  const { userVote, upvotes, downvotes, handleVote } = usePostVote(post.id, null, post.upvotes, post.downvotes)
  const commentInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setCarouselIndex(initialImage) }, [initialImage, open])

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

  if (!open || !hasImages) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 md:p-8">
      <div className="relative max-h-[90vh] w-[80%] w-full flex flex-col md:flex-row bg-white rounded-xl shadow-2xl overflow-hidden" style={{ fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>
        {/* Left: Image Carousel */}
        <div className={cn("flex-1 flex items-center justify-center bg-gray-100 min-h-[400px] aspect-[2/3] relative", hasImages ? "max-w-[50%]" : "hidden md:block")}
          style={{ minWidth: 0 }}>
          {hasImages && (
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <div
                  className="w-full h-full transition-transform duration-500 ease-in-out flex items-center justify-center"
                  style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                >
                  {images.map((img, i) => (
                    <div key={i} className="w-full h-full flex-shrink-0 flex items-center justify-center">
                      <Image
                        src={img}
                        alt={`Post image ${i + 1}`}
                        className="object-contain rounded-lg max-h-[80vh] max-w-full bg-gray-200"
                        width={800}
                        height={1200}
                        style={{ maxHeight: '80vh', maxWidth: '100%' }}
                        priority={i === carouselIndex}
                      />
                    </div>
                  ))}
                </div>
                {/* Left Arrow */}
                {images.length > 1 && (
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full shadow p-2 transition"
                    onClick={() => setCarouselIndex(i => (i > 0 ? i - 1 : images.length - 1))}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                {/* Right Arrow */}
                {images.length > 1 && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full shadow p-2 transition"
                    onClick={() => setCarouselIndex(i => (i < images.length - 1 ? i + 1 : 0))}
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Right: Post Content (copied from previous modal right column) */}
        <div className="flex-1 min-w-0 flex flex-col bg-white max-w-full md:max-w-[50%] h-full relative" style={{ maxHeight: '90vh' }}>
          {/* Header (sticky) */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex items-center gap-3 px-6 pt-6 pb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.isAnonymous ? "/placeholder.svg" : post.author.avatar} />
              <AvatarFallback>{post.isAnonymous ? "A" : post.author.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{post.isAnonymous ? "Anonymous" : post.author.name}</span>
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
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-700 text-2xl font-light focus:outline-none">&times;</button>
          </div>
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4" style={{ minHeight: 0 }}>
            {/* Post Text */}
            <div className="text-gray-900 text-base leading-relaxed whitespace-pre-line" style={{ fontFamily: 'inherit' }}>{post.content}</div>
            {/* Action Buttons */}
            <div className="flex gap-2 w-full justify-between border-t border-b border-gray-100 py-3 bg-white sticky top-0 z-5">
              <button onClick={() => handleVote("up")} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-medium text-sm focus:outline-none", userVote === "up" ? "text-primary" : "text-gray-700") }>
                <ThumbsUp className="w-5 h-5" /> Like <span>{upvotes}</span>
              </button>
              <button onClick={() => handleVote("down")} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-medium text-sm focus:outline-none", userVote === "down" ? "text-red-500" : "text-gray-700") }>
                <ThumbsDown className="w-5 h-5" /> Dislike <span>{downvotes}</span>
              </button>
              <button onClick={handleCommentClick} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700 font-medium text-sm focus:outline-none">
                <MessageCircle className="w-5 h-5" /> Comment
              </button>
              <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700 font-medium text-sm focus:outline-none">
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
                <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">JohnSmith</span>
                    <span className="text-xs text-gray-400">3h ago</span>
                  </div>
                  <div className="text-sm text-gray-800">Great point! I was thinking the same thing.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">AliceDoe</span>
                    <span className="text-xs text-gray-400">2h ago</span>
                  </div>
                  <div className="text-sm text-gray-800">Could you elaborate on the last part? I'm curious to hear more.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>BD</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">BobDylan</span>
                    <span className="text-xs text-gray-400">1h ago</span>
                  </div>
                  <div className="text-sm text-gray-800">This is a really insightful perspective. Thanks for sharing!</div>
                </div>
              </div>
            </div>
          </div>
          {/* Footer (sticky) */}
          <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <input ref={commentInputRef} type="text" placeholder="Write a comment..." className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <button className="text-primary hover:text-primary-dark p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20v-3a2 2 0 012-2h12a2 2 0 012 2v3M16 8a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 