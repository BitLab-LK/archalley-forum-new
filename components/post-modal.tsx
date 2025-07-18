"use client"

import ImagePostModal from "./image-post-modal"
import TextPostModal from "./text-post-modal"

interface PostModalProps {
  open: boolean
  onClose: () => void
  onCommentAdded?: () => void
  onCommentCountUpdate?: (newCount: number) => void
  onVoteUpdate?: (upvotes: number, downvotes: number, userVote: "up" | "down" | null) => void
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

export default function PostModal({ open, onClose, onCommentAdded, onCommentCountUpdate, onVoteUpdate, post, initialImage }: PostModalProps) {
  if (post.images && post.images.length > 0) {
    return <ImagePostModal open={open} onClose={onClose} onCommentAdded={onCommentAdded} onCommentCountUpdate={onCommentCountUpdate} onVoteUpdate={onVoteUpdate} post={post} initialImage={initialImage} />
  }
  return <TextPostModal open={open} onClose={onClose} onCommentAdded={onCommentAdded} onCommentCountUpdate={onCommentCountUpdate} onVoteUpdate={onVoteUpdate} post={post} />
} 