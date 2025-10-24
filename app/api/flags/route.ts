import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReportingService } from '@/lib/reporting-service'
import { hasPermission } from '@/lib/role-permissions'
import { z } from 'zod'

// Validation schema for flag creation
const createFlagSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  reason: z.enum([
    'SPAM',
    'HARASSMENT',
    'HATE_SPEECH',
    'INAPPROPRIATE_CONTENT',
    'MISINFORMATION',
    'COPYRIGHT_VIOLATION',
    'PERSONAL_INFORMATION',
    'OFF_TOPIC',
    'DUPLICATE_CONTENT',
    'SCAM_FRAUD',
    'VIOLENCE_THREATS',
    'SEXUAL_CONTENT',
    'ILLEGAL_CONTENT',
    'OTHER'
  ], {
    errorMap: () => ({ message: 'Invalid reason' })
  }),
  customReason: z.string().optional(),
  description: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
})

/**
 * POST /api/flags - Create a new report
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user can report posts
    if (!hasPermission(session.user.role as any, 'canReportPosts')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to report posts' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validationResult = createFlagSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { postId, reason, customReason, description, severity } = validationResult.data

    // Get client IP and user agent for security tracking
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')

    const result = await ReportingService.createReport(
      session.user.id,
      {
        postId,
        reason: reason as any,
        customReason,
        description,
        severity: severity as any
      },
      ip || undefined,
      userAgent || undefined
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Post reported successfully',
      flagId: result.flagId
    })

  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to report post' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/flags - Get reports for moderation queue
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

    // Check if user can view reports
    if (!hasPermission(session.user.role as any, 'canViewReports')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view reports' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    const severity = searchParams.get('severity') as any

    // Validate status
    const validStatuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED', 'ESCALATED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter' },
        { status: 400 }
      )
    }

    const result = await ReportingService.getReports(
      status as any,
      page,
      limit,
      severity
    )

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}