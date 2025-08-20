import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      success: true,
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          isAuthenticated: true
        }
      } : null,
      cookies: request.cookies.getAll(),
      headers: {
        'user-agent': request.headers.get('user-agent'),
        'authorization': request.headers.get('authorization'),
      }
    })
  } catch (error) {
    console.error("Session test error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      session: null
    }, { status: 500 })
  }
}
