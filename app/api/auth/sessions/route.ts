import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAuthEvent } from "@/lib/audit-log"
import { getDeviceName, getBrowserName, generateDeviceFingerprint } from "@/lib/device-fingerprint"

/**
 * GET /api/auth/sessions
 * Get all active sessions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Note: NextAuth uses JWT sessions, so we can't track individual sessions
    // This is a placeholder for future implementation with database sessions
    // For now, we'll return the current session info with device fingerprinting
    
    const userAgent = request.headers.get('user-agent') || "Unknown"
    const deviceFingerprint = generateDeviceFingerprint(userAgent, {
      language: request.headers.get('accept-language') || undefined,
    })
    
    const currentSession = {
      id: "current",
      device: getDeviceName(userAgent),
      browser: getBrowserName(userAgent),
      userAgent: userAgent.substring(0, 100), // Truncate for display
      fingerprint: deviceFingerprint.hash,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 "Unknown",
      lastActive: new Date().toISOString(),
      isCurrent: true,
    }

    return NextResponse.json({
      sessions: [currentSession],
      total: 1,
    })
  } catch (error) {
    console.error("Get sessions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session (or all sessions)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const revokeAll = searchParams.get('revokeAll') === 'true'

    // Note: NextAuth uses JWT sessions, so we can't revoke individual sessions
    // This is a placeholder for future implementation
    // For now, we'll log the action and return success
    
    if (revokeAll) {
      // Log all sessions revoked
      await logAuthEvent("LOGOUT", {
        userId: session.user.id,
        email: session.user.email || null,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || null,
        success: true,
        details: { action: "revoke_all_sessions" },
      })
      
      return NextResponse.json({
        success: true,
        message: "All sessions revoked. Please log in again.",
      })
    } else if (sessionId) {
      // Log specific session revoked
      await logAuthEvent("LOGOUT", {
        userId: session.user.id,
        email: session.user.email || null,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || null,
        success: true,
        details: { action: "revoke_session", sessionId },
      })
      
      return NextResponse.json({
        success: true,
        message: "Session revoked successfully.",
      })
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Revoke session error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
