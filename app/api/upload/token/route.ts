import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Generate upload token for client-side uploads
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, count } = body

    // Validate request
    if (!type || !count) {
      return NextResponse.json({ error: "Type and count are required" }, { status: 400 })
    }

    if (count > 5) {
      return NextResponse.json({ error: "Maximum 5 files allowed" }, { status: 400 })
    }

    // Generate a simple token (in production, use a proper JWT or similar)
    const token = Buffer.from(JSON.stringify({
      userId: session.user.id,
      type,
      count,
      timestamp: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    })).toString('base64')

    return NextResponse.json({ token })
    
  } catch (error) {
    console.error("Token generation error:", error)
    return NextResponse.json({ 
      error: "Failed to generate upload token",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
