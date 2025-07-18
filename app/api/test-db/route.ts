import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Test basic database connection
    await prisma.$connect()
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    // Test if users table exists and can be queried
    const userCount = await prisma.users.count()
    
    // Test if posts table exists and can be queried
    const postCount = await prisma.post.count()
    
    return NextResponse.json({ 
      status: "success", 
      message: "Database connection working!",
      data: {
        connectionTest: result,
        userCount,
        postCount,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Database connection test failed:", error)
    return NextResponse.json({ 
      status: "error", 
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
