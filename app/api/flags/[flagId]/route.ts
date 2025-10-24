import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReportingService } from '@/lib/reporting-service'
import { hasPermission } from '@/lib/role-permissions'
import { z } from 'zod'

const reviewReportSchema = z.object({
  status: z.enum(['REVIEWED', 'RESOLVED', 'DISMISSED', 'ESCALATED']),
  reviewNotes: z.string().optional(),
  moderationAction: z.enum([
    'HIDE_POST',
    'UNHIDE_POST',
    'PIN_POST',
    'UNPIN_POST',
    'LOCK_POST',
    'UNLOCK_POST',
    'DELETE_POST'
  ]).optional(),
  moderationReason: z.string().optional()
})

/**
 * PATCH /api/flags/[flagId] - Review a report
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user can review reports
    if (!hasPermission(session.user.role as any, 'canReviewReports')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to review reports' },
        { status: 403 }
      )
    }

    const { flagId } = await params
    
    if (!flagId) {
      return NextResponse.json(
        { error: 'Flag ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validationResult = reviewReportSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { status, reviewNotes, moderationAction, moderationReason } = validationResult.data

    // Check escalation permissions
    if (status === 'ESCALATED' && !hasPermission(session.user.role as any, 'canEscalateReports')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to escalate reports' },
        { status: 403 }
      )
    }

    // Check moderation action permissions
    if (moderationAction && !hasPermission(session.user.role as any, 'canPerformModerationActions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to perform moderation actions' },
        { status: 403 }
      )
    }

    const result = await ReportingService.reviewReport(
      session.user.id,
      {
        flagId,
        status: status as any,
        reviewNotes,
        moderationAction: moderationAction as any,
        moderationReason
      }
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Report ${status.toLowerCase()} successfully`
    })

  } catch (error) {
    console.error('Error reviewing report:', error)
    return NextResponse.json(
      { error: 'Failed to review report' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/flags/[flagId] - Get specific report details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user can view reports
    if (!hasPermission(session.user.role as any, 'canViewReports')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view reports' },
        { status: 403 }
      )
    }

    const { flagId } = await params
    
    if (!flagId) {
      return NextResponse.json(
        { error: 'Flag ID is required' },
        { status: 400 }
      )
    }

    const reports = await ReportingService.getReports('PENDING', 1, 1000)
    const report = reports.reports.find(r => r.id === flagId)

    if (!report) {
      // Try other statuses
      const allStatuses = ['REVIEWED', 'RESOLVED', 'DISMISSED', 'ESCALATED']
      for (const status of allStatuses) {
        const otherReports = await ReportingService.getReports(status as any, 1, 1000)
        const foundReport = otherReports.reports.find(r => r.id === flagId)
        if (foundReport) {
          return NextResponse.json({ report: foundReport })
        }
      }
      
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ report })

  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}