import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import { logAuthEvent } from "@/lib/audit-log"
import speakeasy from "speakeasy"
import { encode } from "next-auth/jwt"

/**
 * POST /api/auth/verify-2fa
 * Verify 2FA token during login
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 attempts per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimitKey = `verify-2fa:${ip}`
    
    if (!checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000)) {
      await logAuthEvent("RATE_LIMIT_EXCEEDED", {
        email: null,
        ipAddress: ip,
        success: false,
        details: { action: "verify_2fa", rateLimitKey },
        errorMessage: "Too many 2FA verification attempts",
      })
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, token, tempSessionToken } = body

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isVerified: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    })

    if (!user) {
      await logAuthEvent("LOGIN_FAILED", {
        email: email.toLowerCase(),
        ipAddress: ip,
        success: false,
        details: { action: "verify_2fa", reason: "user_not_found" },
        errorMessage: "User not found",
      })
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      await logAuthEvent("LOGIN_FAILED", {
        userId: user.id,
        email: user.email.toLowerCase(),
        ipAddress: ip,
        success: false,
        details: { action: "verify_2fa", reason: "2fa_not_enabled" },
        errorMessage: "2FA not enabled",
      })
      return NextResponse.json(
        { error: "2FA is not enabled for this account" },
        { status: 400 }
      )
    }

    // Verify the 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (60 seconds) before/after current time
    })

    if (!verified) {
      await logAuthEvent("LOGIN_FAILED", {
        userId: user.id,
        email: user.email.toLowerCase(),
        ipAddress: ip,
        success: false,
        details: { action: "verify_2fa", reason: "invalid_token" },
        errorMessage: "Invalid 2FA token",
      })
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 401 }
      )
    }

    // Create JWT token for the user
    const jwtToken = await encode({
      token: {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        isVerified: user.isVerified,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      },
      secret: process.env.NEXTAUTH_SECRET!,
    })

    // Log successful 2FA verification
    const userAgent = request.headers.get('user-agent') || null
    await logAuthEvent("LOGIN_SUCCESS", {
      userId: user.id,
      email: user.email.toLowerCase(),
      ipAddress: ip,
      userAgent,
      success: true,
      details: { action: "login", provider: "credentials", twoFactor: true },
    })

    // Send login notification email (async, don't wait)
    // Check if user has login notifications enabled (default: true)
    const userWithSettings = await prisma.users.findUnique({
      where: { id: user.id },
      select: { emailNotifications: true, name: true },
    })

    if (userWithSettings?.emailNotifications !== false) {
      // Send login notification asynchronously
      import("@/lib/email-service").then(({ sendLoginNotificationEmail }) => {
        sendLoginNotificationEmail(
          user.email,
          userWithSettings.name || user.name || 'User',
          {
            ipAddress: ip,
            userAgent,
            timestamp: new Date(),
          }
        ).catch((error) => {
          console.error("Failed to send login notification:", error)
        })
      })
    }

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: "2FA verification successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })

    // Set the NextAuth session cookie
    response.cookies.set("next-auth.session-token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    if (process.env.NODE_ENV === "production") {
      response.cookies.set("__Secure-next-auth.session-token", jwtToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
    }

    return response
  } catch (error) {
    console.error("2FA verification error:", error)
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 }
    )
  }
}
