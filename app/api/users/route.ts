import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get users with their post count and post IDs
    const users = await prisma.users.findMany({
      where: {
        // Only show users who have made their profiles public
        profileVisibility: true,
      },
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

    // Create a map of user ID to total upvotes
    const upvoteMap = new Map<string, number>()
    
    // Initialize all users with 0 upvotes
    users.forEach(user => {
      upvoteMap.set(user.id, 0)
    })

    // For each user, count their upvotes efficiently
    for (const user of users) {
      if (user.Post.length > 0) {
        const postIds = user.Post.map(post => post.id)
        
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
      }
    }

    // Transform the data to match the members page format
    const formattedUsers = users.map(user => ({
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

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
