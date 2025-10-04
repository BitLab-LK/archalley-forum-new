import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for flag creation
const createFlagSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  reason: z.enum([
    'SPAM',
    'INAPPROPRIATE_CONTENT',
    'HARASSMENT',
    'MISINFORMATION',
    'COPYRIGHT_VIOLATION',
    'OFF_TOPIC',
    'OTHER'
  ], {
    errorMap: () => ({ message: 'Invalid reason' })
  }),
  details: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
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

    const { postId, reason, details } = validationResult.data

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Prevent users from flagging their own posts
    if (post.authorId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot flag your own post' },
        { status: 400 }
      )
    }

    // Check if user has already flagged this post
    const existingFlag = await prisma.flags.findFirst({
      where: {
        userId: session.user.id,
        postId: postId
      }
    })

    if (existingFlag) {
      return NextResponse.json(
        { error: 'You have already flagged this post' },
        { status: 400 }
      )
    }

    // Create the flag
    const flag = await prisma.flags.create({
      data: {
        id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        postId: postId,
        reason: details ? `${reason}: ${details}` : reason,
        status: 'PENDING',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Post flagged successfully',
      flagId: flag.id
    })

  } catch (error) {
    console.error('Error creating flag:', error)
    return NextResponse.json(
      { error: 'Failed to flag post' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin/moderator
    const userRole = session.user.role
    const isAuthorized = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'MODERATOR'
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const flags = await prisma.flags.findMany({
      where: {
        status: status as any,
        postId: { not: null }
      },
      include: {
        users: {
          select: {
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    const totalFlags = await prisma.flags.count({
      where: {
        status: status as any,
        postId: { not: null }
      }
    })

    return NextResponse.json({
      flags,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFlags / limit),
        totalFlags,
        hasNext: page < Math.ceil(totalFlags / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching flags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flags' },
      { status: 500 }
    )
  }
}