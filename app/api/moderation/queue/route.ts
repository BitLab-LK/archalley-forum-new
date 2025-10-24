import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReportingService } from '@/lib/reporting-service'
import { hasPermission } from '@/lib/role-permissions'

/**
 * GET /api/moderation/queue - Get moderation queue with filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user can access moderation queue
    if (!hasPermission(session.user.role as any, 'canViewModerationQueue')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to access moderation queue' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const severity = searchParams.get('severity') as any

    const result = await ReportingService.getReports(
      status as any,
      page,
      limit,
      severity
    )

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching moderation queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    )
  }
}