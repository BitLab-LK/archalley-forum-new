import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { syncAllCategoryPostCounts } from "@/lib/category-count-utils"

// API endpoint for syncing category post counts
// This can be called manually or set up as a cron job

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // If cron secret is set, validate it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("🔄 Starting category post count sync...")
    
    // Sync all category post counts
    const results = await syncAllCategoryPostCounts(prisma)
    
    // Get summary
    const totalCategories = Object.keys(results).length
    const totalPosts = Object.values(results).reduce((sum, count) => sum + count, 0)
    
    const summary = {
      message: "Category post counts synced successfully",
      timestamp: new Date().toISOString(),
      totalCategories,
      totalPosts,
      results
    }
    
    console.log("✅ Category sync completed:", summary)
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error("❌ Category sync failed:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to sync category counts",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET endpoint for checking current counts without syncing
export async function GET() {
  try {
    console.log("📊 Getting current category post counts...")
    
    const categories = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        postCount: true
      },
      orderBy: { name: 'asc' }
    })
    
    const summary = {
      message: "Current category post counts",
      timestamp: new Date().toISOString(),
      totalCategories: categories.length,
      totalPosts: categories.reduce((sum, cat) => sum + cat.postCount, 0),
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        postCount: cat.postCount
      }))
    }
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error("❌ Failed to get category counts:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to get category counts",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}