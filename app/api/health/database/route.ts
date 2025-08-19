import { NextResponse } from "next/server"
import { checkDbHealth, prisma } from "@/lib/prisma"

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Comprehensive database health check
    const healthCheck = await checkDbHealth()
    const responseTime = Date.now() - startTime
    
    // Additional database metrics
    let metrics = {}
    if (healthCheck.status === 'healthy') {
      try {
        // Test various database operations
        const [userCount, postCount, categoryCount] = await Promise.all([
          prisma.users.count(),
          prisma.post.count(),
          prisma.categories.count()
        ])
        
        metrics = {
          users: userCount,
          posts: postCount,
          categories: categoryCount,
          tablesAccessible: true
        }
      } catch (metricsError) {
        metrics = {
          tablesAccessible: false,
          metricsError: metricsError instanceof Error ? metricsError.message : 'Unknown error'
        }
      }
    }
    
    const result = {
      status: healthCheck.status,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      database: {
        connected: healthCheck.status === 'healthy',
        error: healthCheck.error || null,
        connectionAttempts: healthCheck.attempts || 0,
        metrics
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        region: process.env.VERCEL_REGION || 'unknown',
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      },
      performance: {
        responseTime,
        classification: responseTime < 1000 ? 'fast' : responseTime < 3000 ? 'acceptable' : 'slow'
      }
    }
    
    // Return appropriate status code based on health
    const statusCode = healthCheck.status === 'healthy' ? 200 : 503
    
    return NextResponse.json(result, { 
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'error',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        region: process.env.VERCEL_REGION || 'unknown',
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      }
    }, { 
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    })
  }
}
