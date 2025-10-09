import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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
async function getInitialPosts(session: any = null): Promise<{ posts: Post[], pagination: Pagination }> {
  try {
    console.log('🔄 SSR: Starting initial posts fetch...')
    const limit = 10
    const skip = 0
    
    // Use Promise.allSettled for better error handling - some data is better than no data
    const results = await Promise.allSettled([
      // Get posts with all necessary relations (matching the API structure)
      prisma.post.findMany({
        take: limit,
        skip: skip,
        where: {
          // Filter out hidden posts for non-admin users on homepage
          isHidden: false
        },
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
          primaryCategory: true,  // Primary category (full object)
          postCategories: {
            include: {
              category: true
            }
          },
          _count: {
            select: { Comment: true }
          }
        }
      }),
      
      // Get total count (excluding hidden posts)
      prisma.post.count({
        where: {
          isHidden: false
        }
      }),
      
      // Get vote counts for posts
      prisma.votes.groupBy({
        by: ['postId', 'type'],
        where: {
          postId: { not: null }
        },
        _count: true
      })
    ])

    // Extract results, handling failures gracefully
    const posts = results[0].status === 'fulfilled' ? results[0].value : []
    const total = results[1].status === 'fulfilled' ? results[1].value : 0
    const voteCounts = results[2].status === 'fulfilled' ? results[2].value : []

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`⚠️ SSR: Query ${index} failed:`, result.reason)
      }
    })

    // Get multiple categories for all posts (matching API logic) - also with error handling
    const allCategoryIds = posts.flatMap(post => post.categoryIds || [])
    const uniqueCategoryIds = [...new Set(allCategoryIds)]
    let multipleCategories: any[] = []
    
    if (uniqueCategoryIds.length > 0) {
      try {
        multipleCategories = await prisma.categories.findMany({
          where: { id: { in: uniqueCategoryIds } },
          select: { id: true, name: true, color: true, slug: true }
        })
      } catch (error) {
        console.warn('⚠️ SSR: Failed to fetch multiple categories:', error)
      }
    }
    
    // Create a map for quick category lookup
    const categoryMap = new Map(multipleCategories.map(cat => [cat.id, cat]))

    // Get user votes if authenticated (matching API logic)
    const userVoteMap = new Map<string, string>()
    if (session?.user?.id) {
      try {
        const userVotes = await prisma.votes.findMany({
          where: {
            userId: session.user.id,
            postId: {
              in: posts.map((post: any) => post.id)
            }
          },
          select: {
            postId: true,
            type: true
          }
        })
        
        userVotes.forEach(vote => {
          if (vote.postId) {
            userVoteMap.set(vote.postId, vote.type)
          }
        })
      } catch (error) {
        console.warn('⚠️ SSR: Failed to fetch user votes:', error)
      }
    }

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

    const formattedPosts: Post[] = posts.map((post: any) => {
      const voteCount = voteCountMap.get(post.id) || { upvotes: 0, downvotes: 0 }
      const userVote = userVoteMap.get(post.id)?.toLowerCase() || null // Include user vote
      // Use images field directly from the post
      const images = post.images || []
      const primaryBadge = getPrimaryBadge(post.users?.userBadges || [])

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
          id: post.users?.id || '',
          name: post.isAnonymous ? "Anonymous" : (post.users?.name || 'Anonymous'),
          avatar: post.users?.image || '/placeholder-user.jpg',
          isVerified: post.users?.isVerified || false,
          rank: primaryBadge?.badges?.name || 'Member',
          rankIcon: primaryBadge?.badges?.icon || '🔰',
          badges: post.users?.userBadges || []
        },
        content: post.content || '',
        category: post.primaryCategory?.name || 'General',      // Primary category name with fallback
        categories: post.primaryCategory || { id: '', name: 'General', color: '#gray', slug: 'general' },         // Primary category object with fallback
        allCategories: uniqueCategories,     // Multiple unique categories
        aiCategories: [], // AI-suggested category names (deprecated, use aiSuggestions)
        isAnonymous: post.isAnonymous || false,
        isPinned: post.isPinned || false,
        upvotes: voteCount.upvotes,
        downvotes: voteCount.downvotes,
        userVote: userVote as "up" | "down" | null, // Add user vote to SSR data
        comments: post._count?.Comment || 0,
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

    console.log(`✅ SSR: Successfully fetched ${formattedPosts.length} posts out of ${total} total`)
    return { posts: formattedPosts, pagination }
  } catch (error) {
    console.error('❌ SSR: Error fetching initial posts:', error)
    // Return empty state but let client-side handle the loading
    console.log('⚠️ SSR: Returning empty state, client will handle loading')
    return {
      posts: [],
      pagination: { total: 0, pages: 1, currentPage: 1, limit: 10 }
    }
  }
}

// Main page component - Now a server component with SSR
export default async function HomePage() {
  // Get user session for authentication-aware SSR
  const session = await getServerSession(authOptions)
  
  // Fetch initial posts on the server with timeout to prevent slow renders
  let initialData
  
  try {
    // Add a timeout to prevent SSR from taking too long
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('SSR timeout')), 5000) // 5 second timeout
    )
    
    initialData = await Promise.race([
      getInitialPosts(session),
      timeoutPromise
    ])
  } catch (error) {
    console.warn('⚠️ SSR: Timeout or error, using fallback:', error)
    // Fallback to empty state - client will handle loading
    initialData = {
      posts: [],
      pagination: { total: 0, pages: 1, currentPage: 1, limit: 10 }
    }
  }

  return (
    <HomePageInteractive 
      initialPosts={initialData.posts} 
      initialPagination={initialData.pagination} 
    />
  )
}
