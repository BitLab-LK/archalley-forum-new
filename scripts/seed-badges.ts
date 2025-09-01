// Badge seeding script - Run with: npx tsx scripts/seed-badges.ts
import { PrismaClient, BadgeType, BadgeLevel } from '@prisma/client'

const prisma = new PrismaClient()

const BADGE_DEFINITIONS = [
  // Activity Badges - Professional Growth Icons
  {
    id: 'first-post',
    name: 'First Steps',
    description: 'Posted your first contribution to the community',
    icon: '⭐', // Modern star for first achievement
    color: '#10B981',
    type: BadgeType.ACTIVITY,
    level: BadgeLevel.BRONZE,
    criteria: { postsCount: 1 }
  },
  {
    id: 'active-contributor',
    name: 'Active Contributor',
    description: 'Posted 10 contributions to the community',
    icon: '⚡', // Lightning bolt for energy/activity
    color: '#3B82F6',
    type: BadgeType.ACTIVITY,
    level: BadgeLevel.SILVER,
    criteria: { postsCount: 10 }
  },
  {
    id: 'prolific-writer',
    name: 'Prolific Writer',
    description: 'Posted 50 contributions to the community',
    icon: '🔥', // Fire icon for hot content
    color: '#F59E0B',
    type: BadgeType.ACTIVITY,
    level: BadgeLevel.GOLD,
    criteria: { postsCount: 50 }
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'Posted 100 contributions to the community',
    icon: '💎', // Diamond for premium achievement
    color: '#8B5CF6',
    type: BadgeType.ACTIVITY,
    level: BadgeLevel.PLATINUM,
    criteria: { postsCount: 100 }
  },

  // Engagement Badges - Communication Icons
  {
    id: 'conversationalist',
    name: 'Conversationalist',
    description: 'Made 25 thoughtful comments',
    icon: '💬', // Modern chat bubble
    color: '#06B6D4',
    type: BadgeType.ENGAGEMENT,
    level: BadgeLevel.BRONZE,
    criteria: { commentsCount: 25 }
  },
  {
    id: 'discussion-leader',
    name: 'Discussion Leader',
    description: 'Made 100 thoughtful comments',
    icon: '🎯', // Target for precision/leadership
    color: '#3B82F6',
    type: BadgeType.ENGAGEMENT,
    level: BadgeLevel.SILVER,
    criteria: { commentsCount: 100 }
  },
  {
    id: 'community-voice',
    name: 'Community Voice',
    description: 'Made 500 thoughtful comments',
    icon: '📢', // Broadcasting/signal icon
    color: '#F59E0B',
    type: BadgeType.ENGAGEMENT,
    level: BadgeLevel.GOLD,
    criteria: { commentsCount: 500 }
  },

  // Appreciation Badges - Recognition Icons
  {
    id: 'helpful',
    name: 'Helpful',
    description: 'Received 10 upvotes on your contributions',
    icon: '⭐', // Clean star for recognition
    color: '#10B981',
    type: BadgeType.APPRECIATION,
    level: BadgeLevel.BRONZE,
    criteria: { upvotesReceived: 10 }
  },
  {
    id: 'well-liked',
    name: 'Well Liked',
    description: 'Received 50 upvotes on your contributions',
    icon: '🏆', // Trophy for achievement
    color: '#EF4444',
    type: BadgeType.APPRECIATION,
    level: BadgeLevel.SILVER,
    criteria: { upvotesReceived: 50 }
  },
  {
    id: 'community-favorite',
    name: 'Community Favorite',
    description: 'Received 200 upvotes on your contributions',
    icon: '👑', // Crown for high status
    color: '#F59E0B',
    type: BadgeType.APPRECIATION,
    level: BadgeLevel.GOLD,
    criteria: { upvotesReceived: 200 }
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Received 500 upvotes on your contributions',
    icon: '💫', // Sparkle/magic for expertise
    color: '#8B5CF6',
    type: BadgeType.APPRECIATION,
    level: BadgeLevel.PLATINUM,
    criteria: { upvotesReceived: 500 }
  },

  // Tenure Badges - Time/Loyalty Icons
  {
    id: 'newcomer',
    name: 'Newcomer',
    description: 'Welcome to the community!',
    icon: '🎯', // Target for new beginning
    color: '#6B7280',
    type: BadgeType.TENURE,
    level: BadgeLevel.BRONZE,
    criteria: { daysAsActiveMember: 1 }
  },
  {
    id: 'regular',
    name: 'Regular',
    description: 'Active member for 30 days',
    icon: '🔰', // Shield for established member
    color: '#3B82F6',
    type: BadgeType.TENURE,
    level: BadgeLevel.SILVER,
    criteria: { daysAsActiveMember: 30 }
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Active member for 365 days',
    icon: '⚔️', // Crossed swords for veteran
    color: '#F59E0B',
    type: BadgeType.TENURE,
    level: BadgeLevel.GOLD,
    criteria: { daysAsActiveMember: 365 }
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Active member for 1000 days',
    icon: '🏛️', // Classical building for legend status
    color: '#8B5CF6',
    type: BadgeType.TENURE,
    level: BadgeLevel.PLATINUM,
    criteria: { daysAsActiveMember: 1000 }
  },

  // Achievement Badges - Success Icons
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Provided 5 helpful answers',
    icon: '🧩', // Puzzle piece for problem solving
    color: '#10B981',
    type: BadgeType.ACHIEVEMENT,
    level: BadgeLevel.BRONZE,
    criteria: { commentsCount: 5, upvotesReceived: 5 }
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Provided 25 helpful answers',
    icon: '🎓', // Graduation cap for teaching
    color: '#3B82F6',
    type: BadgeType.ACHIEVEMENT,
    level: BadgeLevel.SILVER,
    criteria: { commentsCount: 25, upvotesReceived: 25 }
  },
  {
    id: 'guru',
    name: 'Guru',
    description: 'Provided 100 helpful answers',
    icon: '🧠', // Brain for wisdom/knowledge
    color: '#8B5CF6',
    type: BadgeType.ACHIEVEMENT,
    level: BadgeLevel.GOLD,
    criteria: { commentsCount: 100, upvotesReceived: 100 }
  },

  // Quality Badges - Excellence Icons
  {
    id: 'trending',
    name: 'Trending',
    description: 'Created a post with significant engagement',
    icon: '📈', // Chart trending up
    color: '#EF4444',
    type: BadgeType.QUALITY,
    level: BadgeLevel.SILVER,
    criteria: { postsCount: 5, upvotesReceived: 20 }
  },
  {
    id: 'viral',
    name: 'Viral',
    description: 'Created highly engaging content',
    icon: '🚀', // Rocket for viral success
    color: '#F59E0B',
    type: BadgeType.QUALITY,
    level: BadgeLevel.GOLD,
    criteria: { postsCount: 10, upvotesReceived: 50 }
  },
  {
    id: 'verified-expert',
    name: 'Verified Expert',
    description: 'Recognized expert in the community',
    icon: '✅', // Check mark for verification
    color: '#10B981',
    type: BadgeType.ACHIEVEMENT,
    level: BadgeLevel.PLATINUM,
    criteria: { postsCount: 50, upvotesReceived: 200, commentsCount: 100 }
  }
]

