/**
 * API endpoint for manually invalidating user sessions
 * Useful for emergency situations or security purposes
 */

import { NextRequest, NextResponse } from "next/server"
import { validateAdminAccess, logAdminAction } from "@/lib/admin-security"
import { invalidateUserSessions, invalidateMultipleUserSessions } from "@/lib/session-invalidation"

export async function POST(request: NextRequest) {
  try {
    const validation = await validateAdminAccess(request)
    
    if (!validation.isValid) {
      return validation.response!
    }

    const { user } = validation
    const body = await request.json()
    const { userIds, reason } = body

    if (!userIds || (!Array.isArray(userIds) && typeof userIds !== 'string')) {
      return new NextResponse("Invalid userIds parameter", { status: 400 })
    }

    const targetUserIds = Array.isArray(userIds) ? userIds : [userIds]
    
    if (targetUserIds.length === 0) {
      return new NextResponse("No user IDs provided", { status: 400 })
    }

    // Log admin action
    logAdminAction("INVALIDATE_USER_SESSIONS", user!.id, {
      targetUserIds,
      reason: reason || "Manual session invalidation",
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // Invalidate sessions
    if (targetUserIds.length === 1) {
      await invalidateUserSessions(targetUserIds[0])
    } else {
      await invalidateMultipleUserSessions(targetUserIds)
    }

    return NextResponse.json({ 
      message: `Sessions invalidated for ${targetUserIds.length} user(s)`,
      userIds: targetUserIds,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("[INVALIDATE_SESSIONS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}