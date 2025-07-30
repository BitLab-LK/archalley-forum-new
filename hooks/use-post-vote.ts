import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"

// Global state for vote synchronization across components
const globalVoteState = new Map<string, {
  upvotes: number
  downvotes: number
  userVote: "up" | "down" | null
  listeners: Set<(state: any, skipInitiator?: boolean) => void>
  isUpdating: boolean // Prevent cascade updates
  lastUpdate: number
}>()

// Utility function to sync external vote updates to global state
export function syncGlobalVoteState(postId: string, upvotes: number, downvotes: number, userVote: "up" | "down" | null) {
  if (globalVoteState.has(postId)) {
    const state = globalVoteState.get(postId)!
    state.upvotes = upvotes
    state.downvotes = downvotes
    state.userVote = userVote
    state.lastUpdate = Date.now()
    
    // Notify all listeners
    const voteState = { upvotes, downvotes, userVote }
    state.listeners.forEach(listener => {
      try {
        listener(voteState, false) // Don't skip any listeners for external sync
      } catch (error) {
        console.error(`❌ Error in global vote sync listener for ${postId}:`, error)
      }
    })
    
    console.log(`🌐 Global vote state synced for ${postId}:`, voteState)
    return true
  }
  return false
}

export function usePostVote(postId: string, initialVote: "up" | "down" | null, initialUpvotes: number, initialDownvotes: number) {
  const { user } = useAuth()
  const mountedRef = useRef(true)
  const isInitiatorRef = useRef(false) // Track if this instance initiated the change
  
  // Initialize global state for this post if it doesn't exist
  if (!globalVoteState.has(postId)) {
    globalVoteState.set(postId, {
      upvotes: initialUpvotes,
      downvotes: initialDownvotes,
      userVote: initialVote,
      listeners: new Set(),
      isUpdating: false,
      lastUpdate: Date.now()
    })
    console.log(`🎯 Initialized global vote state for ${postId}:`, { initialUpvotes, initialDownvotes, initialVote })
  } else {
    // If global state exists, use it as the source of truth
    const existingState = globalVoteState.get(postId)!
    console.log(`🔄 Using existing global vote state for ${postId}:`, { 
      upvotes: existingState.upvotes, 
      downvotes: existingState.downvotes, 
      userVote: existingState.userVote 
    })
  }
  
  const globalState = globalVoteState.get(postId)!
  
  // Use global state as source of truth for initial values
  const [userVote, setUserVote] = useState<"up" | "down" | null>(globalState.userVote)
  const [upvotes, setUpvotes] = useState(globalState.upvotes)
  const [downvotes, setDownvotes] = useState(globalState.downvotes)

  // Listen for global state changes - but skip if this instance initiated the change
  useEffect(() => {
    const listener = (state: { upvotes: number; downvotes: number; userVote: "up" | "down" | null }, skipInitiator = false) => {
      // Skip update if this instance initiated the change and skipInitiator is true
      if (skipInitiator && isInitiatorRef.current) {
        isInitiatorRef.current = false // Reset the flag
        return
      }
      
      if (!mountedRef.current) return
      
      // Only update if values actually changed to prevent unnecessary re-renders
      if (state.upvotes !== upvotes) setUpvotes(state.upvotes)
      if (state.downvotes !== downvotes) setDownvotes(state.downvotes)
      if (state.userVote !== userVote) setUserVote(state.userVote)
    }
    
    globalState.listeners.add(listener)
    
    return () => {
      globalState.listeners.delete(listener)
    }
  }, [globalState, upvotes, downvotes, userVote])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Fetch user's current vote when component mounts - but only notify other listeners
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
          globalState.lastUpdate = Date.now()
          
          // Update local state
          setUpvotes(newState.upvotes)
          setDownvotes(newState.downvotes)
          setUserVote(newState.userVote)
          
          // Notify other listeners
          setTimeout(() => {
            globalState.listeners.forEach(listener => {
              try {
                listener(newState, false) // Don't skip any listeners for initial fetch
              } catch (e) {
                console.error("Error in initial fetch listener:", e)
              }
            })
          }, 0)
        })
        .catch(error => console.error("Error fetching vote data:", error))
    }
  }, [postId, user])

  const handleVote = async (type: "up" | "down") => {
    if (!user) {
      alert("Please log in to vote on posts")
      return
    }
    
    // Prevent multiple concurrent votes
    if (globalState.isUpdating) {
      console.log(`� Vote already in progress for post ${postId}, skipping...`)
      return
    }
    
    globalState.isUpdating = true
    isInitiatorRef.current = true // Mark this instance as the initiator
    
    console.log(`�🗳️ Vote initiated: ${type} for post ${postId}`)
    
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
    
    // Update global state immediately
    globalState.upvotes = newUpvotes
    globalState.downvotes = newDownvotes
    globalState.userVote = newUserVote
    globalState.lastUpdate = Date.now()
    
    // Update local state immediately for this instance
    setUpvotes(newUpvotes)
    setDownvotes(newDownvotes)
    setUserVote(newUserVote)
    
    // Notify other listeners (excluding this instance) with debouncing
    const optimisticState = { upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote }
    setTimeout(() => {
      globalState.listeners.forEach(listener => {
        try {
          listener(optimisticState, true) // Skip initiator
        } catch (e) {
          console.error("Error in listener:", e)
        }
      })
    }, 0)
    
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
        globalState.lastUpdate = Date.now()
        
        setUserVote(previousVote)
        setUpvotes(previousUpvotes)
        setDownvotes(previousDownvotes)
        
        // Notify all listeners about rollback
        setTimeout(() => {
          globalState.listeners.forEach(listener => {
            try {
              listener(rollbackState)
            } catch (e) {
              console.error("Error in rollback listener:", e)
            }
          })
        }, 0)
        
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
          
          // Only update if server state is different from current state
          if (serverState.upvotes !== globalState.upvotes || 
              serverState.downvotes !== globalState.downvotes || 
              serverState.userVote !== globalState.userVote) {
            
            // Update global state with server response
            globalState.upvotes = serverState.upvotes
            globalState.downvotes = serverState.downvotes
            globalState.userVote = serverState.userVote
            globalState.lastUpdate = Date.now()
            
            // Update local state with server response
            setUpvotes(serverState.upvotes)
            setDownvotes(serverState.downvotes)
            setUserVote(serverState.userVote)
            
            // Notify all listeners with server state for final sync
            setTimeout(() => {
              globalState.listeners.forEach(listener => {
                try {
                  listener(serverState)
                } catch (e) {
                  console.error("Error in server sync listener:", e)
                }
              })
            }, 0)
          }
          
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
      globalState.lastUpdate = Date.now()
      
      setUserVote(previousVote)
      setUpvotes(previousUpvotes)
      setDownvotes(previousDownvotes)
      
      // Notify all listeners about rollback
      setTimeout(() => {
        globalState.listeners.forEach(listener => {
          try {
            listener(rollbackState)
          } catch (e) {
            console.error("Error in error rollback listener:", e)
          }
        })
      }, 0)
      
      console.error("Error voting:", error)
    } finally {
      // Reset the updating flag
      globalState.isUpdating = false
      isInitiatorRef.current = false
    }
  }

  return { userVote, upvotes, downvotes, handleVote, socket: null }
}
