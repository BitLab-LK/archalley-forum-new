import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma, ensureDbConnection, checkDbHealth } from "@/lib/prisma"

export async function GET() {
  try {
    // Get current session to determine viewer context
    const session = await getServerSession(authOptions)
    const viewerIsAuthenticated = !!session?.user
    const viewerIsMember = true // Assuming all authenticated users are members

    // Use the enhanced database connection handler
    try {
      await ensureDbConnection()
    } catch (dbError) {
      console.error('❌ Database connection failed after retries:', dbError)
      
      // Get health check details
      const healthCheck = await checkDbHealth()
      
      return NextResponse.json(
        { 
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          suggestion: "This is usually a temporary issue with the database server. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          healthCheck
        },
        { 
          status: 503, // Service Unavailable
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Retry-After': '30'
          }
        }
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
        professions: true,
        location: true,
        // Privacy fields
        profilePhotoPrivacy: true,
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

    // Helper function to check if profile photo should be visible
    const shouldShowProfilePhoto = (profilePhotoPrivacy: string | null) => {
      switch (profilePhotoPrivacy) {
        case "EVERYONE":
          return true
        case "MEMBERS_ONLY":
          return viewerIsAuthenticated && viewerIsMember
        case "ONLY_ME":
          return false // Never show in members list, even to the owner (for privacy)
        default:
          return true // Default to visible for compatibility
      }
    }

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
      
      // Determine avatar based on privacy settings
      const avatarUrl = shouldShowProfilePhoto(user.profilePhotoPrivacy) 
        ? user.image 
        : null // Use null instead of placeholder - let frontend handle placeholder
      
      return {
        id: user.id,
        name: user.name || 'Anonymous User',
        profession: user.profession,
        professions: user.professions,
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
        avatar: avatarUrl,
        // Include privacy settings for frontend logic
        profilePhotoPrivacy: user.profilePhotoPrivacy,
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
    
    // Check if it's a database-related error
    const isDbError = error instanceof Error && (
      error.message.includes('database') ||
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT')
    )
    
    return NextResponse.json(
      { 
        error: isDbError ? "Database connection issue" : "Failed to fetch users",
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: isDbError 
          ? "The database server is experiencing connectivity issues. Please wait a moment and try again."
          : "An unexpected error occurred. Please try again.",
        timestamp: new Date().toISOString(),
        retryable: isDbError
      },
      { 
        status: isDbError ? 503 : 500, // 503 Service Unavailable for DB issues
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...(isDbError && { 'Retry-After': '30' })
        }
      }
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

