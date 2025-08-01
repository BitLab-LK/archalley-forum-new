import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Activity {
  id: string
  type: string
  action: string
  target: {
    type: string
    id: string
    content: string
    category?: string
    author?: {
      name: string | null
      id: string
    }
  }
  createdAt: Date
  timeAgo?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20) // Cap at 20
    const offset = (page - 1) * limit

    const { id: userId } = await params

    // Check if requesting user can view this profile
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        profileVisibility: true,
        role: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Allow access if:
    // 1. User is viewing their own profile
    // 2. Target profile is public
    // 3. Requester is admin
    const canView = 
      session.user.id === userId || 
      targetUser.profileVisibility || 
      session.user.role === "ADMIN"

    if (!canView) {
      return NextResponse.json({ error: "Profile is private" }, { status: 403 })
    }

    // Get user activities - improved approach with proper chronological ordering
    const activities: Activity[] = []

    // Get all activities in chronological order by using a unified approach
    // We'll fetch recent data and then sort by actual creation time
    
    // 1. Get recent posts
    const recentPosts = await prisma.post.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        categories: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50 // Get more to ensure we capture enough recent activity
    })

    // 2. Get recent votes
    const recentVotes = await prisma.votes.findMany({
      where: { 
        userId,
        postId: { not: null },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        postId: true
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    // Get post details for votes
    const votePostIds = recentVotes.map(vote => vote.postId).filter(Boolean) as string[]
    const postsForVotes = await prisma.post.findMany({
      where: { id: { in: votePostIds } },
      select: {
        id: true,
        content: true,
        users: {
          select: { name: true, id: true }
        }
      }
    })
    const votePostMap = new Map(postsForVotes.map(post => [post.id, post]))

    // 3. Get recent comments
    const recentComments = await prisma.comment.findMany({
      where: { 
        authorId: userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        Post: {
          select: {
            id: true,
            content: true,
            users: {
              select: { name: true, id: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    // Convert to unified activity format
    recentPosts.forEach(post => {
      activities.push({
        id: `post-${post.id}`,
        type: "post_created",
        action: "created a post",
        target: {
          type: "post",
          id: post.id,
          content: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
          category: post.categories.name
        },
        createdAt: post.createdAt
      })
    })

    recentVotes.forEach(vote => {
      if (vote.postId) {
        const post = votePostMap.get(vote.postId)
        if (post) {
          activities.push({
            id: `vote-${vote.id}`,
            type: vote.type === "UP" ? "post_liked" : "post_disliked",
            action: vote.type === "UP" ? "liked" : "disliked",
            target: {
              type: "post",
              id: post.id,
              content: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
              author: {
                name: post.users.name,
                id: post.users.id
              }
            },
            createdAt: vote.createdAt
          })
        }
      }
    })

    recentComments.forEach(comment => {
      activities.push({
        id: `comment-${comment.id}`,
        type: "comment_created",
        action: "commented on",
        target: {
          type: "post",
          id: comment.Post.id,
          content: comment.Post.content.substring(0, 100) + (comment.Post.content.length > 100 ? "..." : ""),
          author: {
            name: comment.Post.users.name,
            id: comment.Post.users.id
          }
        },
        createdAt: comment.createdAt
      })
    })

    // Sort all activities by date (most recent first)
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Apply pagination to the sorted results
    const totalActivities = activities.length
    const paginatedActivities = activities.slice(offset, offset + limit)
    const hasMore = offset + limit < totalActivities

    // Calculate time ago for each activity
    const activitiesWithTimeAgo = paginatedActivities.map(activity => ({
      ...activity,
      timeAgo: getTimeAgo(activity.createdAt)
    }))

    return NextResponse.json({
      activities: activitiesWithTimeAgo,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalActivities / limit),
        totalActivities,
        hasMore,
        limit
      },
      user: {
        id: targetUser.id,
        name: targetUser.name
      },
      debug: {
        fetchedActivities: totalActivities,
        returnedActivities: paginatedActivities.length,
        page,
        offset,
        limit
      }
    })

  } catch (error) {
    console.error("Error fetching user activity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

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
  } else {
    return date.toLocaleDateString()
  }
}
