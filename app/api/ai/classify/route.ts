import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { classifyPost } from "@/lib/ai-service"

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get the post content from the request body
    const { content } = await req.json()

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    // Get AI classification
    const classification = await classifyPost(content)

    return NextResponse.json(classification)
  } catch (error) {
    console.error("AI classification error:", error)
    return NextResponse.json(
      { error: "Failed to classify post" },
      { status: 500 }
    )
  }
} 