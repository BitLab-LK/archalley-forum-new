import { useState, useEffect } from "react"
import io from "socket.io-client"
import { useAuth } from "@/lib/auth-context"

let socket: any = null

export function usePostVote(postId: string, initialVote: "up" | "down" | null, initialUpvotes: number, initialDownvotes: number) {
  const { user } = useAuth()
  const [userVote, setUserVote] = useState<"up" | "down" | null>(initialVote)
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)

  // Fetch user's current vote when component mounts
  useEffect(() => {
    if (user && postId) {
      fetch(`/api/posts/${postId}/vote`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          if (data.userVote) {
            setUserVote(data.userVote.toLowerCase() as "up" | "down")
          }
          // Update with server vote counts to ensure accuracy
          setUpvotes(data.upvotes)
          setDownvotes(data.downvotes)
        })
        .catch(error => console.error("Error fetching vote data:", error))
    }
  }, [postId, user])

  useEffect(() => {
    if (!socket) {
      socket = io({ path: "/api/socketio", auth: { userId: user?.id } })
    }
    
    socket.emit("join-post", postId)
    
    // Create a unique event handler for this hook instance
    const voteUpdateHandler = (data: { upvotes: number; downvotes: number; userVote: "UP" | "DOWN" | null }) => {
      console.log(`🔄 Socket vote update for post ${postId}:`, data)
      setUpvotes(data.upvotes)
      setDownvotes(data.downvotes)
      setUserVote(data.userVote?.toLowerCase() as "up" | "down" | null)
    }
    
    // Handle vote synchronization between card and modal
    const voteSyncHandler = (data: { postId: string; upvotes: number; downvotes: number; userVote: "up" | "down" | null }) => {
      if (data.postId === postId) {
        console.log(`🔄 Vote sync for post ${postId}:`, data)
        setUpvotes(data.upvotes)
        setDownvotes(data.downvotes)
        setUserVote(data.userVote)
      }
    }
    
    // Handle comment count synchronization
    const commentCountSyncHandler = (data: { postId: string; commentCount: number }) => {
      if (data.postId === postId) {
        console.log(`💬 Comment count sync for post ${postId}:`, data)
        // Note: This hook doesn't manage comment count, but we listen for other components
      }
    }
    
    socket.on("vote-update", voteUpdateHandler)
    socket.on("vote-sync", voteSyncHandler)
    socket.on("comment-count-sync", commentCountSyncHandler)
    
    return () => {
      socket?.off("vote-update", voteUpdateHandler)
      socket?.off("vote-sync", voteSyncHandler)
      socket?.off("comment-count-sync", commentCountSyncHandler)
    }
  }, [postId, user?.id])

  const handleVote = async (type: "up" | "down") => {
    if (!user) {
      alert("Please log in to vote on posts")
      return
    }
    
    // Store previous state for rollback
    const previousVote = userVote
    const previousUpvotes = upvotes
    const previousDownvotes = downvotes
    
    // Update UI immediately (optimistic update)
    if (userVote === type) {
      // Remove vote
      setUserVote(null)
      if (type === "up") setUpvotes(u => u - 1)
      else setDownvotes(d => d - 1)
    } else if (userVote) {
      // Change vote
      if (type === "up") {
        setUpvotes(u => u + 1)
        setDownvotes(d => d - 1)
      } else {
        setUpvotes(u => u - 1)
        setDownvotes(d => d + 1)
      }
      setUserVote(type)
    } else {
      // New vote
      setUserVote(type)
      if (type === "up") setUpvotes(u => u + 1)
      else setDownvotes(d => d + 1)
    }
    
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type.toUpperCase() }),
      })
      
      if (!response.ok) {
        // Rollback on error
        setUserVote(previousVote)
        setUpvotes(previousUpvotes)
        setDownvotes(previousDownvotes)
        const errorText = await response.text()
        console.error("Failed to vote:", response.status, errorText)
      } else {
        // Emit vote update via socket for real-time sync
        socket?.emit("vote", { postId, type: type.toUpperCase() })
        console.log(`✅ Vote successful: ${type} for post ${postId}. New state:`, {
          upvotes: type === "up" ? (userVote === "up" ? upvotes - 1 : upvotes + 1) : upvotes,
          downvotes: type === "down" ? (userVote === "down" ? downvotes - 1 : downvotes + 1) : downvotes,
          userVote: userVote === type ? null : type
        })
      }
    } catch (error) {
      // Rollback on error
      setUserVote(previousVote)
      setUpvotes(previousUpvotes)
      setDownvotes(previousDownvotes)
      console.error("Error voting:", error)
    }
  }

  return { userVote, upvotes, downvotes, handleVote, socket }
} 