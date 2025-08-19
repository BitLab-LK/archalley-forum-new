import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // In production, only allow authenticated admin users
  if (process.env.NODE_ENV === "production") {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      }
      
      // Check if user is admin (you can adjust this logic based on your admin setup)
      const user = await prisma.users.findUnique({
        where: { email: session.user.email }
      })
      
      if (!user?.isVerified) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      )
    }
  }

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
