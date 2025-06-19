const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const socketio = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.IO
  const io = socketio(server, {
    path: "/api/socketio",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO logic for comments
  io.on("connection", (socket) => {
    // Join a post room
    socket.on("join-post", (postId) => {
      socket.join(postId);
    });

    // New comment
    socket.on("new-comment", (data) => {
      // Broadcast to all in the post room
      io.to(data.postId).emit("new-comment", data.comment);
    });

    // New reply
    socket.on("new-reply", (data) => {
      io.to(data.postId).emit("new-reply", data.reply);
    });

    // Vote update
    socket.on("vote", async (data) => {
      const { postId, type } = data;
      try {
        // Get updated vote counts
        const [upvotes, downvotes] = await Promise.all([
          prisma.vote.count({
            where: { postId, type: "UP" }
          }),
          prisma.vote.count({
            where: { postId, type: "DOWN" }
          })
        ]);
        // Get user's vote
        const userVote = await prisma.vote.findFirst({
          where: {
            postId,
            userId: socket.handshake.auth.userId // Make sure to pass userId in socket auth
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
      }
    });

    // Comment vote update
    socket.on("comment-vote", async (data) => {
      const { commentId, postId, type } = data;
      try {
        // Get updated vote counts for the comment
        const [upvotes, downvotes] = await Promise.all([
          prisma.vote.count({ where: { commentId, type: "UP" } }),
          prisma.vote.count({ where: { commentId, type: "DOWN" } })
        ]);
        // Get user's vote for the comment
        const userVote = await prisma.vote.findFirst({
          where: {
            commentId,
            userId: socket.handshake.auth.userId
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
      }
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}); 