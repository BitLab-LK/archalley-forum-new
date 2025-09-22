"use client"

import ImagePostModal from "./image-post-modal"
import TextPostModal from "./text-post-modal"

interface PostModalProps {
  open: boolean
  onClose: () => void
  onCommentAdded?: () => void
  onCommentCountUpdate?: (newCount: number) => void
  onTopCommentVoteChange?: (postId: string, topComment: { id: string, author: { name: string, image?: string }, content: string, upvotes: number, downvotes: number, isBestAnswer: boolean, userVote?: "up" | "down" } | null) => void
  post: {
    id: string
    author: {
      id: string
      name: string
      avatar: string
      isVerified: boolean
      rank: string
      rankIcon: string
      badges?: any[]
    }
    content: string
    category: string
    isAnonymous: boolean
    isPinned: boolean
    upvotes: number
    downvotes: number
    userVote?: "up" | "down" | null
    comments: number
    timeAgo: string
    images?: string[]
    topComment?: {
      author: {
        name: string
        image?: string
      }
      content: string
      upvotes: number
      downvotes: number
      isBestAnswer: boolean
      userVote?: "up" | "down"
    }
  }
  initialImage?: number
}

export default function PostModal({ open, onClose, onCommentAdded, onCommentCountUpdate, onTopCommentVoteChange, post, initialImage }: PostModalProps) {
  if (post.images && post.images.length > 0) {
    return <ImagePostModal open={open} onClose={onClose} onCommentAdded={onCommentAdded} onCommentCountUpdate={onCommentCountUpdate} onTopCommentVoteChange={onTopCommentVoteChange} post={post} initialImage={initialImage} />
  }
  return <TextPostModal open={open} onClose={onClose} onCommentAdded={onCommentAdded} onCommentCountUpdate={onCommentCountUpdate} onTopCommentVoteChange={onTopCommentVoteChange} post={post} />
} 