import type { Server as HTTPServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import { prisma } from "@/lib/prisma"

interface AuthenticatedSocket {
  userId: string
  userRole: string
}

export class WebSocketManager {
  private io: SocketIOServer
  private static instance: WebSocketManager
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>()

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    })

    this.setupEventHandlers()
  }

  static getInstance(server?: HTTPServer): WebSocketManager {
    if (!WebSocketManager.instance && server) {
      WebSocketManager.instance = new WebSocketManager(server)
    }
    return WebSocketManager.instance
  }

  private checkRateLimit(socketId: string): boolean {
    const now = Date.now()
    const attempts = this.rateLimitMap.get(socketId)
    
    if (!attempts || now > attempts.resetTime) {
      this.rateLimitMap.set(socketId, { count: 1, resetTime: now + 60000 }) // 1 minute window
      return true
    }
    
    if (attempts.count >= 100) { // Max 100 events per minute
      return false
    }
    
    attempts.count++
    return true
  }

  private async authenticateSocket(socket: any): Promise<AuthenticatedSocket | null> {
    try {
      // In a real implementation, you would validate the session token
      // For now, we'll use a simple approach with socket auth
      const token = socket.handshake.auth.token
      if (!token) {
        return null
      }

      // Validate token and get user info
      // This is a simplified version - in production, use proper JWT validation
      const user = await prisma.users.findFirst({
        where: { id: token },
        select: { id: true, role: true }
      })

      if (!user) {
        return null
      }

      return {
        userId: user.id,
        userRole: user.role
      }
    } catch (error) {
      console.error("Socket authentication error:", error)
      return null
    }
  }

  private setupEventHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const auth = await this.authenticateSocket(socket)
        if (!auth) {
          return next(new Error("Authentication failed"))
        }
        
        socket.data.auth = auth
        next()
      } catch (error) {
        next(new Error("Authentication error"))
      }
    })

    this.io.on("connection", (socket) => {
      const auth = socket.data.auth as AuthenticatedSocket
      console.log("User connected:", socket.id, "User ID:", auth.userId)

      // Rate limiting check
      if (!this.checkRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" })
        socket.disconnect()
        return
      }

      socket.on("join-room", (roomId: string) => {
        if (!this.checkRateLimit(socket.id)) {
          socket.emit("error", { message: "Rate limit exceeded" })
          return
        }

        // Validate room ID format
        if (typeof roomId !== "string" || roomId.length > 100) {
          socket.emit("error", { message: "Invalid room ID" })
          return
        }

        socket.join(roomId)
        console.log(`User ${auth.userId} joined room ${roomId}`)
      })

      socket.on("leave-room", (roomId: string) => {
        if (!this.checkRateLimit(socket.id)) {
          socket.emit("error", { message: "Rate limit exceeded" })
          return
        }

        socket.leave(roomId)
        console.log(`User ${auth.userId} left room ${roomId}`)
      })

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id, "User ID:", auth.userId)
        // Clean up rate limit data
        this.rateLimitMap.delete(socket.id)
      })

      // Handle errors
      socket.on("error", (error) => {
        console.error("Socket error:", error)
      })
    })
  }

  // Send notification to specific user
  sendNotification(userId: string, notification: any) {
    this.io.to(`user-${userId}`).emit("notification", notification)
  }

  // Send update to post room
  sendPostUpdate(postId: string, update: any) {
    this.io.to(`post-${postId}`).emit("post-update", update)
  }

  // Send new comment to post room
  sendNewComment(postId: string, comment: any) {
    this.io.to(`post-${postId}`).emit("new-comment", comment)
  }

  // Send vote update to post room
  sendVoteUpdate(postId: string, votes: any) {
    this.io.to(`post-${postId}`).emit("vote-update", votes)
  }

  // Get connected users count for a room
  getRoomUserCount(roomId: string): number {
    const room = this.io.sockets.adapter.rooms.get(roomId)
    return room ? room.size : 0
  }

  // Disconnect all users from a room
  disconnectRoom(roomId: string) {
    this.io.in(roomId).disconnectSockets()
  }
}
