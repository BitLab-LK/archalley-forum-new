import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { badgeService } from '@/lib/badge-service'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`Checking badges for user: ${session.user.id}`)
    
    // Force check and award badges
    const result = await badgeService.checkAndAwardBadges(session.user.id)
    
    console.log('Badge check result:', result)

    return NextResponse.json({
      message: 'Badge check completed',
      userStats: result.userStats,
      awardedBadges: result.awardedBadges
    })
  } catch (error) {
    console.error('Error in badge check:', error)
    return NextResponse.json(
      { error: 'Failed to check badges' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's current badges
    const userBadges = await badgeService.getUserBadges(session.user.id)
    const userStats = await badgeService.getUserStats(session.user.id)

    return NextResponse.json({
      userBadges,
      userStats
    })
  } catch (error) {
    console.error('Error getting user badges:', error)
    return NextResponse.json(
      { error: 'Failed to get badges' },
      { status: 500 }
    )
  }
}
