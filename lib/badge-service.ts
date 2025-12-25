import { BadgeType, BadgeLevel } from '@prisma/client'
import { prisma } from './prisma'

export interface BadgeEligibilityStats {
  postsCount: number
  commentsCount: number
  upvotesReceived: number
  imagePostsCount: number
  daysAsActiveMember: number
}

export class BadgeService {
  async getAllBadges() {
    return await prisma.badges.findMany({
      where: { isActive: true },
      orderBy: [
        { type: 'asc' },
        { level: 'asc' }
      ]
    })
  }

  async getUserBadges(userId: string) {
    return await prisma.userBadges.findMany({
      where: { userId },
      include: {
        badges: true
      },
      orderBy: { earnedAt: 'desc' }
    })
  }

  async awardBadge(userId: string, badgeId: string, awardedBy?: string) {
    // Check if user already has this badge
    const existingBadge = await prisma.userBadges.findFirst({
      where: {
        userId,
        badgeId
      }
    })

    if (existingBadge) {
      return { success: false, message: 'User already has this badge' }
    }

    const userBadge = await prisma.userBadges.create({
      data: {
        userId,
        badgeId,
        awardedBy
      },
      include: {
        badges: true
      }
    })

    return { success: true, userBadge }
  }

  async getUserStats(userId: string): Promise<BadgeEligibilityStats> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Get user's post IDs and comment IDs
    const userPosts = await prisma.post.findMany({
      where: { authorId: userId },
      select: { id: true }
    })

    const userComments = await prisma.comment.findMany({
      where: { authorId: userId },
      select: { id: true }
    })

    const postIds = userPosts.map(p => p.id)
    const commentIds = userComments.map(c => c.id)

    const [postsCount, commentsCount, postVotes, commentVotes, imagePosts] = await Promise.all([
      // Total posts count
      prisma.post.count({
        where: { authorId: userId }
      }),
      
      // Total comments count
      prisma.comment.count({
        where: { authorId: userId }
      }),
      
      // Upvotes received on posts
      prisma.votes.count({
        where: {
          type: 'UP',
          postId: {
            in: postIds
          }
        }
      }),
      
      // Upvotes received on comments
      prisma.votes.count({
        where: {
          type: 'UP',
          commentId: {
            in: commentIds
          }
        }
      }),
      
      // Image posts count (posts with images)
      prisma.post.count({
        where: {
          authorId: userId,
          images: {
            isEmpty: false
          }
        }
      })
    ])

    const upvotesReceived = postVotes + commentVotes

    const daysAsActiveMember = Math.floor(
      (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      postsCount,
      commentsCount,
      upvotesReceived,
      imagePostsCount: imagePosts,
      daysAsActiveMember
    }
  }

  async checkAndAwardBadges(userId: string) {
    try {
      console.log(`🏆 Starting badge check for user: ${userId}`)
      
      const userStats = await this.getUserStats(userId)
      console.log('📊 User stats:', userStats)
      
      const availableBadges = await this.getAllBadges()
      const userBadges = await this.getUserBadges(userId)
      const userBadgeIds = userBadges.map((ub: any) => ub.badgeId)
      
      console.log(`🎖️ User has ${userBadges.length} existing badges`)
      
      const newlyAwardedBadges = []

      for (const badge of availableBadges) {
        // Skip if user already has this badge
        if (userBadgeIds.includes(badge.id)) {
          continue
        }

        const criteria = badge.criteria as any
        let eligible = false

        // Check eligibility based on criteria - improved logic with AND conditions
        if (criteria.postsCount && userStats.postsCount >= criteria.postsCount) {
          eligible = true
        }
        
        if (criteria.commentsCount && userStats.commentsCount >= criteria.commentsCount) {
          eligible = true
        }
        
        if (criteria.upvotesReceived && userStats.upvotesReceived >= criteria.upvotesReceived) {
          eligible = true
        }
        
        if (criteria.imagePostsCount && userStats.imagePostsCount >= criteria.imagePostsCount) {
          eligible = true
        }
        
        if (criteria.daysAsActiveMember && userStats.daysAsActiveMember >= criteria.daysAsActiveMember) {
          eligible = true
        }

        // Skip manually awarded badges
        if (criteria.manuallyAwarded) {
          eligible = false
        }

        if (eligible) {
          console.log(`✅ User eligible for badge: ${badge.name}`)
          const result = await this.awardBadge(userId, badge.id, 'system')
          if (result.success) {
            newlyAwardedBadges.push(result.userBadge)
            console.log(`🎉 Awarded badge: ${badge.name}`)
          } else {
            console.warn(`⚠️ Failed to award badge ${badge.name}: ${result.message}`)
          }
        }
      }

      console.log(`🏆 Badge check completed. Awarded ${newlyAwardedBadges.length} new badges`)
      
      return {
        userStats,
        awardedBadges: newlyAwardedBadges
      }
    } catch (error) {
      console.error('❌ Error in checkAndAwardBadges:', error)
      return {
        userStats: null,
        awardedBadges: []
      }
    }
  }

  async getBadgeLeaderboard(limit = 10) {
    const leaderboard = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar,
        COUNT(ub.id) as badge_count,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', b.id,
            'name', b.name,
            'icon', b.icon,
            'color', b.color,
            'level', b.level,
            'type', b.type
          )
        ) as badges
      FROM users u
      LEFT JOIN "userBadges" ub ON u.id = ub."userId"
      LEFT JOIN badges b ON ub."badgeId" = b.id AND b."isActive" = true
      GROUP BY u.id, u.name, u.email, u.avatar
      ORDER BY badge_count DESC, u.name ASC
      LIMIT ${limit}
    `

    return leaderboard
  }

  async getBadgesByType(type: BadgeType) {
    return await prisma.badges.findMany({
      where: { 
        type,
        isActive: true 
      },
      orderBy: { level: 'asc' }
    })
  }

  async getBadgesByLevel(level: BadgeLevel) {
    return await prisma.badges.findMany({
      where: { 
        level,
        isActive: true 
      },
      orderBy: { type: 'asc' }
    })
  }
}

export const badgeService = new BadgeService()