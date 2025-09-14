import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkDbHealth, ensureDbConnection } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin users or in development
    if (process.env.NODE_ENV === 'production' && (!session?.user || session.user.email !== 'admin@archalley.com')) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      
      // Environment variables check (without exposing sensitive data)
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlHost: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : null,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGeminiApiKey: !!process.env.GOOGLE_GEMINI_API_KEY,
        prismaClientEngineType: process.env.PRISMA_CLIENT_ENGINE_TYPE,
      },
      
      // Database diagnostics
      database: null as any,
      connectionTest: null as any,
    }
    
    // Test database health
    try {
      diagnostics.database = await checkDbHealth()
    } catch (error) {
      diagnostics.database = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    // Test database connection specifically
    try {
      await ensureDbConnection()
      diagnostics.connectionTest = {
        status: 'success',
        message: 'Database connection established successfully'
      }
    } catch (error) {
      diagnostics.connectionTest = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    return NextResponse.json(diagnostics, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error("❌ Debug endpoint failed:", error)
    
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    )
  }
}