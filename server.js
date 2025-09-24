const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const socketio = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

// Rate limiting for Socket.IO
const socketRateLimit = new Map();

function checkSocketRateLimit(socketId) {
  const now = Date.now();
  const attempts = socketRateLimit.get(socketId);
  
  if (!attempts || now > attempts.resetTime) {
    socketRateLimit.set(socketId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (attempts.count >= 50) { // Max 50 events per minute
    return false;
  }
  
  attempts.count++;
  return true;
}

app.prepare().then(async () => {
  // Initialize email service on startup
  try {
    const { initializeEmailService } = require('./lib/email-service');
    const emailResult = await initializeEmailService();
    if (emailResult.success) {
      console.log('✅ Email service initialized successfully');
    } else {
      console.warn('⚠️ Email service initialization failed:', emailResult.error);
    }
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error.message);
  }

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.IO with improved security
  const io = socketio(server, {
    path: "/api/socketio",
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    connectTimeout: 10000 // 10 seconds connection timeout
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      // Validate user token
      const user = await prisma.user.findFirst({
        where: { id: token },
        select: { id: true, role: true }
      });

      if (!user) {
        return next(new Error("Invalid token"));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Socket.IO logic for comments with improved security
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id, "User ID:", socket.userId);

    // Clean up rate limit data on disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id, "User ID:", socket.userId);
      socketRateLimit.delete(socket.id);
    });

    // Join a post room
    socket.on("join-post", (postId) => {
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" });
        return;
      }

      // Validate postId
      if (typeof postId !== "string" || postId.length > 100) {
        socket.emit("error", { message: "Invalid post ID" });
        return;
      }

      socket.join(postId);
      console.log(`User ${socket.userId} joined post ${postId}`);
    });

    // New comment
    socket.on("new-comment", (data) => {
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" });
        return;
      }

      // Validate data
      if (!data || !data.postId || !data.comment) {
        socket.emit("error", { message: "Invalid comment data" });
        return;
      }

      // Broadcast to all in the post room
      io.to(data.postId).emit("new-comment", data.comment);
    });

    // New reply
    socket.on("new-reply", (data) => {
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" });
        return;
      }

      // Validate data
      if (!data || !data.postId || !data.reply) {
        socket.emit("error", { message: "Invalid reply data" });
        return;
      }

      io.to(data.postId).emit("new-reply", data.reply);
    });

    // Vote update
    socket.on("vote", async (data) => {
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" });
        return;
      }

      const { postId, type } = data;
      
      // Validate data
      if (!postId || !type || !["UP", "DOWN"].includes(type)) {
        socket.emit("error", { message: "Invalid vote data" });
        return;
      }

      try {
        // Get updated vote counts
        const [upvotes, downvotes] = await Promise.all([
          prisma.votes.count({
            where: { postId, type: "UP" }
          }),
          prisma.votes.count({
            where: { postId, type: "DOWN" }
          })
        ]);
        
        // Get user's vote
        const userVote = await prisma.votes.findFirst({
          where: {
            postId,
            userId: socket.userId
          }
        });
        
        // Broadcast to all in the post room
        io.to(postId).emit("vote-update", {
          upvotes,
          downvotes,
          userVote: userVote?.type || null
        });
      } catch (error) {
        console.error("Error handling vote update:", error);
        socket.emit("error", { message: "Failed to update vote" });
      }
    });

    // Comment vote update
    socket.on("comment-vote", async (data) => {
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" });
        return;
      }

      const { commentId, postId, type } = data;
      
      // Validate data
      if (!commentId || !postId || !type || !["UP", "DOWN"].includes(type)) {
        socket.emit("error", { message: "Invalid comment vote data" });
        return;
      }

      try {
        // Get updated vote counts for the comment
        const [upvotes, downvotes] = await Promise.all([
          prisma.votes.count({ where: { commentId, type: "UP" } }),
          prisma.votes.count({ where: { commentId, type: "DOWN" } })
        ]);
        
        // Get user's vote for the comment
        const userVote = await prisma.votes.findFirst({
          where: {
            commentId,
            userId: socket.userId
          }
        });
        
        // Broadcast to all in the post room
        io.to(postId).emit("comment-vote-update", {
          commentId,
          upvotes,
          downvotes,
          userVote: userVote?.type || null
        });
      } catch (error) {
        console.error("Error handling comment vote update:", error);
        socket.emit("error", { message: "Failed to update comment vote" });
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}); 