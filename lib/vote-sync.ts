// Global vote synchronization system for real-time updates between components
import { activityEventManager } from "./activity-events"

type VoteType = "up" | "down" | null

interface VoteState {
  upvotes: number
  downvotes: number
  userVote: VoteType
}

interface VoteListener {
  id: string
  callback: (state: VoteState) => void
}

class GlobalVoteManager {
  private states = new Map<string, VoteState>()
  private listeners = new Map<string, Set<VoteListener>>()
  
  // Initialize or update vote state for a post
  setState(postId: string, state: VoteState) {
    this.states.set(postId, { ...state })
    this.notifyListeners(postId, state)
  }
  
  // Get current vote state for a post
  getState(postId: string): VoteState | null {
    return this.states.get(postId) || null
  }
  
  // Subscribe to vote changes for a post
  subscribe(postId: string, listenerId: string, callback: (state: VoteState) => void) {
    if (!this.listeners.has(postId)) {
      this.listeners.set(postId, new Set())
    }
    
    const listeners = this.listeners.get(postId)!
    listeners.add({ id: listenerId, callback })
    
    // Immediately call with current state if available
    const currentState = this.states.get(postId)
    if (currentState) {
      callback(currentState)
    }
  }
  
  // Unsubscribe from vote changes
  unsubscribe(postId: string, listenerId: string) {
    const listeners = this.listeners.get(postId)
    if (listeners) {
      for (const listener of listeners) {
        if (listener.id === listenerId) {
          listeners.delete(listener)
          break
        }
      }
      
      // Clean up empty listener sets
      if (listeners.size === 0) {
        this.listeners.delete(postId)
        this.states.delete(postId)
      }
    }
  }
  
  // Notify all listeners of a vote state change
  private notifyListeners(postId: string, state: VoteState) {
    const listeners = this.listeners.get(postId)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener.callback(state)
        } catch (error) {
          console.error(`Error in vote listener ${listener.id}:`, error)
        }
      })
    }
  }
  
  // Update vote counts after API call
  updateFromServer(postId: string, serverState: VoteState) {
    this.setState(postId, serverState)
  }
}

// Global instance
export const globalVoteManager = new GlobalVoteManager()

// Hook for using global vote state
export function useGlobalVoteState(postId: string, initialState: VoteState) {
  const [voteState, setVoteState] = React.useState<VoteState>(initialState)
  const componentId = React.useRef(`component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  
  React.useEffect(() => {
    // Subscribe to global vote changes
    globalVoteManager.subscribe(postId, componentId.current, (newState) => {
      setVoteState(newState)
    })
    
    // Initialize global state if not exists
    const existingState = globalVoteManager.getState(postId)
    if (!existingState) {
      globalVoteManager.setState(postId, initialState)
    }
    
    return () => {
      globalVoteManager.unsubscribe(postId, componentId.current)
    }
  }, [postId, initialState.upvotes, initialState.downvotes, initialState.userVote])
  
  const updateVote = React.useCallback((newState: VoteState) => {
    globalVoteManager.setState(postId, newState)
  }, [postId])
  
  return { voteState, updateVote }
}

// React import for the hook
import * as React from "react"
