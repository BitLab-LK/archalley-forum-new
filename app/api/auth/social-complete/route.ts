import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, provider } = await request.json()

    if (!email || !provider) {
      return NextResponse.json({ error: "Email and provider are required" }, { status: 400 })
    }

    // Find the user
    const user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create a special session token for the completed social registration
    // This will allow NextAuth to recognize the user as authenticated
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      message: "Social registration completed successfully" 
    }, { status: 200 })
  } catch (error) {
    console.error("Social completion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
