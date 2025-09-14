import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma, ensureDbConnection } from "@/lib/prisma"

// Utility function to format time ago
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection before proceeding
    await ensureDbConnection()
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notifications.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notifications.count({
        where: { userId: session.user.id },
      }),
      prisma.notifications.count({
        where: { 
          userId: session.user.id,
          isRead: false,
        },
      }),
    ])

    // Format notifications with time ago
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      timeAgo: getTimeAgo(notification.createdAt),
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("❌ Get notifications error:", error)
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
    
    // Check if it's a database connection error
    if (error instanceof Error && (
      error.message.includes('database') || 
      error.message.includes('connection') ||
      error.message.includes('P1001') ||
      error.message.includes('timeout')
    )) {
      return NextResponse.json(
        { 
          error: "Database connection failed",
          message: "The application is currently unable to connect to the database. Please try again later.",
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch notifications",
        message: "An unexpected error occurred while fetching notifications. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
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

export async function PUT(request: NextRequest) {
  try {
    // Ensure database connection before proceeding
    await ensureDbConnection()
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAsRead, markAll } = body

    if (markAll) {
      // Mark all notifications as read
      await prisma.notifications.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: { isRead: true },
      })
      return NextResponse.json({ message: "All notifications marked as read" })
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notifications.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: { isRead: markAsRead ?? true },
      })
      return NextResponse.json({ message: "Notifications updated" })
    }

    return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
  } catch (error) {
    console.error("Update notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE method to delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")

    if (!notificationId) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 })
    }

    // Verify the notification belongs to the user and delete it
    const deleted = await prisma.notifications.deleteMany({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notification deleted" })
  } catch (error) {
    console.error("Delete notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
