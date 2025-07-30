import { useState, useEffect, useCallback } from "react"
import { usePostVote } from "./use-post-vote"

// Global state store for post synchronization - enhanced for better performance
const postStates = new Map<string, {
  upvotes: number
  downvotes: number
  userVote: "up" | "down" | null
  commentCount: number
  listeners: Set<(state: any) => void>
  lastUpdate: number
}>()

export function usePostSync(postId: string, initialUpvotes: number, initialDownvotes: number, initialCommentCount: number = 0) {
  // Get the voting functionality from the improved hook
  const { userVote, upvotes, downvotes, handleVote } = usePostVote(postId, null, initialUpvotes, initialDownvotes)
  
  // Initialize or get existing post state
  if (!postStates.has(postId)) {
    postStates.set(postId, {
      upvotes: initialUpvotes,
      downvotes: initialDownvotes,
      userVote: null,
      commentCount: initialCommentCount,
      listeners: new Set(),
      lastUpdate: Date.now()
    })
  }
  
  const postState = postStates.get(postId)!
  
  // Local state for this component instance - sync with vote hook
  const [syncedCommentCount, setSyncedCommentCount] = useState(initialCommentCount)
  
  // Update listener for global state changes
  const updateListener = useCallback((state: { upvotes: number; downvotes: number; userVote: "up" | "down" | null; commentCount: number }) => {
    // Only update comment count as votes are handled by the vote hook directly
    setSyncedCommentCount(prev => prev !== state.commentCount ? state.commentCount : prev)
  }, [])
  
  // Register this component as a listener
  useEffect(() => {
    postState.listeners.add(updateListener)
    
    return () => {
      postState.listeners.delete(updateListener)
    }
  }, [postState, updateListener])
  
  // Sync comment count changes to global state
  useEffect(() => {
    if (syncedCommentCount !== postState.commentCount) {
      postState.commentCount = syncedCommentCount
      postState.lastUpdate = Date.now()
    }
  }, [syncedCommentCount, postState])
  
  // Enhanced vote handler - direct pass-through to the improved vote hook
  const handleSyncedVote = useCallback(async (type: "up" | "down") => {
    console.log(`🗳️ [${postId}] Synced vote triggered:`, type)
    // The vote hook now handles all synchronization internally
    await handleVote(type)
  }, [handleVote, postId])
  
  // Manual sync function for external updates (from modals) - simplified
  const syncState = useCallback((newUpvotes: number, newDownvotes: number, newUserVote: "up" | "down" | null) => {
    console.log(`🔄 [${postId}] Manual vote sync triggered:`, { newUpvotes, newDownvotes, newUserVote })
    
    // The vote hook handles vote state, we just need to notify about comment count
    const newState = { 
      upvotes: newUpvotes, 
      downvotes: newDownvotes, 
      userVote: newUserVote, 
      commentCount: syncedCommentCount 
    }
    
    // Update global state
    postState.upvotes = newUpvotes
    postState.downvotes = newDownvotes
    postState.userVote = newUserVote
    postState.lastUpdate = Date.now()
    
    // Notify listeners about the full state change
    postState.listeners.forEach(listener => listener(newState))
  }, [postState, postId, syncedCommentCount])
  
  // Comment sync function for instant comment updates
  const syncCommentCount = useCallback((newCommentCount: number) => {
    console.log(`💬 [${postId}] Comment count sync:`, newCommentCount)
    
    const newState = { 
      upvotes, 
      downvotes, 
      userVote, 
      commentCount: newCommentCount 
    }
    
    // Update global state
    postState.commentCount = newCommentCount
    postState.lastUpdate = Date.now()
    
    // Update local state immediately
    setSyncedCommentCount(newCommentCount)
    
    // Notify all listeners immediately
    postState.listeners.forEach(listener => listener(newState))
  }, [postState, postId, upvotes, downvotes, userVote])
  
  return {
    userVote,
    upvotes,
    downvotes,
    commentCount: syncedCommentCount,
    handleVote: handleSyncedVote,
    syncState,
    syncCommentCount,
    socket: null
  }
}
