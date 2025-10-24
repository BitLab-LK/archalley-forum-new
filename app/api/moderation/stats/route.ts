import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReportingService } from '@/lib/reporting-service'
import { hasPermission } from '@/lib/role-permissions'

/**
 * GET /api/moderation/stats - Get moderation statistics
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user can view moderation statistics
    if (!hasPermission(session.user.role as any, 'canViewModerationQueue')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view moderation statistics' },
        { status: 403 }
      )
    }

    const stats = await ReportingService.getModerationStats()

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching moderation stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation statistics' },
      { status: 500 }
    )
  }
}