import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import { logAuthEvent } from "@/lib/audit-log"
import { encode } from "next-auth/jwt"

/**
 * GET /api/auth/verify-magic-link?token=xxx
 * Verify magic link token and log user in
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 10 attempts per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimitKey = `verify-magic-link:${ip}`
    
    if (!checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000)) {
      await logAuthEvent("RATE_LIMIT_EXCEEDED", {
        email: null,
        ipAddress: ip,
        success: false,
        details: { action: "verify_magic_link", rateLimitKey },
        errorMessage: "Too many magic link verification attempts",
      })
      return NextResponse.redirect(
        new URL('/auth/register?tab=login&error=Too many verification attempts. Please try again later.', request.url)
      )
    }

    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/register?tab=login&error=Invalid magic link token.', request.url)
      )
    }

    // Find magic link token
    const magicLinkToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!magicLinkToken) {
      await logAuthEvent("LOGIN_FAILED", {
        email: null,
        ipAddress: ip,
        success: false,
        details: { action: "verify_magic_link", reason: "invalid_token" },
        errorMessage: "Invalid magic link token",
      })
      return NextResponse.redirect(
        new URL('/auth/register?tab=login&error=Invalid or expired magic link. Please request a new one.', request.url)
      )
    }

    // Check if token is expired
    if (magicLinkToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token: magicLinkToken.token },
      })
      await logAuthEvent("LOGIN_FAILED", {
        email: magicLinkToken.identifier.toLowerCase(),
        ipAddress: ip,
        success: false,
        details: { action: "verify_magic_link", reason: "expired_token" },
        errorMessage: "Magic link token expired",
      })
      return NextResponse.redirect(
        new URL('/auth/register?tab=login&error=Magic link has expired. Please request a new one.', request.url)
      )
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email: magicLinkToken.identifier },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isVerified: true,
      },
    })

    if (!user) {
      await logAuthEvent("LOGIN_FAILED", {
        email: magicLinkToken.identifier.toLowerCase(),
        ipAddress: ip,
        success: false,
        details: { action: "verify_magic_link", reason: "user_not_found" },
        errorMessage: "User not found",
      })
      return NextResponse.redirect(
        new URL('/auth/register?tab=login&error=User not found.', request.url)
      )
    }

    // Check if email is verified
    if (!user.isVerified) {
      await logAuthEvent("LOGIN_FAILED", {
        userId: user.id,
        email: user.email.toLowerCase(),
        ipAddress: ip,
        success: false,
        details: { action: "verify_magic_link", reason: "email_not_verified" },
        errorMessage: "Email not verified",
      })
      return NextResponse.redirect(
        new URL('/auth/register?tab=login&error=Please verify your email address before using magic link login.', request.url)
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

    // Delete magic link token (one-time use)
    await prisma.verificationToken.delete({
      where: { token: magicLinkToken.token },
    })

    // Log successful magic link login
    const userAgent = request.headers.get('user-agent') || null
    await logAuthEvent("LOGIN_SUCCESS", {
      userId: user.id,
      email: user.email.toLowerCase(),
      ipAddress: ip,
      userAgent,
      success: true,
      details: { action: "login", provider: "magic_link" },
    })

    // Send login notification (async)
    const userWithSettings = await prisma.users.findUnique({
      where: { id: user.id },
      select: { emailNotifications: true, name: true },
    })

    if (userWithSettings?.emailNotifications !== false) {
      import("@/lib/email-service").then(({ sendLoginNotificationEmail }) => {
        sendLoginNotificationEmail(
          user.email,
          userWithSettings?.name || user.name || 'User',
          {
            ipAddress: ip,
            userAgent: userAgent || undefined,
            timestamp: new Date(),
          }
        ).catch((error) => {
          console.error("Failed to send login notification:", error)
        })
      })
    }

    // Get callback URL from sessionStorage or default to home
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    // Create redirect response with session cookie
    const redirectResponse = NextResponse.redirect(new URL(callbackUrl, request.url))
    
    // Set the NextAuth session cookie
    redirectResponse.cookies.set("next-auth.session-token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    if (process.env.NODE_ENV === "production") {
      redirectResponse.cookies.set("__Secure-next-auth.session-token", jwtToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
    }

    return redirectResponse
  } catch (error) {
    console.error("Magic link verification error:", error)
    return NextResponse.redirect(
      new URL('/auth/register?tab=login&error=An error occurred during magic link verification.', request.url)
    )
  }
}
