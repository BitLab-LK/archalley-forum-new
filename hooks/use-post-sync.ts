import { useState, useEffect, useCallback } from "react"
import { usePostVote } from "./use-post-vote"

// Global state store for post synchronization
const postStates = new Map<string, {
  upvotes: number
  downvotes: number
  userVote: "up" | "down" | null
  listeners: Set<(state: any) => void>
}>()

export function usePostSync(postId: string, initialUpvotes: number, initialDownvotes: number) {
  // Get the voting functionality from the original hook
  const { userVote, upvotes, downvotes, handleVote, socket } = usePostVote(postId, null, initialUpvotes, initialDownvotes)
  
  // Initialize or get existing post state
  if (!postStates.has(postId)) {
    postStates.set(postId, {
      upvotes: initialUpvotes,
      downvotes: initialDownvotes,
      userVote: null,
      listeners: new Set()
    })
  }
  
  const postState = postStates.get(postId)!
  
  // Local state for this component instance
  const [syncedUpvotes, setSyncedUpvotes] = useState(upvotes)
  const [syncedDownvotes, setSyncedDownvotes] = useState(downvotes)
  const [syncedUserVote, setSyncedUserVote] = useState(userVote)
  
  // Update listener for global state changes
  const updateListener = useCallback((state: { upvotes: number; downvotes: number; userVote: "up" | "down" | null }) => {
    setSyncedUpvotes(state.upvotes)
    setSyncedDownvotes(state.downvotes)
    setSyncedUserVote(state.userVote)
  }, [])
  
  // Register this component as a listener
  useEffect(() => {
    postState.listeners.add(updateListener)
    
    return () => {
      postState.listeners.delete(updateListener)
    }
  }, [postState, updateListener])
  
  // Sync from usePostVote hook to global state
  useEffect(() => {
    const newState = { upvotes, downvotes, userVote }
    
    // Update global state
    postState.upvotes = upvotes
    postState.downvotes = downvotes
    postState.userVote = userVote
    
    // Update local state
    setSyncedUpvotes(upvotes)
    setSyncedDownvotes(downvotes)  
    setSyncedUserVote(userVote)
    
    // Notify all other listeners (modals, other instances)
    postState.listeners.forEach(listener => {
      if (listener !== updateListener) {
        listener(newState)
      }
    })
  }, [upvotes, downvotes, userVote, postState, updateListener])
  
  // Enhanced vote handler that triggers instant sync
  const handleSyncedVote = useCallback(async (type: "up" | "down") => {
    await handleVote(type)
  }, [handleVote])
  
  // Manual sync function for external updates (from modals)
  const syncState = useCallback((newUpvotes: number, newDownvotes: number, newUserVote: "up" | "down" | null) => {
    const newState = { upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote }
    
    // Update global state
    postState.upvotes = newUpvotes
    postState.downvotes = newDownvotes
    postState.userVote = newUserVote
    
    // Notify all listeners for instant sync
    postState.listeners.forEach(listener => {
      listener(newState)
    })
    
    // Emit socket event for other users
    if (socket) {
      socket.emit('vote-sync', {
        postId,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        userVote: newUserVote
      })
    }
  }, [postState, socket, postId])
  
  return {
    userVote: syncedUserVote,
    upvotes: syncedUpvotes,
    downvotes: syncedDownvotes,
    handleVote: handleSyncedVote,
    syncState,
    socket
  }
}
