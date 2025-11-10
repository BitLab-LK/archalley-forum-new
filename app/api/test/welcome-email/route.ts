import { NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-service"

/**
 * Test endpoint to send welcome email
 * POST /api/test/welcome-email
 * Body: { email?: string, name?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email || "chavindu@bitlab.lk"
    const name = body.name || "Chavindu"
    
    console.log(`📧 Sending test welcome email to ${email}...`)
    
    const result = await sendWelcomeEmail(email, name)
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: `Welcome email sent successfully to ${email}`,
        email,
        name
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to send welcome email to ${email}`,
        email,
        name
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending test welcome email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for easy testing
 * GET /api/test/welcome-email?email=chavindu@bitlab.lk&name=Chavindu
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email") || "chavindu@bitlab.lk"
    const name = searchParams.get("name") || "Chavindu"
    
    console.log(`📧 Sending test welcome email to ${email}...`)
    
    const result = await sendWelcomeEmail(email, name)
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: `Welcome email sent successfully to ${email}`,
        email,
        name
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to send welcome email to ${email}`,
        email,
        name
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending test welcome email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

