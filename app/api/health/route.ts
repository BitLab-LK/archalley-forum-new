import { NextResponse } from "next/server"
import { checkDbHealth } from "@/lib/prisma"

export async function GET() {
  try {
    // Check database health
    const dbHealth = await checkDbHealth()
    
    // Check environment variables
    const envCheck = {
      hasDatabase: !!process.env.DATABASE_URL,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
    
    const healthStatus = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      environment: envCheck,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      message: dbHealth.status === 'healthy' ? "All systems operational" : "Database connectivity issues detected"
    }
    
    const status = healthStatus.status === 'healthy' ? 200 : 503
    
    return NextResponse.json(healthStatus, { 
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error("❌ Health check failed:", error)
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
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
