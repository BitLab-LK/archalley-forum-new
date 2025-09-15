import { prisma } from "@/lib/prisma"
import HomePageInteractive from "./homepage-interactive"

interface Post {
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
  categories?: {    // Primary category object
    id: string
    name: string
    color: string
    slug: string
  }
  allCategories?: Array<{  // Multiple categories
    id: string
    name: string
    color: string
    slug: string
  }>
  aiCategories?: string[]  // AI-suggested category names
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
  }
}

interface Pagination {
  total: number
  pages: number
  currentPage: number
  limit: number
}

// Server-side function to get initial posts
async function getInitialPosts(): Promise<{ posts: Post[], pagination: Pagination }> {
  try {
    const limit = 10
    const skip = 0
    
    // Get posts with all necessary relations (matching the API structure)
    const [posts, total, voteCounts, attachments] = await Promise.all([
      prisma.post.findMany({
        take: limit,
        skip: skip,
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          users: {
            select: {
              id: true,
              name: true,
              image: true,
              isVerified: true,
              userBadges: {
                take: 3,
                orderBy: { earnedAt: 'desc' },
                include: {
                  badges: true
                }
              }
            }
          },
          categories: true,  // Primary category (full object)
          _count: {
            select: { Comment: true }
          }
        }
      }),
      
      // Get total count
      prisma.post.count(),
      
      // Get vote counts for posts
      prisma.votes.groupBy({
        by: ['postId', 'type'],
        where: {
          postId: { not: null }
        },
        _count: true
      }),
      
      // Get attachments (images)
      prisma.attachments.findMany({
        select: {
          postId: true,
          url: true
        }
      })
    ])

    // Get multiple categories for all posts (matching API logic)
    const allCategoryIds = posts.flatMap(post => post.categoryIds || [])
    const uniqueCategoryIds = [...new Set(allCategoryIds)]
    const multipleCategories = uniqueCategoryIds.length > 0 
      ? await prisma.categories.findMany({
          where: { id: { in: uniqueCategoryIds } },
          select: { id: true, name: true, color: true, slug: true }
        })
      : []
    
    // Create a map for quick category lookup
    const categoryMap = new Map(multipleCategories.map(cat => [cat.id, cat]))

    // Helper function to calculate time ago
    const timeAgo = (date: Date): string => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
      
      if (seconds < 60) return 'just now'
      
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes}m ago`
      
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}h ago`
      
      const days = Math.floor(hours / 24)
      if (days < 7) return `${days}d ago`
      
      const weeks = Math.floor(days / 7)
      if (weeks < 4) return `${weeks}w ago`
      
      const months = Math.floor(days / 30)
      if (months < 12) return `${months}mo ago`
      
      const years = Math.floor(days / 365)
      return `${years}y ago`
    }

    // Helper function to get primary badge
    const getPrimaryBadge = (userBadges: any[]) => {
      return userBadges?.[0] || null
    }

    // Transform vote counts into a map
    const voteCountMap = new Map<string, { upvotes: number; downvotes: number }>()
    
    posts.forEach(post => {
      voteCountMap.set(post.id, { upvotes: 0, downvotes: 0 })
    })

    voteCounts.forEach(vote => {
      if (vote.postId) {
        const existing = voteCountMap.get(vote.postId) || { upvotes: 0, downvotes: 0 }
        if (vote.type === 'UP') {
          existing.upvotes = vote._count
        } else if (vote.type === 'DOWN') {
          existing.downvotes = vote._count
        }
        voteCountMap.set(vote.postId, existing)
      }
    })

    // Group attachments by postId
    const attachmentMap = new Map<string, string[]>()
    attachments.forEach(attachment => {
      const existing = attachmentMap.get(attachment.postId) || []
      let cleanUrl = attachment.url
      if (cleanUrl.includes('blob.vercel-storage.com') && cleanUrl.includes('?download=1')) {
        cleanUrl = cleanUrl.replace('?download=1', '')
      }
      existing.push(cleanUrl)
      attachmentMap.set(attachment.postId, existing)
    })

    const formattedPosts: Post[] = posts.map((post: any) => {
      const voteCount = voteCountMap.get(post.id) || { upvotes: 0, downvotes: 0 }
      const images = attachmentMap.get(post.id) || []
      const primaryBadge = getPrimaryBadge(post.users.userBadges || [])

      // Get multiple categories for this post, avoiding duplicates
      const postCategories = (post.categoryIds || [])
        .map((id: string) => categoryMap.get(id))
        .filter(Boolean) // Remove undefined values
      
      // Remove duplicate categories by creating a unique set based on category ID
      const uniqueCategories = postCategories.filter((category: any, index: number, array: any[]) => 
        array.findIndex((c: any) => c?.id === category?.id) === index
      )

      return {
        id: post.id,
        author: {
          id: post.users.id,
          name: post.isAnonymous ? "Anonymous" : (post.users.name || 'Anonymous'),
          avatar: post.users.image || '/placeholder-user.jpg',
          isVerified: post.users.isVerified,
          rank: primaryBadge?.badges?.name || 'Member',
          rankIcon: primaryBadge?.badges?.icon || '🔰'
        },
        content: post.content,
        category: post.categories.name,      // Primary category name
        categories: post.categories,         // Primary category object  
        allCategories: uniqueCategories,     // Multiple unique categories
        aiCategories: post.aiCategories || [], // AI-suggested category names
        isAnonymous: post.isAnonymous,
        isPinned: post.isPinned,
        upvotes: voteCount.upvotes,
        downvotes: voteCount.downvotes,
        comments: post._count.Comment,
        timeAgo: timeAgo(post.createdAt),
        images: images.length > 0 ? images : undefined
      }
    })

    const pagination: Pagination = {
      total,
      pages: Math.ceil(total / limit),
      currentPage: 1,
      limit
    }

    return { posts: formattedPosts, pagination }
  } catch (error) {
    console.error('Error fetching initial posts:', error)
    return {
      posts: [],
      pagination: { total: 0, pages: 1, currentPage: 1, limit: 10 }
    }
  }
}

// Main page component - Now a server component with SSR
export default async function HomePage() {
  // Fetch initial posts on the server
  const { posts: initialPosts, pagination: initialPagination } = await getInitialPosts()

  return (
    <HomePageInteractive 
      initialPosts={initialPosts} 
      initialPagination={initialPagination} 
    />
  )
}
