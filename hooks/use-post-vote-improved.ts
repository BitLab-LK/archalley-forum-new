import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"

// Global state for vote synchronization across components
const globalVoteState = new Map<string, {
  upvotes: number
  downvotes: number
  userVote: "up" | "down" | null
  listeners: Set<(state: any) => void>
}>()

export function usePostVote(postId: string, initialVote: "up" | "down" | null, initialUpvotes: number, initialDownvotes: number) {
  const { user } = useAuth()
  
  // Initialize global state for this post if it doesn't exist
  if (!globalVoteState.has(postId)) {
    globalVoteState.set(postId, {
      upvotes: initialUpvotes,
      downvotes: initialDownvotes,
      userVote: initialVote,
      listeners: new Set()
    })
  }
  
  const globalState = globalVoteState.get(postId)!
  
  const [userVote, setUserVote] = useState<"up" | "down" | null>(globalState.userVote || initialVote)
  const [upvotes, setUpvotes] = useState(globalState.upvotes || initialUpvotes)
  const [downvotes, setDownvotes] = useState(globalState.downvotes || initialDownvotes)

  // Listen for global state changes
  useEffect(() => {
    const listener = (state: { upvotes: number; downvotes: number; userVote: "up" | "down" | null }) => {
      setUpvotes(state.upvotes)
      setDownvotes(state.downvotes)
      setUserVote(state.userVote)
    }
    
    globalState.listeners.add(listener)
    
    return () => {
      globalState.listeners.delete(listener)
    }
  }, [globalState])

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
          const newState = {
            upvotes: data.upvotes,
            downvotes: data.downvotes,
            userVote: data.userVote?.toLowerCase() as "up" | "down" | null
          }
          
          // Update global state
          globalState.upvotes = newState.upvotes
          globalState.downvotes = newState.downvotes
          globalState.userVote = newState.userVote
          
          // Update local state
          setUpvotes(newState.upvotes)
          setDownvotes(newState.downvotes)
          setUserVote(newState.userVote)
          
          // Notify other listeners
          globalState.listeners.forEach(listener => listener(newState))
        })
        .catch(error => console.error("Error fetching vote data:", error))
    }
  }, [postId, user, globalState])

  const handleVote = async (type: "up" | "down") => {
    if (!user) {
      alert("Please log in to vote on posts")
      return
    }
    
    console.log(`🗳️ Vote initiated: ${type} for post ${postId}`)
    
    // Store previous state for rollback
    const previousVote = userVote
    const previousUpvotes = upvotes
    const previousDownvotes = downvotes
    
    // Calculate new state immediately (optimistic update)
    let newUpvotes = upvotes
    let newDownvotes = downvotes
    let newUserVote: "up" | "down" | null = userVote
    
    if (userVote === type) {
      // Remove vote
      newUserVote = null
      if (type === "up") newUpvotes = upvotes - 1
      else newDownvotes = downvotes - 1
    } else if (userVote) {
      // Change vote
      if (type === "up") {
        newUpvotes = upvotes + 1
        newDownvotes = downvotes - 1
      } else {
        newUpvotes = upvotes - 1
        newDownvotes = downvotes + 1
      }
      newUserVote = type
    } else {
      // New vote
      newUserVote = type
      if (type === "up") newUpvotes = upvotes + 1
      else newDownvotes = downvotes + 1
    }
    
    // Update global state immediately for instant sync across all instances
    globalState.upvotes = newUpvotes
    globalState.downvotes = newDownvotes
    globalState.userVote = newUserVote
    
    // Update local state immediately
    setUpvotes(newUpvotes)
    setDownvotes(newDownvotes)
    setUserVote(newUserVote)
    
    // Notify all listeners immediately for instant real-time updates
    const optimisticState = { upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote }
    globalState.listeners.forEach(listener => listener(optimisticState))
    
    console.log(`⚡ Optimistic update applied: ${type} for post ${postId}`, optimisticState)
    
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type.toUpperCase() }),
      })
      
      if (!response.ok) {
        // Rollback on error
        console.error(`❌ Vote failed, rolling back: ${type} for post ${postId}`)
        
        const rollbackState = { upvotes: previousUpvotes, downvotes: previousDownvotes, userVote: previousVote }
        
        globalState.upvotes = previousUpvotes
        globalState.downvotes = previousDownvotes
        globalState.userVote = previousVote
        
        setUserVote(previousVote)
        setUpvotes(previousUpvotes)
        setDownvotes(previousDownvotes)
        
        globalState.listeners.forEach(listener => listener(rollbackState))
        
        const errorText = await response.text()
        console.error("Failed to vote:", response.status, errorText)
      } else {
        // Use server response for accurate counts
        const result = await response.json()
        console.log("✅ Vote API response:", result)
        
        if (result.upvotes !== undefined && result.downvotes !== undefined) {
          const serverState = {
            upvotes: result.upvotes,
            downvotes: result.downvotes,
            userVote: result.userVote
          }
          
          // Update global state with server response
          globalState.upvotes = serverState.upvotes
          globalState.downvotes = serverState.downvotes
          globalState.userVote = serverState.userVote
          
          // Update local state with server response
          setUpvotes(serverState.upvotes)
          setDownvotes(serverState.downvotes)
          setUserVote(serverState.userVote)
          
          // Notify all listeners with server state for final sync
          globalState.listeners.forEach(listener => listener(serverState))
          
          console.log(`🎯 Server state synchronized: ${type} for post ${postId}`, serverState)
        }
      }
    } catch (error) {
      // Rollback on error
      console.error(`❌ Vote error, rolling back: ${type} for post ${postId}`, error)
      
      const rollbackState = { upvotes: previousUpvotes, downvotes: previousDownvotes, userVote: previousVote }
      
      globalState.upvotes = previousUpvotes
      globalState.downvotes = previousDownvotes
      globalState.userVote = previousVote
      
      setUserVote(previousVote)
      setUpvotes(previousUpvotes)
      setDownvotes(previousDownvotes)
      
      globalState.listeners.forEach(listener => listener(rollbackState))
      
      console.error("Error voting:", error)
    }
  }

  return { userVote, upvotes, downvotes, handleVote, socket: null }
}
