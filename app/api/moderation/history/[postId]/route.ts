import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReportingService } from '@/lib/reporting-service'
import { hasPermission } from '@/lib/role-permissions'

/**
 * GET /api/moderation/history/[postId] - Get moderation history for a specific post
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user can view moderation history
    if (!hasPermission(session.user.role as any, 'canViewModerationHistory')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view moderation history' },
        { status: 403 }
      )
    }

    const { postId } = await params
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const history = await ReportingService.getModerationHistory(postId)

    return NextResponse.json({ history })

  } catch (error) {
    console.error('Error fetching moderation history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation history' },
      { status: 500 }
    )
  }
}