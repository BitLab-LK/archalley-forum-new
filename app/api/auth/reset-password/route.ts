import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import bcrypt from "bcryptjs"
import { z } from "zod"
import crypto from "crypto"
import { logAuthEvent } from "@/lib/audit-log"

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters").refine((pwd) => {
    // Require at least one uppercase, one lowercase, one number, and one special character
    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasLowerCase = /[a-z]/.test(pwd)
    const hasNumber = /[0-9]/.test(pwd)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar
  }, "Password must contain uppercase, lowercase, number, and special character"),
})

/**
 * POST /api/auth/reset-password
 * Reset password using a reset token
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 reset attempts per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimitKey = `reset-password:${ip}`
    
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate input
    const { token, password } = resetPasswordSchema.parse(body)

    // Find reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      const userAgent = request.headers.get('user-agent') || null
      await logAuthEvent("PASSWORD_RESET_FAILED", {
        email: null,
        ipAddress: ip,
        userAgent,
        success: false,
        details: { action: "password_reset", reason: "invalid_token" },
        errorMessage: "Invalid or expired reset token",
      })
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token: resetToken.token },
      })
      const userAgent = request.headers.get('user-agent') || null
      await logAuthEvent("PASSWORD_RESET_FAILED", {
        email: resetToken.identifier.toLowerCase(),
        ipAddress: ip,
        userAgent,
        success: false,
        details: { action: "password_reset", reason: "expired_token" },
        errorMessage: "Reset token has expired",
      })
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email: resetToken.identifier },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Hash new password (using 14 rounds for better security)
    const hashedPassword = await bcrypt.hash(password, 14)

    // Update password and delete reset token in a transaction
    await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }),
      prisma.verificationToken.delete({
        where: { token: resetToken.token },
      }),
    ])

    // Log password reset success
    const userAgent = request.headers.get('user-agent') || null
    await logAuthEvent("PASSWORD_RESET_SUCCESS", {
      userId: user.id,
      email: user.email.toLowerCase(),
      ipAddress: ip,
      userAgent,
      success: true,
      details: { action: "password_reset" },
    })

    // Invalidate all existing sessions by updating user's updatedAt
    // (This will cause JWT validation to fail on next request)
    // Note: In production, you might want to implement a session blacklist

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password."
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      )
    }

    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    )
  }
}
