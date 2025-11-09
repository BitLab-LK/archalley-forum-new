import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { encode } from "next-auth/jwt"

/**
 * Verify email with token (GET from email link or POST with code)
 * GET /api/auth/verify-email?token=xxx
 * POST /api/auth/verify-email { token: string, callbackUrl?: string }
 */
export async function GET(request: NextRequest) {
  return handleVerification(request, 'GET')
}

export async function POST(request: NextRequest) {
  return handleVerification(request, 'POST')
}

async function handleVerification(request: NextRequest, method: 'GET' | 'POST') {
  try {
    let token: string | null = null
    let callbackUrl = '/'

    if (method === 'GET') {
      const searchParams = request.nextUrl.searchParams
      token = searchParams.get('token')
      callbackUrl = searchParams.get('callbackUrl') || '/'
    } else {
      const body = await request.json()
      token = body.token
      callbackUrl = body.callbackUrl || '/'
    }

    if (!token) {
      if (method === 'GET') {
        return NextResponse.redirect(
          new URL('/auth/verify?error=Invalid verification token', request.url)
        )
      }
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    // Find verification token - support both full token and code (first 6 chars)
    let verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    // If not found and token is 6 chars, try to find by code (first 6 chars of stored tokens)
    if (!verificationToken && token.length === 6) {
      // Find all tokens that start with this code (case insensitive)
      const allTokens = await prisma.verificationToken.findMany({
        where: {
          token: {
            startsWith: token.toLowerCase(),
          },
        },
      })
      // Find exact 6-char match (case insensitive)
      verificationToken = allTokens.find(t => 
        t.token.toLowerCase().slice(0, 6) === token.toLowerCase()
      ) || null
    }

    if (!verificationToken) {
      if (method === 'GET') {
        return NextResponse.redirect(
          new URL('/auth/verify?error=Invalid or expired verification token', request.url)
        )
      }
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token: verificationToken.token },
      })
      if (method === 'GET') {
        return NextResponse.redirect(
          new URL('/auth/verify?error=Verification token has expired. Please request a new one.', request.url)
        )
      }
      return NextResponse.json({ error: "Verification token has expired. Please request a new one." }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      if (method === 'GET') {
        return NextResponse.redirect(
          new URL('/auth/verify?error=User not found', request.url)
        )
      }
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify email and delete token
    await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          isVerified: true,
        },
      }),
      prisma.verificationToken.delete({
        where: { token: verificationToken.token },
      }),
    ])

    // Create JWT token for auto-login
    // Note: Must include 'id' field (not just 'sub') for middleware validation
    const jwtToken = await encode({
      token: {
        sub: user.id,
        id: user.id, // Required for middleware validation
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        isVerified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      },
      secret: process.env.NEXTAUTH_SECRET!,
    })

    // For GET requests, redirect to verification page which will handle sessionStorage and redirect
    if (method === 'GET') {
      const verifyPageUrl = new URL('/auth/verify', request.url)
      verifyPageUrl.searchParams.set('token', verificationToken.token)
      verifyPageUrl.searchParams.set('verified', 'true')
      const redirectResponse = NextResponse.redirect(verifyPageUrl)
      
      redirectResponse.cookies.set("next-auth.session-token", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })

      if (process.env.NODE_ENV === "production") {
        redirectResponse.cookies.set("__Secure-next-auth.session-token", jwtToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 days
        })
      }
      
      return redirectResponse
    }

    // For POST requests (code verification), return JSON with redirect info
    const response = NextResponse.json({
      success: true,
      message: "Email verified successfully",
      redirectTo: callbackUrl,
    })

    // Set the NextAuth session cookie on POST response
    response.cookies.set("next-auth.session-token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    if (process.env.NODE_ENV === "production") {
      response.cookies.set("__Secure-next-auth.session-token", jwtToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })
    }

    return response
  } catch (error) {
    console.error("Email verification error:", error)
    if (method === 'GET') {
      return NextResponse.redirect(
        new URL('/auth/verify?error=An error occurred during verification', request.url)
      )
    }
    return NextResponse.json({ error: "An error occurred during verification" }, { status: 500 })
  }
}
