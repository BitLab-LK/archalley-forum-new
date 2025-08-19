import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: !!process.env.DATABASE_URL,
      nextauthUrl: !!process.env.NEXTAUTH_URL,
      nextauthSecret: !!process.env.NEXTAUTH_SECRET,
      vercelBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    }

    // Test database connection
    let dbStatus = "disconnected"
    let dbError = null
    try {
      await prisma.$connect()
      await prisma.categories.findFirst()
      dbStatus = "connected"
    } catch (error) {
      dbError = error instanceof Error ? error.message : "Unknown database error"
    } finally {
      await prisma.$disconnect()
    }

    // Test auth session
    let authStatus = "no-session"
    try {
      const session = await getServerSession(authOptions)
      authStatus = session?.user ? "authenticated" : "no-session"
    } catch (error) {
      authStatus = "auth-error"
    }

    return NextResponse.json({
      status: "ok",
      diagnostics,
      database: {
        status: dbStatus,
        error: dbError
      },
      auth: {
        status: authStatus
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
