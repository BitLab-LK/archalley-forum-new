import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, provider } = await request.json()
    
    console.log(`Social registration completed for: ${email} via ${provider}`)
    
    // Simple response - just confirm completion
    return NextResponse.json({ 
      success: true,
      message: `Registration completed! Please click "${provider} Login" one more time to access your account.`,
      redirectTo: "/auth/login"
    })
  } catch (error) {
    console.error("Error in complete-social endpoint:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
