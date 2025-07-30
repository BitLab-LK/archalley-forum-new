import { useState, useEffect, useCallback } from "react"
import { usePostVote, syncGlobalVoteState } from "./use-post-vote"

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
  // Get the voting functionality from the improved hook - this is the source of truth for votes
  const { userVote, upvotes, downvotes, handleVote } = usePostVote(postId, null, initialUpvotes, initialDownvotes)
  
  // Initialize or get existing post state for comments only
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
  
  // Local state for this component instance - only for comments, votes come from usePostVote
  const [syncedCommentCount, setSyncedCommentCount] = useState(initialCommentCount)
  
  // Keep post state in sync with vote hook values
  useEffect(() => {
    postState.upvotes = upvotes
    postState.downvotes = downvotes
    postState.userVote = userVote
    postState.lastUpdate = Date.now()
  }, [upvotes, downvotes, userVote, postState])
  
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
    console.log(`🗳️ [${postId}] Synced vote triggered:`, { 
      type, 
      currentState: { upvotes, downvotes, userVote } 
    })
    // The vote hook now handles all synchronization internally
    await handleVote(type)
    console.log(`✅ [${postId}] Synced vote completed:`, { 
      type, 
      newState: { upvotes, downvotes, userVote } 
    })
  }, [handleVote, postId, upvotes, downvotes, userVote])
  
  // Manual sync function for external updates (from modals) - simplified to use global vote state
  const syncState = useCallback((newUpvotes: number, newDownvotes: number, newUserVote: "up" | "down" | null) => {
    console.log(`🔄 [${postId}] Manual vote sync triggered:`, { 
      from: { upvotes, downvotes, userVote },
      to: { newUpvotes, newDownvotes, newUserVote }
    })
    
    // Sync with the global vote state - this will trigger usePostVote hook updates
    const globalSyncSuccess = syncGlobalVoteState(postId, newUpvotes, newDownvotes, newUserVote)
    console.log(`🌐 [${postId}] Global vote sync:`, globalSyncSuccess ? 'SUCCESS' : 'FAILED')
    
    if (globalSyncSuccess) {
      // Update the local post sync state for comments
      const newState = { 
        upvotes: newUpvotes, 
        downvotes: newDownvotes, 
        userVote: newUserVote, 
        commentCount: syncedCommentCount 
      }
      
      // Notify local post sync listeners about the vote change
      postState.listeners.forEach(listener => {
        try {
          listener(newState)
        } catch (error) {
          console.error(`❌ Error in sync listener for ${postId}:`, error)
        }
      })
      
      console.log(`✅ [${postId}] Manual vote sync completed:`, newState)
    } else {
      console.error(`❌ [${postId}] Manual vote sync failed - global state update failed`)
    }
  }, [postState, postId, syncedCommentCount, upvotes, downvotes, userVote])
  
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
