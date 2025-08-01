"use client"

import ImagePostModal from "./image-post-modal"
import TextPostModal from "./text-post-modal"

interface PostModalProps {
  open: boolean
  onClose: () => void
  onCommentAdded?: () => void
  onCommentCountUpdate?: (newCount: number) => void
  onVoteChange?: (postId: string, newUpvotes: number, newDownvotes: number, newUserVote: "up" | "down" | null) => void
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
    userVote?: "up" | "down" | null
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

export default function PostModal({ open, onClose, onCommentAdded, onCommentCountUpdate, onVoteChange, post, initialImage }: PostModalProps) {
  if (post.images && post.images.length > 0) {
    return <ImagePostModal open={open} onClose={onClose} onCommentAdded={onCommentAdded} onCommentCountUpdate={onCommentCountUpdate} onVoteChange={onVoteChange} post={post} initialImage={initialImage} />
  }
  return <TextPostModal open={open} onClose={onClose} onCommentAdded={onCommentAdded} onCommentCountUpdate={onCommentCountUpdate} onVoteChange={onVoteChange} post={post} />
} 