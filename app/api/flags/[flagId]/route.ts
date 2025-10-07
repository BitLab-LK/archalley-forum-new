import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAdminAccess, logAdminAction } from '@/lib/admin-security'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    const validationResult = await validateAdminAccess(request)
    if (!validationResult.isValid || !validationResult.session?.user?.id) {
      return validationResult.response
    }
    const { session } = validationResult

    const { flagId } = await params
    const body = await request.json()
    const { status, adminNote } = body

    if (!flagId) {
      return NextResponse.json(
        { error: 'Flag ID is required' },
        { status: 400 }
      )
    }

    if (!status || !['REVIEWED', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (REVIEWED, RESOLVED, DISMISSED)' },
        { status: 400 }
      )
    }

    const flag = await prisma.postFlag.findUnique({
      where: { id: flagId }
    })

    if (!flag) {
      return NextResponse.json(
        { error: 'Flag not found' },
        { status: 404 }
      )
    }

    const updatedFlag = await prisma.postFlag.update({
      where: { id: flagId },
      data: {
        status: status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: adminNote
      }
    })

    await logAdminAction(session.user.id, 'FLAG_UPDATED', {
      flagId,
      newStatus: status,
      adminNote,
      postId: flag.postId
    })

    return NextResponse.json({
      success: true,
      message: `Flag ${status.toLowerCase()} successfully`,
      flag: updatedFlag
    })

  } catch (error) {
    console.error('Error updating flag:', error)
    return NextResponse.json(
      { error: 'Failed to update flag' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    const validationResult = await validateAdminAccess(request)
    if (!validationResult.isValid || !validationResult.session?.user?.id) {
      return validationResult.response
    }
    const { session } = validationResult

    const { flagId } = await params

    if (!flagId) {
      return NextResponse.json(
        { error: 'Flag ID is required' },
        { status: 400 }
      )
    }

    const flag = await prisma.postFlag.findUnique({
      where: { id: flagId }
    })

    if (!flag) {
      return NextResponse.json(
        { error: 'Flag not found' },
        { status: 404 }
      )
    }

    await prisma.postFlag.delete({
      where: { id: flagId }
    })

    await logAdminAction(session.user.id, 'FLAG_DELETED', {
      flagId,
      postId: flag.postId
    })

    return NextResponse.json({
      success: true,
      message: 'Flag deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting flag:', error)
    return NextResponse.json(
      { error: 'Failed to delete flag' },
      { status: 500 }
    )
  }
}