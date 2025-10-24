/**
 * Session Invalidation Service
 * Handles automatic logout when user roles are changed by admin
 */

import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { NextRequest } from "next/server"

/**
 * Check if user's session is still valid based on role changes
 * Returns false if user needs to re-authenticate due to role change
 */
export async function isSessionValid(request: NextRequest): Promise<{
  isValid: boolean
  reason?: string
  userId?: string
}> {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token || !token.id) {
      return { isValid: false, reason: "No valid token" }
    }

    // Get user's current role and roleChangedAt from database
    const user = await prisma.users.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        role: true,
        roleChangedAt: true,
        isBanned: true,
        isSuspended: true,
        suspendedUntil: true
      }
    })

    if (!user) {
      return { isValid: false, reason: "User not found", userId: token.id as string }
    }

    // Check if user is banned or suspended
    if (user.isBanned) {
      return { isValid: false, reason: "User is banned", userId: user.id }
    }

    if (user.isSuspended && (!user.suspendedUntil || user.suspendedUntil > new Date())) {
      return { isValid: false, reason: "User is suspended", userId: user.id }
    }

    // Check if role has changed since token was issued
    if (user.roleChangedAt && token.iat) {
      const tokenIssuedAt = new Date((token.iat as number) * 1000)
      
      if (user.roleChangedAt > tokenIssuedAt) {
        return { 
          isValid: false, 
          reason: "Role changed after session creation", 
          userId: user.id 
        }
      }
    }

    // Check if token role matches current database role
    if (token.role !== user.role) {
      return { 
        isValid: false, 
        reason: "Role mismatch between token and database", 
        userId: user.id 
      }
    }

    return { isValid: true, userId: user.id }
  } catch (error) {
    console.error("Error validating session:", error)
    // Return true for database errors to avoid blocking users unnecessarily
    // The basic token validation in middleware will still protect routes
    return { isValid: true, reason: "Session validation error - allowing with token" }
  }
}

/**
 * Invalidate user session by updating roleChangedAt timestamp
 * This will force re-authentication on next request
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  try {
    await prisma.users.update({
      where: { id: userId },
      data: { roleChangedAt: new Date() }
    })
    
    console.log(`✅ Sessions invalidated for user ${userId}`)
  } catch (error) {
    console.error(`❌ Failed to invalidate sessions for user ${userId}:`, error)
    throw error
  }
}

/**
 * Bulk invalidate sessions for multiple users
 */
export async function invalidateMultipleUserSessions(userIds: string[]): Promise<void> {
  try {
    await prisma.users.updateMany({
      where: { id: { in: userIds } },
      data: { roleChangedAt: new Date() }
    })
    
    console.log(`✅ Sessions invalidated for ${userIds.length} users`)
  } catch (error) {
    console.error(`❌ Failed to invalidate sessions for users:`, error)
    throw error
  }
}

/**
 * Check if current session token is expired based on role changes
 * For use in client-side components
 */
export function isTokenExpiredDueToRoleChange(
  tokenIssuedAt: number, 
  roleChangedAt: string | null
): boolean {
  if (!roleChangedAt) return false
  
  const tokenDate = new Date(tokenIssuedAt * 1000)
  const roleChangeDate = new Date(roleChangedAt)
  
  return roleChangeDate > tokenDate
}