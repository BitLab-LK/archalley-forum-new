import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: alertId } = await params

    // In a real implementation, you would update the alert in your database
    // For now, just return success
    // TODO: Implement actual alert resolution logic
    console.log(`Super Admin ${session.user.email} resolved security alert ${alertId}`)

    return NextResponse.json({ message: "Alert resolved successfully" })
  } catch (error) {
    console.error("Error resolving security alert:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}