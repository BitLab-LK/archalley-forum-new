import { NextResponse } from "next/server"

// Debug endpoint - only available in development
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    message: "Debug endpoint",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
}