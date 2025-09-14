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
    console.log('🔍 Starting getInitialPosts - Environment:', process.env.NODE_ENV)
    console.log('🔍 Database URL exists:', !!process.env.DATABASE_URL)
    
    const limit = 10
    const skip = 0
    
    // Test database connection first
    try {
      await prisma.$connect()
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Database connection successful')
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError)
      throw new Error('Database connection failed')
    }
    
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
          categories: {
            select: {
              id: true,
              name: true
            }
          },
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

    console.log(`✅ Retrieved ${posts.length} posts, ${total} total`)

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
        category: post.categories.name,
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
    console.error('❌ Error fetching initial posts:', error)
    
    // Log specific error details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Return empty state instead of crashing
    return {
      posts: [],
      pagination: { total: 0, pages: 1, currentPage: 1, limit: 10 }
    }
  }
}

// Main page component - Now a server component with SSR
export default async function HomePage() {
  console.log('🏠 HomePage component rendering...')
  
  try {
    // Fetch initial posts on the server
    const { posts: initialPosts, pagination: initialPagination } = await getInitialPosts()
    
    console.log(`🏠 HomePage: Passing ${initialPosts.length} initial posts to client`)
    
    return (
      <HomePageInteractive 
        initialPosts={initialPosts} 
        initialPagination={initialPagination} 
      />
    )
  } catch (error) {
    console.error('🚨 HomePage: Critical error during SSR:', error)
    
    // Fallback: Render with empty data and let client-side fetch handle it
    return (
      <HomePageInteractive 
        initialPosts={[]} 
        initialPagination={{ total: 0, pages: 1, currentPage: 1, limit: 10 }} 
      />
    )
  }
}
