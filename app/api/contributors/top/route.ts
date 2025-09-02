import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get top contributors based on post count, comments, and votes received
    const topContributors = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        isVerified: true,
        _count: {
          select: {
            Post: true,
            Comment: true,
          }
        },
        userBadges: {
          select: {
            badges: {
              select: {
                name: true,
                icon: true,
                color: true,
                level: true,
                type: true,
              }
            },
            earnedAt: true,
          },
          orderBy: {
            earnedAt: 'desc'
          },
          take: 1, // Get the most recent badge
        }
      },
      orderBy: [
        {
          Post: {
            _count: 'desc'
          }
        },
        {
          Comment: {
            _count: 'desc'
          }
        }
      ],
      take: 4, // Top 4 contributors
    })

    // Get additional metrics for each contributor
    const contributorsWithMetrics = await Promise.all(
      topContributors.map(async (contributor) => {
        // Get posts by this contributor to find votes on them
        const userPosts = await prisma.post.findMany({
          where: { authorId: contributor.id },
          select: { id: true }
        })

        const userComments = await prisma.comment.findMany({
          where: { authorId: contributor.id },
          select: { id: true }
        })

        // Get total upvotes received on posts
        let postUpvotes = 0
        if (userPosts.length > 0) {
          const postVotesResult = await prisma.votes.count({
            where: {
              postId: {
                in: userPosts.map(p => p.id)
              },
              type: 'UP'
            }
          })
          postUpvotes = postVotesResult
        }

        // Get total upvotes received on comments
        let commentUpvotes = 0
        if (userComments.length > 0) {
          const commentVotesResult = await prisma.votes.count({
            where: {
              commentId: {
                in: userComments.map(c => c.id)
              },
              type: 'UP'
            }
          })
          commentUpvotes = commentVotesResult
        }

        const totalUpvotes = postUpvotes + commentUpvotes
        const totalPosts = contributor._count.Post
        const totalComments = contributor._count.Comment
        const totalContributions = totalPosts + totalComments

        // Calculate a score based on contributions and engagement
        const contributionScore = (totalPosts * 2) + totalComments + totalUpvotes

        // Get the best badge (highest level or most recent)
        const badge = contributor.userBadges[0]?.badges

        return {
          id: contributor.id,
          name: contributor.name,
          avatar: contributor.image,
          isVerified: contributor.isVerified,
          totalPosts: totalPosts,
          totalComments: totalComments,
          totalContributions: totalContributions,
          totalUpvotes: totalUpvotes,
          contributionScore: contributionScore,
          badge: badge ? {
            name: badge.name,
            icon: badge.icon,
            color: badge.color,
            level: badge.level,
            type: badge.type,
          } : null
        }
      })
    )

    // Sort by contribution score and return top 4
    const sortedContributors = contributorsWithMetrics
      .sort((a, b) => b.contributionScore - a.contributionScore)
      .slice(0, 4)

    return NextResponse.json(sortedContributors)
  } catch (error) {
    console.error("Error fetching top contributors:", error)
    return NextResponse.json(
      { error: "Failed to fetch top contributors" },
      { status: 500 }
    )
  }
}
