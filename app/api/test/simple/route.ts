import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "success",
    message: "Simple test endpoint working",
    timestamp: new Date().toISOString(),
    method: "GET"
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    
    return NextResponse.json({
      status: "success",
      message: "POST request successfully received",
      timestamp: new Date().toISOString(),
      method: "POST",
      bodyReceived: !!body,
      bodyLength: body.length,
      contentType: request.headers.get('content-type')
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Failed to process POST request",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
