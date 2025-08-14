import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {

// Test database connection first
    try {
      await prisma.$connect()
      
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError)
      return NextResponse.json(
        { 
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }
    
    // Get users with their post count and post IDs
    // Remove the profileVisibility filter for now to see if that's causing issues
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        company: true,
        profession: true,
        location: true,
        userBadges: {
          include: {
            badges: true
          },
          take: 5 // Get user's top 5 badges
        },
        isVerified: true,
        createdAt: true,
        profileVisibility: true, // Include it in select to check if it exists
        _count: {
          select: {
            Post: true,
          },
        },
        Post: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

// Filter by profileVisibility after fetching to handle cases where the field might be null
    const publicUsers = users.filter(user => user.profileVisibility !== false)

// Create a map of user ID to total upvotes
    const upvoteMap = new Map<string, number>()
    
    // Initialize all users with 0 upvotes
    publicUsers.forEach(user => {
      upvoteMap.set(user.id, 0)
    })

    // For each user, count their upvotes efficiently (simplified for now to avoid timeouts)
    // Skip vote counting in production to avoid potential timeouts
    if (process.env.NODE_ENV !== 'production') {
      for (const user of publicUsers.slice(0, 10)) { // Limit to first 10 users to avoid timeouts
        if (user.Post.length > 0) {
          const postIds = user.Post.map(post => post.id)
          
          try {
            // Count upvotes for all this user's posts
            const upvoteCount = await prisma.votes.count({
              where: {
                type: 'UP',
                postId: {
                  in: postIds,
                },
              },
            })
            
            upvoteMap.set(user.id, upvoteCount)
          } catch (voteError) {
            console.warn(`Failed to count votes for user ${user.id}:`, voteError)
            upvoteMap.set(user.id, 0)
          }
        }
      }
    }

    // Transform the data to match the members page format
    const formattedUsers = publicUsers.map(user => {
      const primaryBadge = user.userBadges?.[0]?.badges // Get the most recent badge
      return {
        id: user.id,
        name: user.name || 'Anonymous User',
        profession: user.profession,
        company: user.company,
        location: user.location,
        rank: primaryBadge?.name || 'Member',
        badgeCount: user.userBadges?.length || 0,
        badges: user.userBadges || [],
        posts: user._count.Post,
        upvotes: upvoteMap.get(user.id) || 0, // Real upvote count from database (or 0 in production)
        joinDate: new Date(user.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
        isVerified: user.isVerified || false,
        avatar: user.image,
      }
    })

return NextResponse.json({ 
      users: formattedUsers,
      metadata: {
        total: formattedUsers.length,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    })
  } catch (error) {
    console.error("❌ Error fetching users:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    // Ensure database connection is properly closed
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.warn('Failed to disconnect from database:', disconnectError)
    }
  }
}

