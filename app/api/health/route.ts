import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      message: "API is working correctly"
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: "error", 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
