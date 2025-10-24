import { prisma } from '@/lib/prisma'
import { FlagReason, FlagStatus, FlagSeverity, ModerationActionType } from '@prisma/client'

export interface CreateReportRequest {
  postId: string
  reason: FlagReason
  customReason?: string
  description?: string
  severity?: FlagSeverity
}

export interface ReviewReportRequest {
  flagId: string
  status: FlagStatus
  reviewNotes?: string
  moderationAction?: ModerationActionType
  moderationReason?: string
}

export interface ReportWithDetails {
  id: string
  reason: FlagReason
  customReason?: string | null
  description?: string | null
  status: FlagStatus
  severity: FlagSeverity
  createdAt: Date
  updatedAt: Date
  reviewedAt?: Date | null
  reviewNotes?: string | null
  ipAddress?: string | null
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  post: {
    id: string
    content: string
    createdAt: Date
    isHidden: boolean
    isFlagged: boolean
    authorId: string
    author: {
      id: string
      name: string | null
      email: string | null
      image: string | null
    }
  }
  reviewer?: {
    id: string
    name: string | null
    email: string | null
    role: string | null
  } | null
}

export class ReportingService {
  /**
   * Create a new report for a post
   */
  static async createReport(
    userId: string, 
    request: CreateReportRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; flagId?: string; error?: string }> {
    try {
      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: request.postId },
        select: { id: true, authorId: true, isFlagged: true }
      })

      if (!post) {
        return { success: false, error: 'Post not found' }
      }

      // Prevent users from flagging their own posts
      if (post.authorId === userId) {
        return { success: false, error: 'You cannot flag your own post' }
      }

      // Check if user has already flagged this post for the same reason
      const existingFlag = await prisma.postFlag.findFirst({
        where: {
          userId,
          postId: request.postId,
          reason: request.reason
        }
      })

      if (existingFlag) {
        return { success: false, error: 'You have already flagged this post for this reason' }
      }

      // Create the flag in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the flag
        const flag = await tx.postFlag.create({
          data: {
            userId,
            postId: request.postId,
            reason: request.reason,
            customReason: request.customReason,
            description: request.description,
            severity: request.severity || 'MEDIUM',
            status: 'PENDING',
            ipAddress,
            userAgent
          }
        })

        // Update post flag count and status
        const flagCount = await tx.postFlag.count({
          where: { 
            postId: request.postId,
            status: { in: ['PENDING', 'REVIEWED'] }
          }
        })

        // Mark post as flagged if it has any pending/reviewed flags
        if (flagCount > 0) {
          await tx.post.update({
            where: { id: request.postId },
            data: { 
              isFlagged: true,
              flagCount,
              moderationStatus: 'FLAGGED'
            }
          })
        }

        return flag
      })

      // Create notification for moderators
      await this.notifyModerators(request.postId, result.id, request.reason)

      // Broadcast real-time update to all admin dashboards
      try {
        const io = (global as any).io
        if (io) {
          // Get user and post details for broadcast
          const flagDetails = await prisma.postFlag.findUnique({
            where: { id: result.id },
            include: {
              user: {
                select: { id: true, name: true, role: true }
              },
              post: {
                select: { 
                  id: true, 
                  content: true,
                  authorId: true,
                  users: {
                    select: { id: true, name: true }
                  }
                }
              }
            }
          })

          if (flagDetails) {
            // Broadcast to all users with moderation privileges
            io.emit('newFlagCreated', {
              flagId: result.id,
              postId: request.postId,
              reason: request.reason,
              severity: request.severity || 'MEDIUM',
              reportedBy: flagDetails.user,
              postAuthor: flagDetails.post.users,
              postContent: flagDetails.post.content.substring(0, 100) + '...',
              createdAt: new Date().toISOString(),
              message: `New ${request.severity || 'medium'} priority flag: ${request.reason}`
            })

            // Also broadcast general stats update
            io.emit('moderationStatsUpdate', {
              type: 'flagCreated',
              timestamp: new Date().toISOString()
            })
          }
        }
      } catch (broadcastError) {
        console.warn('Failed to broadcast new flag update:', broadcastError)
        // Continue execution - don't fail the operation due to broadcast issues
      }

      return { success: true, flagId: result.id }
    } catch (error) {
      console.error('Error creating report:', error)
      return { success: false, error: 'Failed to create report' }
    }
  }

  /**
   * Get reports for moderation queue
   */
  static async getReports(
    status: FlagStatus = 'PENDING',
    page: number = 1,
    limit: number = 20,
    severity?: FlagSeverity
  ): Promise<{
    reports: ReportWithDetails[]
    pagination: {
      currentPage: number
      totalPages: number
      totalReports: number
      hasNext: boolean
      hasPrev: boolean
    }
  }> {
    const where: any = { status }
    if (severity) where.severity = severity

    const [reports, totalReports] = await Promise.all([
      prisma.postFlag.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          post: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              isHidden: true,
              isFlagged: true,
              authorId: true,
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.postFlag.count({ where })
    ])

    return {
      reports: reports.map(report => ({
        ...report,
        post: {
          ...report.post,
          author: report.post.users
        }
      })) as ReportWithDetails[],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReports / limit),
        totalReports,
        hasNext: page < Math.ceil(totalReports / limit),
        hasPrev: page > 1
      }
    }
  }

  /**
   * Review a report (approve, dismiss, escalate)
   */
  static async reviewReport(
    moderatorId: string,
    request: ReviewReportRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const flag = await prisma.postFlag.findUnique({
        where: { id: request.flagId },
        include: { post: true }
      })

      if (!flag) {
        return { success: false, error: 'Report not found' }
      }

      if (flag.status !== 'PENDING' && flag.status !== 'REVIEWED') {
        return { success: false, error: 'Report has already been processed' }
      }

      await prisma.$transaction(async (tx) => {
        // Update the flag
        await tx.postFlag.update({
          where: { id: request.flagId },
          data: {
            status: request.status,
            reviewedBy: moderatorId,
            reviewedAt: new Date(),
            reviewNotes: request.reviewNotes
          }
        })

        // If resolving or dismissing, check if post should be unflagged
        if (request.status === 'RESOLVED' || request.status === 'DISMISSED') {
          // Count remaining flags BEFORE updating this one
          const remainingFlags = await tx.postFlag.count({
            where: {
              postId: flag.postId,
              status: { in: ['PENDING', 'REVIEWED'] },
              id: { not: request.flagId } // Exclude the current flag being resolved
            }
          })

          // If no remaining flags, update post status
          if (remainingFlags === 0) {
            await tx.post.update({
              where: { id: flag.postId },
              data: {
                isFlagged: false,
                flagCount: 0,
                moderationStatus: 'APPROVED'
              }
            })
          } else {
            // Update flag count to reflect remaining flags
            await tx.post.update({
              where: { id: flag.postId },
              data: {
                flagCount: remainingFlags
              }
            })
          }
        }

        // If a moderation action is specified, perform it
        if (request.moderationAction) {
          await this.performModerationAction(
            tx,
            moderatorId,
            flag.postId,
            request.moderationAction,
            request.moderationReason
          )
        }

        // Log the moderation action
        await tx.moderationAction.create({
          data: {
            action: 'APPROVE_FLAG',
            reason: request.reviewNotes,
            postId: flag.postId,
            moderatorId,
            metadata: {
              flagId: request.flagId,
              flagReason: flag.reason,
              reviewStatus: request.status
            }
          }
        })
      })

      // Broadcast real-time update to all admin dashboards after successful review
      try {
        const io = (global as any).io
        if (io && request.status === 'RESOLVED') {
          // Get moderator details for broadcast
          const moderator = await prisma.users.findUnique({
            where: { id: moderatorId },
            select: { id: true, name: true, role: true }
          })

          io.emit('flagsResolved', {
            postId: flag.postId,
            flagId: request.flagId,
            resolvedBy: moderator,
            resolvedAt: new Date().toISOString(),
            reviewNotes: request.reviewNotes,
            message: `Flag resolved by ${moderator?.name || 'Moderator'}`
          })

          // Also broadcast general post update
          io.emit('postModerationUpdate', {
            postId: flag.postId,
            action: 'flagReviewed',
            updatedBy: moderator,
            updatedAt: new Date().toISOString()
          })
        }
      } catch (broadcastError) {
        console.warn('Failed to broadcast flag review update:', broadcastError)
        // Continue execution - don't fail the operation due to broadcast issues
      }

      return { success: true }
    } catch (error) {
      console.error('Error reviewing report:', error)
      return { success: false, error: 'Failed to review report' }
    }
  }

  /**
   * Get moderation history for a post
   */
  static async getModerationHistory(postId: string) {
    return await prisma.moderationAction.findMany({
      where: { postId },
      include: {
        moderator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { moderatedAt: 'desc' }
    })
  }

  /**
   * Get statistics for moderation dashboard
   */
  static async getModerationStats() {
    const [
      pendingReports,
      reviewedReports,
      resolvedReports,
      dismissedReports,
      escalatedReports,
      flaggedPosts
    ] = await Promise.all([
      prisma.postFlag.count({ where: { status: 'PENDING' } }),
      prisma.postFlag.count({ where: { status: 'REVIEWED' } }),
      prisma.postFlag.count({ where: { status: 'RESOLVED' } }),
      prisma.postFlag.count({ where: { status: 'DISMISSED' } }),
      prisma.postFlag.count({ where: { status: 'ESCALATED' } }),
      prisma.post.count({ where: { isFlagged: true } })
    ])

    return {
      pendingReports,
      reviewedReports,
      resolvedReports,
      dismissedReports,
      escalatedReports,
      flaggedPosts,
      totalReports: pendingReports + reviewedReports + resolvedReports + dismissedReports + escalatedReports
    }
  }

  /**
   * Perform moderation action on a post
   */
  private static async performModerationAction(
    tx: any,
    moderatorId: string,
    postId: string,
    action: ModerationActionType,
    reason?: string
  ) {
    const updateData: any = {
      lastModeratedAt: new Date(),
      moderatedBy: moderatorId,
      moderationReason: reason
    }

    switch (action) {
      case 'HIDE_POST':
        updateData.isHidden = true
        updateData.moderationStatus = 'HIDDEN'
        break
      case 'UNHIDE_POST':
        updateData.isHidden = false
        updateData.moderationStatus = 'APPROVED'
        break
      case 'DELETE_POST':
        updateData.moderationStatus = 'REMOVED'
        break
      case 'PIN_POST':
        updateData.isPinned = true
        break
      case 'UNPIN_POST':
        updateData.isPinned = false
        break
      case 'LOCK_POST':
        updateData.isLocked = true
        break
      case 'UNLOCK_POST':
        updateData.isLocked = false
        break
    }

    await tx.post.update({
      where: { id: postId },
      data: updateData
    })

    // Log the action
    await tx.moderationAction.create({
      data: {
        action,
        reason,
        postId,
        moderatorId
      }
    })
  }

  /**
   * Notify moderators of new reports
   */
  private static async notifyModerators(postId: string, flagId: string, reason: FlagReason) {
    try {
      // Get all moderators and admins
      const moderators = await prisma.users.findMany({
        where: {
          role: { in: ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'] }
        },
        select: { id: true }
      })

      // Create notifications
      const notifications = moderators.map(moderator => ({
        id: `flag_${flagId}_${moderator.id}`,
        type: 'MODERATION_ACTION' as const,
        title: 'New Post Report',
        message: `A post has been reported for ${reason.toLowerCase().replace('_', ' ')}`,
        userId: moderator.id,
        data: {
          flagId,
          postId,
          reason,
          action: 'new_report'
        }
      }))

      await prisma.notifications.createMany({
        data: notifications,
        skipDuplicates: true
      })
    } catch (error) {
      console.error('Error notifying moderators:', error)
      // Don't throw - notification failure shouldn't break report creation
    }
  }
}