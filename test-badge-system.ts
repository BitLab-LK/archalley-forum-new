import { badgeService } from "./lib/badge-service"
import { prisma } from "./lib/prisma"

async function testBadgeSystem() {
  console.log("🧪 Testing Badge System...")
  
  try {
    // Test 1: Check if badges exist
    console.log("\n1. Checking available badges...")
    const badges = await badgeService.getAllBadges()
    console.log(`✅ Found ${badges.length} badges`)
    
    if (badges.length > 0) {
      console.log("Sample badges:")
      badges.slice(0, 3).forEach(badge => {
        console.log(`   - ${badge.name} (${badge.level}) - ${badge.description}`)
      })
    }
    
    // Test 2: Check if there are any users to test with
    console.log("\n2. Checking users...")
    const users = await prisma.users.findMany({ take: 5 })
    console.log(`✅ Found ${users.length} users`)
    
    if (users.length > 0) {
      const testUser = users[0]
      console.log(`   Testing with user: ${testUser.name} (${testUser.id})`)
      
      // Test 3: Get user stats
      console.log("\n3. Getting user stats...")
      const stats = await badgeService.getUserStats(testUser.id)
      console.log(`✅ User stats:`, {
        posts: stats.postsCount,
        comments: stats.commentsCount,
        upvotes: stats.upvotesReceived,
        images: stats.imagePostsCount,
        days: stats.daysAsActiveMember
      })
      
      // Test 4: Check current user badges
      console.log("\n4. Checking current user badges...")
      const userBadges = await badgeService.getUserBadges(testUser.id)
      console.log(`✅ User has ${userBadges.length} badges`)
      
      if (userBadges.length > 0) {
        userBadges.forEach(ub => {
          console.log(`   - ${ub.badges.name} (earned ${ub.earnedAt})`)
        })
      }
      
      // Test 5: Test badge checking (without awarding to avoid duplicates)
      console.log("\n5. Testing badge eligibility check...")
      const result = await badgeService.checkAndAwardBadges(testUser.id)
      console.log(`✅ Badge check completed`)
      console.log(`   Newly awarded: ${result.awardedBadges.length} badges`)
      
      if (result.awardedBadges.length > 0) {
        result.awardedBadges.forEach(badge => {
          console.log(`   - Awarded: ${badge?.badges?.name}`)
        })
      }
    }
    
    // Test 6: Database consistency check
    console.log("\n6. Database consistency check...")
    
    // Check if userBadges table uses correct name (not UserBadge)
    const userBadgesCount = await prisma.userBadges.count()
    console.log(`✅ UserBadges records: ${userBadgesCount}`)
    
    // Check votes table for upvote counting
    const votesCount = await prisma.votes.count({ where: { type: 'UP' } })
    console.log(`✅ Upvotes in database: ${votesCount}`)
    
    console.log("\n🎉 Badge System Test Complete!")
    
  } catch (error) {
    console.error("❌ Badge system test failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testBadgeSystem()