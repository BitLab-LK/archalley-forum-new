import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { encode } from "next-auth/jwt"

export async function POST(request: NextRequest) {
  try {
    const { email, provider } = await request.json()

    // Find the user and their linked account
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        Account: {
          where: { provider }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.Account.length === 0) {
      return NextResponse.json({ error: "Social account not linked" }, { status: 400 })
    }

    // Create a JWT token for the user
    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        isVerified: user.isVerified,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      },
      secret: process.env.NEXTAUTH_SECRET!,
    })

// Set the session cookie
    const response = NextResponse.json({ 
      success: true,
      message: "Auto-login successful",
      redirectTo: "/"
    })

    // Set the NextAuth session cookie
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error) {
    console.error("Auto-login error:", error)
    return NextResponse.json({ error: "Auto-login failed" }, { status: 500 })
  }
}

