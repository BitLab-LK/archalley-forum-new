import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { classifyPost, testAIService } from "@/lib/ai-service"
import { z } from "zod"

const classifyRequestSchema = z.object({
  content: z.string().min(1, "Content is required").max(10000, "Content too long")
})

export async function POST(req: Request) {
  try {
    console.log("🔍 AI classification request received")
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log("❌ Unauthorized AI classification request")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("✅ User authenticated:", session.user.email)

    // Get and validate the request body
    const body = await req.json()
    const validationResult = classifyRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.log("❌ Invalid request body:", validationResult.error.errors)
      return NextResponse.json(
        { 
          error: "Invalid request", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { content } = validationResult.data
    console.log("📝 Processing content:", content.substring(0, 100) + "...")

    // Get AI classification
    const classification = await classifyPost(content)

    console.log("✅ Classification completed:", {
      category: classification.category,
      tagsCount: classification.tags.length,
      confidence: classification.confidence,
      originalLanguage: classification.originalLanguage
    })

    return NextResponse.json(classification)
  } catch (error) {
    console.error("❌ AI classification error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: "Failed to classify post",
        message: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
}

// Test endpoint to verify AI service is working
export async function GET(req: Request) {
  try {
    console.log("🧪 AI service test request received")
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only allow admins to test AI service
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    console.log("✅ Admin user testing AI service:", session.user.email)

    // Test the AI service
    const isWorking = await testAIService()

    if (isWorking) {
      return NextResponse.json({
        status: "success",
        message: "AI service is working correctly",
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        status: "error",
        message: "AI service test failed",
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ AI service test error:", error)
    return NextResponse.json(
      { 
        error: "Failed to test AI service",
        message: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    )
  }
} 