async function seedBadges() {
  console.log('🌱 Seeding badges...')

  try {
    // Create or update all badge definitions
    for (const badge of BADGE_DEFINITIONS) {
      await prisma.badges.upsert({
        where: { id: badge.id },
        update: {
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          color: badge.color,
          type: badge.type,
          level: badge.level,
          criteria: badge.criteria as any,
          isActive: true
        },
        create: {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          color: badge.color,
          type: badge.type,
          level: badge.level,
          criteria: badge.criteria as any,
          isActive: true
        }
      })
      console.log(`✅ Created/Updated badge: ${badge.name}`)
    }

    console.log('🎉 Badge seeding completed!')

    // Award initial badges to existing users based on their activity
    console.log('🏆 Checking existing users for badge eligibility...')
    
    const users = await prisma.users.findMany({
      select: { id: true, name: true }
    })

    for (const user of users) {
      console.log(`Checking badges for user: ${user.name}`)
      
      // This would use the badge service
      // await badgeService.checkAndAwardBadges(user.id)
      
      // For now, let's manually award the newcomer badge to everyone
      const hasNewcomerBadge = await prisma.userBadges.findFirst({
        where: {
          userId: user.id,
          badgeId: 'newcomer'
        }
      })

      if (!hasNewcomerBadge) {
        await prisma.userBadges.create({
          data: {
            userId: user.id,
            badgeId: 'newcomer',
            awardedBy: 'system'
          }
        })
        console.log(`✅ Awarded Newcomer badge to ${user.name}`)
      }
    }

    console.log('🎉 Initial badge awards completed!')

  } catch (error) {
    console.error('❌ Error seeding badges:', error)
    throw error
  }
}

// Run the seeding
seedBadges()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
