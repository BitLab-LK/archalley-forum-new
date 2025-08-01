// Global activity event system for real-time updates
// This helps notify activity feeds when new activities occur

export type ActivityEventType = 'vote' | 'comment' | 'post_created'

export interface ActivityEvent {
  userId: string
  type: ActivityEventType
  postId?: string
  commentId?: string
  timestamp: number
}

class ActivityEventManager {
  private listeners: Map<string, ((event: ActivityEvent) => void)[]> = new Map()

  // Subscribe to activity events for a specific user
  subscribe(userId: string, callback: (event: ActivityEvent) => void) {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, [])
    }
    this.listeners.get(userId)!.push(callback)
  }

  // Unsubscribe from activity events
  unsubscribe(userId: string, callback: (event: ActivityEvent) => void) {
    const userListeners = this.listeners.get(userId)
    if (userListeners) {
      const index = userListeners.indexOf(callback)
      if (index > -1) {
        userListeners.splice(index, 1)
        if (userListeners.length === 0) {
          this.listeners.delete(userId)
        }
      }
    }
  }

  // Emit an activity event
  emit(event: ActivityEvent) {
    const userListeners = this.listeners.get(event.userId)
    if (userListeners) {
      userListeners.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error('Error in activity event listener:', error)
        }
      })
    }
  }

  // Emit vote activity
  emitVote(userId: string, postId: string) {
    this.emit({
      userId,
      type: 'vote',
      postId,
      timestamp: Date.now()
    })
  }

  // Emit comment activity
  emitComment(userId: string, postId: string, commentId: string) {
    this.emit({
      userId,
      type: 'comment',
      postId,
      commentId,
      timestamp: Date.now()
    })
  }

  // Emit post creation activity
  emitPostCreated(userId: string, postId: string) {
    this.emit({
      userId,
      type: 'post_created',
      postId,
      timestamp: Date.now()
    })
  }
}

export const activityEventManager = new ActivityEventManager()
