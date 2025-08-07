import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log('🔍 Starting users API request...')
    
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
        rank: true,
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

    console.log(`✅ Found ${users.length} users`)

    // Filter by profileVisibility after fetching to handle cases where the field might be null
    const publicUsers = users.filter(user => user.profileVisibility !== false)
    console.log(`🔓 ${publicUsers.length} users have public profiles`)

    // Create a map of user ID to total upvotes
    const upvoteMap = new Map<string, number>()
    
    // Initialize all users with 0 upvotes
    publicUsers.forEach(user => {
      upvoteMap.set(user.id, 0)
    })

    // For each user, count their upvotes efficiently
    for (const user of publicUsers) {
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

    // Transform the data to match the members page format
    const formattedUsers = publicUsers.map(user => ({
      id: user.id,
      name: user.name || 'Anonymous User',
      profession: user.profession,
      company: user.company,
      location: user.location,
      rank: user.rank || 'Member',
      posts: user._count.Post,
      upvotes: upvoteMap.get(user.id) || 0, // Real upvote count from database
      joinDate: new Date(user.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      isVerified: user.isVerified || false,
      avatar: user.image,
    }))

    console.log(`🎯 Returning ${formattedUsers.length} formatted users`)
    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("❌ Error fetching users:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
