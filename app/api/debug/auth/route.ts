import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasSession: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      } : null,
      cookies: {
        hasNextAuthSession: !!session
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({
        error: "Unauthorized",
        message: "Authentication required for POST requests",
        hasSession: !!session,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return NextResponse.json({
      status: "success",
      message: "Authenticated POST request successful",
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
