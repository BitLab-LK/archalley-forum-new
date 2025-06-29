import { useState, useEffect } from "react"
import io from "socket.io-client"
import { useAuth } from "@/lib/auth-context"

let socket: any = null

export function usePostVote(postId: string, initialVote: "up" | "down" | null, initialUpvotes: number, initialDownvotes: number) {
  const { user } = useAuth()
  const [userVote, setUserVote] = useState<"up" | "down" | null>(initialVote)
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)

  useEffect(() => {
    if (!socket) {
      socket = io({ path: "/api/socketio", auth: { userId: user?.id } })
    }
    socket.emit("join-post", postId)
    socket.on("vote-update", (data: { upvotes: number; downvotes: number; userVote: "UP" | "DOWN" | null }) => {
      setUpvotes(data.upvotes)
      setDownvotes(data.downvotes)
      setUserVote(data.userVote?.toLowerCase() as "up" | "down" | null)
    })
    return () => {
      socket?.off("vote-update")
    }
  }, [postId, user?.id])

  const handleVote = async (type: "up" | "down") => {
    if (!user) {
      alert("Please log in to vote on posts")
      return
    }
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type.toUpperCase() }),
      })
      if (response.ok) {
        if (userVote === type) {
          setUserVote(null)
          if (type === "up") setUpvotes(u => u - 1)
          else setDownvotes(d => d - 1)
        } else if (userVote) {
          if (type === "up") {
            setUpvotes(u => u + 1)
            setDownvotes(d => d - 1)
          } else {
            setUpvotes(u => u - 1)
            setDownvotes(d => d + 1)
          }
          setUserVote(type)
        } else {
          setUserVote(type)
          if (type === "up") setUpvotes(u => u + 1)
          else setDownvotes(d => d + 1)
        }
        socket?.emit("vote", { postId, type: type.toUpperCase() })
      }
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  return { userVote, upvotes, downvotes, handleVote }
} 