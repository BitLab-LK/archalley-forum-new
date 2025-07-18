import { useState, useEffect, useCallback } from "react"
import { usePostVote } from "./use-post-vote"

// Global state store for post synchronization
const postStates = new Map<string, {
  upvotes: number
  downvotes: number
  userVote: "up" | "down" | null
  commentCount: number
  listeners: Set<(state: any) => void>
}>()

export function usePostSync(postId: string, initialUpvotes: number, initialDownvotes: number, initialCommentCount: number = 0) {
  // Get the voting functionality from the original hook
  const { userVote, upvotes, downvotes, handleVote, socket } = usePostVote(postId, null, initialUpvotes, initialDownvotes)
  
  // Initialize or get existing post state
  if (!postStates.has(postId)) {
    postStates.set(postId, {
      upvotes: initialUpvotes,
      downvotes: initialDownvotes,
      userVote: null,
      commentCount: initialCommentCount,
      listeners: new Set()
    })
  }
  
  const postState = postStates.get(postId)!
  
  // Local state for this component instance
  const [syncedUpvotes, setSyncedUpvotes] = useState(upvotes)
  const [syncedDownvotes, setSyncedDownvotes] = useState(downvotes)
  const [syncedUserVote, setSyncedUserVote] = useState(userVote)
  const [syncedCommentCount, setSyncedCommentCount] = useState(initialCommentCount)
  
  // Update listener for global state changes
  const updateListener = useCallback((state: { upvotes: number; downvotes: number; userVote: "up" | "down" | null; commentCount: number }) => {
    setSyncedUpvotes(state.upvotes)
    setSyncedDownvotes(state.downvotes)
    setSyncedUserVote(state.userVote)
    setSyncedCommentCount(state.commentCount)
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
    const newState = { upvotes, downvotes, userVote, commentCount: syncedCommentCount }
    
    // Update global state
    postState.upvotes = upvotes
    postState.downvotes = downvotes
    postState.userVote = userVote
    // Don't override comment count from vote changes
    
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
  }, [upvotes, downvotes, userVote, postState, updateListener, syncedCommentCount])
  
  // Enhanced vote handler that triggers instant sync
  const handleSyncedVote = useCallback(async (type: "up" | "down") => {
    await handleVote(type)
  }, [handleVote])
  
  // Manual sync function for external updates (from modals)
  const syncState = useCallback((newUpvotes: number, newDownvotes: number, newUserVote: "up" | "down" | null) => {
    const newState = { upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote, commentCount: syncedCommentCount }
    
    // Update global state
    postState.upvotes = newUpvotes
    postState.downvotes = newDownvotes
    postState.userVote = newUserVote
    
    // Queue listener notifications to avoid render-time updates
    setTimeout(() => {
      postState.listeners.forEach(listener => {
        listener(newState)
      })
    }, 0)
    
    // Emit socket event for other users
    if (socket) {
      socket.emit('vote-sync', {
        postId,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        userVote: newUserVote
      })
    }
  }, [postState, socket, postId, syncedCommentCount])
  
  // Comment sync function for instant comment updates
  const syncCommentCount = useCallback((newCommentCount: number) => {
    const newState = { 
      upvotes: syncedUpvotes, 
      downvotes: syncedDownvotes, 
      userVote: syncedUserVote, 
      commentCount: newCommentCount 
    }
    
    // Update global state
    postState.commentCount = newCommentCount
    
    // Update local state
    setSyncedCommentCount(newCommentCount)
    
    // Queue listener notifications to avoid render-time updates
    setTimeout(() => {
      postState.listeners.forEach(listener => {
        listener(newState)
      })
    }, 0)
    
    // Emit socket event for other users
    if (socket) {
      socket.emit('comment-count-sync', {
        postId,
        commentCount: newCommentCount
      })
    }
  }, [postState, socket, postId, syncedUpvotes, syncedDownvotes, syncedUserVote])
  
  return {
    userVote: syncedUserVote,
    upvotes: syncedUpvotes,
    downvotes: syncedDownvotes,
    commentCount: syncedCommentCount,
    handleVote: handleSyncedVote,
    syncState,
    syncCommentCount,
    socket
  }
}
