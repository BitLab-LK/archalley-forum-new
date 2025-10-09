import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { NextRequest } from "next/server"

/**
 * Security middleware for admin API routes
 * Validates session and admin role before allowing access
 */
export async function validateAdminAccess(request?: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session?.user) {
      console.warn("🚫 Admin API access denied: No session")
      return {
        isValid: false,
        response: new NextResponse(
          JSON.stringify({ error: "Authentication required" }), 
          { 
            status: 401,
            headers: { "Content-Type": "application/json" }
          }
        )
      }
    }

    // Check if user has admin role (ADMIN, SUPER_ADMIN, or MODERATOR)
    const userRole = session.user.role as string;
    if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(userRole)) {
      console.warn("🚫 Admin API access denied:", {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        ip: request?.headers.get("x-forwarded-for") || request?.headers.get("x-real-ip") || "unknown"
      })
      
      return {
        isValid: false,
        response: new NextResponse(
          JSON.stringify({ error: "Admin access required" }), 
          { 
            status: 403,
            headers: { "Content-Type": "application/json" }
          }
        )
      }
    }

    console.log("✅ Admin API access granted:", {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role
    })

    return {
      isValid: true,
      session,
      user: session.user
    }
  } catch (error) {
    console.error("❌ Admin access validation error:", error)
    return {
      isValid: false,
      response: new NextResponse(
        JSON.stringify({ error: "Authentication verification failed" }), 
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }
  }
}

/**
 * Rate limiting helper for admin actions
 */
export function createRateLimit(windowMs: number = 60000, maxRequests: number = 100) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return function rateLimit(identifier: string) {
    const now = Date.now()
    const key = identifier
    const window = requests.get(key)

    if (!window || now > window.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs })
      return { allowed: true, remaining: maxRequests - 1 }
    }

    if (window.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: window.resetTime }
    }

    window.count++
    return { allowed: true, remaining: maxRequests - window.count }
  }
}

/**
 * Input sanitization helper
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, 1000) // Limit length
    .trim()
}

/**
 * Audit logging for admin actions
 */
export function logAdminAction(action: string, userId: string, details?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    details: details || {},
    ip: details?.ip || 'unknown'
  }
  
  console.log('🔍 Admin Action:', logEntry)
  
  // In production, you might want to send this to a logging service
  // await sendToAuditLog(logEntry)
}