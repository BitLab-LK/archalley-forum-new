import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/security"
import { sendPasswordResetEmail } from "@/lib/email-service"
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

    // Only send reset email if user exists and has a password (not OAuth-only account)
    if (user && user.password) {
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

      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email, user.name || 'User', resetToken)
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError)
        // Don't reveal email sending failure to user
      }
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
