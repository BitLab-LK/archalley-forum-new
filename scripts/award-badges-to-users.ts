import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function awardBadgesToUsers() {
  try {
    console.log('🏆 Awarding badges to users...')

    // Get some users
    const users = await prisma.users.findMany({
      take: 5,
      select: { id: true, name: true }
    })

    if (users.length === 0) {
      console.log('No users found in database')
      return
    }

    // Get some badges
    const badges = await prisma.badges.findMany({
      take: 5,
      select: { id: true, name: true }
    })

    if (badges.length === 0) {
      console.log('No badges found in database')
      return
    }

    console.log(`Found ${users.length} users and ${badges.length} badges`)

    // Award the first badge to all users
    for (const user of users) {
      try {
        // Award newcomer badge
        await prisma.userBadges.upsert({
          where: {
            userId_badgeId: {
              userId: user.id,
              badgeId: badges[0].id // First badge (likely newcomer)
            }
          },
          update: {},
          create: {
            userId: user.id,
            badgeId: badges[0].id,
            earnedAt: new Date()
          }
        })
        console.log(`✅ Awarded "${badges[0].name}" badge to ${user.name}`)
      } catch (error) {
        console.log(`⚠️ Could not award badge to ${user.name}:`, error)
      }
    }

    console.log('🎉 Badge awarding completed!')
  } catch (error) {
    console.error('Error awarding badges:', error)
  } finally {
    await prisma.$disconnect()
  }
}

awardBadgesToUsers()
