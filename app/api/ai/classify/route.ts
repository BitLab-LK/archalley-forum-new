import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { classifyPost, testAIService } from "@/lib/ai-service"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const classifyRequestSchema = z.object({
  content: z.string().min(1, "Content is required").max(10000, "Content too long")
})

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

// Get and validate the request body
    const body = await req.json()
    const validationResult = classifyRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      
      return NextResponse.json(
        { 
          error: "Invalid request", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { content } = validationResult.data

    // Fetch available categories from database
    try {
      const categories = await prisma.categories.findMany({
        select: { name: true },
        orderBy: { name: 'asc' }
      })
      
      const categoryNames = categories.map(cat => cat.name)
      console.log("📋 Available categories for AI:", categoryNames)
      
      // Get AI classification with dynamic categories
      const classification = await classifyPost(content, categoryNames)

      return NextResponse.json(classification)
    } catch (dbError) {
      console.error("Database error when fetching categories:", dbError)
      
      // Fallback to AI classification without dynamic categories
      const classification = await classifyPost(content)

      return NextResponse.json(classification)
    }
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
export async function GET() {
  try {

// Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only allow admins to test AI service
    const userRole = session.user.role as string;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

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
