import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { encode } from "next-auth/jwt"
import { logAuthEvent } from "@/lib/audit-log"
import { checkRateLimit } from "@/lib/security"

/**
 * Helper function to create response with CORS headers
 */
function createCorsResponse(data: any, status: number, request: NextRequest) {
  const response = NextResponse.json(data, { status })
  
  // Add CORS headers (even though same-origin, helps with some edge cases)
  const origin = request.headers.get('origin')
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

/**
 * POST /api/auth/google-one-tap
 * Verify Google One Tap ID token and create session
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 attempts per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const rateLimitKey = `google-one-tap:${ip}`
    
    if (!checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000)) {
      await logAuthEvent("RATE_LIMIT_EXCEEDED", {
        email: null,
        ipAddress: ip,
        success: false,
        details: { action: "google_one_tap", rateLimitKey },
        errorMessage: "Too many Google One Tap attempts",
      })
      return createCorsResponse(
        { error: "Too many attempts. Please try again later." },
        429,
        request
      )
    }

    const body = await request.json()
    const { credential } = body

    if (!credential) {
      return createCorsResponse(
        { error: "Missing credential" },
        400,
        request
      )
    }

    // Verify the Google ID token with Google's tokeninfo endpoint
    let tokenInfo;
    try {
      const tokenInfoResponse = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (!tokenInfoResponse.ok) {
        const errorText = await tokenInfoResponse.text()
        console.error("Google token verification failed:", tokenInfoResponse.status, errorText)
        await logAuthEvent("LOGIN_FAILED", {
          email: null,
          ipAddress: ip,
          success: false,
          details: { action: "google_one_tap", reason: "token_verification_failed", status: tokenInfoResponse.status },
          errorMessage: `Token verification failed: ${tokenInfoResponse.status}`,
        })
        return createCorsResponse(
          { error: "Invalid Google token" },
          401,
          request
        )
      }

      tokenInfo = await tokenInfoResponse.json()
    } catch (fetchError) {
      console.error("Error fetching token info:", fetchError)
      await logAuthEvent("LOGIN_FAILED", {
        email: null,
        ipAddress: ip,
        success: false,
        details: { action: "google_one_tap", reason: "token_verification_network_error" },
        errorMessage: fetchError instanceof Error ? fetchError.message : "Network error during token verification",
      })
      return createCorsResponse(
        { error: "Failed to verify token" },
        500,
        request
      )
    }

    // Verify the token is for our client ID
    if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
      console.error("Token audience mismatch:", tokenInfo.aud, "expected:", process.env.GOOGLE_CLIENT_ID)
      return createCorsResponse(
        { error: "Invalid token audience" },
        401,
        request
      )
    }

    // Extract user information from token
    const email = tokenInfo.email
    const name = tokenInfo.name
    const picture = tokenInfo.picture
    const sub = tokenInfo.sub // Google user ID

    if (!email) {
      return createCorsResponse(
        { error: "Email not found in token" },
        400,
        request
      )
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isVerified: true,
        emailVerified: true,
        isSuspended: true,
        isBanned: true,
      }
    })

    // Handle new user - redirect to registration
    if (!existingUser) {
      await logAuthEvent("LOGIN_FAILED", {
        email: email.toLowerCase(),
        ipAddress: ip,
        success: false,
        details: { action: "google_one_tap", reason: "user_not_found" },
        errorMessage: "User not found - needs registration",
      })
      
      // Return redirect URL for registration
      return createCorsResponse({
        error: "User not found",
        redirectTo: `/auth/register?provider=google&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name || '')}&image=${encodeURIComponent(picture || '')}&providerAccountId=${encodeURIComponent(sub)}&message=${encodeURIComponent('Complete your profile to join our community!')}`
      }, 404, request)
    }

    // Check if user account is suspended or banned
    if (existingUser.isBanned) {
      await logAuthEvent("LOGIN_FAILED", {
        userId: existingUser.id,
        email: existingUser.email,
        ipAddress: ip,
        success: false,
        details: { action: "google_one_tap", reason: "account_banned" },
        errorMessage: "Account is banned",
      })
      return createCorsResponse(
        { error: "Account is banned" },
        403,
        request
      )
    }

    if (existingUser.isSuspended) {
      await logAuthEvent("LOGIN_FAILED", {
        userId: existingUser.id,
        email: existingUser.email,
        ipAddress: ip,
        success: false,
        details: { action: "google_one_tap", reason: "account_suspended" },
        errorMessage: "Account is suspended",
      })
      return createCorsResponse(
        { error: "Account is suspended" },
        403,
        request
      )
    }

    // Auto-verify email if needed (Google tokens are verified)
    if (!existingUser.isVerified || !existingUser.emailVerified) {
      await prisma.users.update({
        where: { id: existingUser.id },
        data: {
          isVerified: true,
          emailVerified: existingUser.emailVerified || new Date(),
        }
      })
    }

    // Check if Google account is linked, if not, link it
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: sub,
        }
      }
    })

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          type: "oauth",
          provider: "google",
          providerAccountId: sub,
        }
      })
    }

    // Update user info if needed (preserve uploaded images)
    const isCurrentImageFromSSO = existingUser.image && (
      existingUser.image.includes('googleusercontent.com') ||
      existingUser.image.includes('facebook.com') ||
      existingUser.image.includes('fbcdn.net') ||
      existingUser.image.includes('linkedin.com') ||
      existingUser.image.includes('licdn.com')
    )
    
    if (!existingUser.image || isCurrentImageFromSSO) {
      await prisma.users.update({
        where: { id: existingUser.id },
        data: {
          name: name || existingUser.name,
          image: picture || existingUser.image,
          updatedAt: new Date(),
        }
      })
    }

    // Create JWT token for NextAuth session
    const jwtToken = await encode({
      token: {
        sub: existingUser.id,
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        image: existingUser.image,
        role: existingUser.role,
        isVerified: existingUser.isVerified,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      },
      secret: process.env.NEXTAUTH_SECRET!,
    })

    // Log successful login
    await logAuthEvent("LOGIN_SUCCESS", {
      userId: existingUser.id,
      email: existingUser.email,
      ipAddress: ip,
      success: true,
      details: { action: "google_one_tap", provider: "google" },
    })

    // Create response with CORS headers
    const origin = request.headers.get('origin')
    const response = NextResponse.json({
      success: true,
      message: "Google One Tap login successful",
    })
    
    // Add CORS headers
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // Set the NextAuth session cookie
    response.cookies.set("next-auth.session-token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    // Also set the secure cookie name for production
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
    console.error("Google One Tap error:", error)
    await logAuthEvent("LOGIN_FAILED", {
      email: null,
      success: false,
      details: { action: "google_one_tap", reason: "server_error" },
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    })
    return createCorsResponse(
      { error: "Authentication failed" },
      500,
      request
    )
  }
}

/**
 * OPTIONS /api/auth/google-one-tap
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const response = new NextResponse(null, { status: 204 })
  
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
  
  return response
}

