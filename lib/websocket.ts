import type { Server as HTTPServer } from "http"
import { Server as SocketIOServer } from "socket.io"

export class WebSocketManager {
  private io: SocketIOServer
  private static instance: WebSocketManager

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL,
        methods: ["GET", "POST"],
      },
    })

    this.setupEventHandlers()
  }

  static getInstance(server?: HTTPServer): WebSocketManager {
    if (!WebSocketManager.instance && server) {
      WebSocketManager.instance = new WebSocketManager(server)
    }
    return WebSocketManager.instance
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      socket.on("join-room", (roomId: string) => {
        socket.join(roomId)
        console.log(`User ${socket.id} joined room ${roomId}`)
      })

      socket.on("leave-room", (roomId: string) => {
        socket.leave(roomId)
        console.log(`User ${socket.id} left room ${roomId}`)
      })

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
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
}
