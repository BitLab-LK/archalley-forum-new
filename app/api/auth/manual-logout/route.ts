import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ 
        success: true, 
        message: "No active session found" 
      })
    }

    // Log the logout attempt
    console.log("Logout attempt for user:", session.user.email)

    // In production, we need to manually clear cookies and ensure proper logout
    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    })

    // Clear NextAuth cookies manually in production
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Set to past date to delete
    }

    // Clear all potential NextAuth cookies
    response.cookies.set('next-auth.session-token', '', cookieOptions)
    response.cookies.set('__Secure-next-auth.session-token', '', {
      ...cookieOptions,
      secure: true,
    })
    response.cookies.set('next-auth.csrf-token', '', cookieOptions)
    response.cookies.set('__Host-next-auth.csrf-token', '', {
      ...cookieOptions,
      secure: true,
    })

    return response
  } catch (error) {
    console.error("Manual logout error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Logout failed"
    }, { status: 500 })
  }
}
