import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    return NextResponse.json(
      { 
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        message: "API routes are working",
        version: "2025-08-19-v2" // Added version to force redeployment
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        status: "error",
        error: error instanceof Error ? error.message : 'Unknown error',
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

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json(
      { 
        status: "ok",
        authenticated: !!session?.user,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        } : null,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        message: "POST API routes are working"
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        status: "error",
        error: error instanceof Error ? error.message : 'Unknown error',
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
