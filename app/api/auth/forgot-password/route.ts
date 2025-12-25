import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import { sendPasswordResetEmail } from "@/lib/email-service"
import { logAuthEvent } from "@/lib/audit-log"
import crypto from "crypto"

/**
 * POST /api/auth/forgot-password
 * Request password reset for an email address
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimitKey = `forgot-password:${ip}`
    
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Always return success message to prevent account enumeration
    // Check if user exists (but don't reveal this)
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Send reset email if user exists (including OAuth-only accounts)
    if (user) {
      const isOAuthOnly = !user.password
      console.log(`📧 User found${isOAuthOnly ? ' (OAuth-only, will set first password)' : ''}, generating reset token for: ${user.email}`)
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const expires = new Date()
      expires.setHours(expires.getHours() + 1) // Token expires in 1 hour

      // Store reset token in database
      await prisma.verificationToken.create({
        data: {
          id: crypto.randomUUID(),
          identifier: user.email,
          token: resetToken,
          expires,
        },
      })
      console.log(`✅ Reset token created and stored in database`)

      // Send password reset email
      try {
        console.log(`📤 Attempting to send password reset email to: ${user.email}`)
        await sendPasswordResetEmail(user.email, user.name || 'User', resetToken)
        console.log(`✅ Password reset email function completed for: ${user.email}`)
        
        // Log password reset request
        const userAgent = request.headers.get('user-agent') || null
        await logAuthEvent("PASSWORD_RESET_REQUESTED", {
          userId: user.id,
          email: user.email.toLowerCase(),
          ipAddress: ip,
          userAgent,
          success: true,
          details: { 
            action: "password_reset_request",
            isOAuthOnly: isOAuthOnly,
          },
        })
      } catch (emailError) {
        console.error("❌ Failed to send password reset email:", emailError)
        // Don't reveal email sending failure to user
      }
    } else {
      console.log(`ℹ️ No user found with email: ${email}`)
    }

    // Always return success message (to prevent account enumeration)
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent to your inbox."
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    )
  }
}
