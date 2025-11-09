import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import { logAuthEvent } from "@/lib/audit-log"
import { sendMagicLinkEmail } from "@/lib/email-service"
import crypto from "crypto"
import { z } from "zod"

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
})

/**
 * POST /api/auth/magic-link
 * Request a magic link for passwordless login
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimitKey = `magic-link:${ip}`
    
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      await logAuthEvent("RATE_LIMIT_EXCEEDED", {
        email: null,
        ipAddress: ip,
        success: false,
        details: { action: "magic_link_request", rateLimitKey },
        errorMessage: "Too many magic link requests",
      })
      return NextResponse.json(
        { error: "Too many magic link requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = magicLinkSchema.parse(body)

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        emailVerified: true,
      },
    })

    // Always return success to prevent account enumeration
    // Only send magic link if user exists and is verified
    if (user && user.isVerified && user.emailVerified) {
      // Generate magic link token
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date()
      expires.setMinutes(expires.getMinutes() + 15) // Token expires in 15 minutes

      // Store magic link token
      await prisma.verificationToken.create({
        data: {
          id: crypto.randomUUID(),
          identifier: user.email,
          token: token,
          expires,
        },
      })

      // Send magic link email
      try {
        const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
        await sendMagicLinkEmail(user.email, userName, token)
        
        // Log magic link request
        const userAgent = request.headers.get('user-agent') || null
        await logAuthEvent("LOGIN_SUCCESS", {
          userId: user.id,
          email: user.email.toLowerCase(),
          ipAddress: ip,
          userAgent,
          success: true,
          details: { action: "magic_link_request" },
        })
      } catch (emailError) {
        console.error("Failed to send magic link email:", emailError)
        // Don't reveal email sending failure to user
      }
    }

    // Always return success message (to prevent account enumeration)
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists and is verified, a magic link has been sent to your inbox. The link will expire in 15 minutes."
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    console.error("Magic link error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    )
  }
}
