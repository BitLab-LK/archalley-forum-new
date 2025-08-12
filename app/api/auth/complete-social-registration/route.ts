import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists (they should after completing registration)
    const user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user data for session creation
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        isVerified: user.isVerified,
      },
      message: "Social registration completed successfully" 
    }, { status: 200 })

  } catch (error) {
    console.error("Complete social registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
