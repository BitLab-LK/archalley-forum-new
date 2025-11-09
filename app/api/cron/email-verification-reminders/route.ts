import { NextRequest, NextResponse } from "next/server"
import { sendEmailVerificationReminders } from "@/lib/email-verification-reminders"

/**
 * POST /api/cron/email-verification-reminders
 * Cron job endpoint to send email verification reminders
 * Should be called by a cron service (e.g., Vercel Cron, external cron service)
 * 
 * Security: Add authentication/authorization check in production
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const result = await sendEmailVerificationReminders()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Also support GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request)
}
