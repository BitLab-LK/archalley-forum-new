// Activity tracking utility functions
// This helps track user activities across the forum

export interface ActivityData {
  userId: string
  type: 'post_created' | 'post_liked' | 'post_disliked' | 'comment_created' | 'post_shared'
  targetType: 'post' | 'comment'
  targetId: string
  metadata?: Record<string, any>
}

// In a real application, you might want to store activities in a separate table
// For now, we'll rely on the existing data structure (votes, posts, comments) 
// and compute activities on-the-fly in the API

export function getActivityDescription(activity: {
  type: string
  action: string
  target: {
    type: string
    author?: { name: string | null; id: string }
  }
  userId: string
}): string {
  const { type, target, userId } = activity
  const authorName = target.author?.name || "someone"
  const isOwnContent = target.author?.id === userId

  switch (type) {
    case "post_liked":
      return `liked ${isOwnContent ? "their own post" : `${authorName}'s post`}`
    case "post_disliked":
      return `disliked ${isOwnContent ? "their own post" : `${authorName}'s post`}`
    case "comment_created":
      return `commented on ${isOwnContent ? "their own post" : `${authorName}'s post`}`
    case "post_created":
      return "created a post"
    case "post_shared":
      return `shared ${isOwnContent ? "their own post" : `${authorName}'s post`}`
    default:
      return "performed an action"
  }
}

export function getTimeAgo(date: Date | string): string {
  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000)
    return `${months} month${months > 1 ? 's' : ''} ago`
  } else {
    const years = Math.floor(diffInSeconds / 31536000)
    return `${years} year${years > 1 ? 's' : ''} ago`
  }
}

export const ACTIVITY_ICONS = {
  post_liked: "👍",
  post_disliked: "👎", 
  comment_created: "💬",
  post_created: "📝",
  post_shared: "🔄"
} as const

export const ACTIVITY_COLORS = {
  post_liked: "blue",
  post_disliked: "red",
  comment_created: "green", 
  post_created: "purple",
  post_shared: "orange"
} as const
