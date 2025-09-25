import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is SUPER_ADMIN
    const userRole = session.user.role as string;
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Super Admin access required" }, { status: 403 })
    }

    // Mock security alerts for now
    const alerts = [
      {
        id: "1",
        type: "Suspicious Login Activity",
        message: "Multiple failed login attempts detected from unusual locations",
        severity: "high" as const,
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        isResolved: false
      },
      {
        id: "2",
        type: "Spam Detection",
        message: "Potential spam posts detected from new user accounts",
        severity: "medium" as const,
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        isResolved: false
      },
      {
        id: "3",
        type: "Rate Limit Exceeded",
        message: "API rate limits exceeded by IP 203.0.113.0",
        severity: "low" as const,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
        isResolved: true
      }
    ]

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("Error fetching security alerts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}