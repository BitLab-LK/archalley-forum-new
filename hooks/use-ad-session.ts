"use client"

import { useEffect, useRef } from 'react'
import { resetAdSession } from '@/lib/adConfig'

/**
 * Hook to manage advertisement session lifecycle
 * Automatically resets ad session when user navigates or starts new session
 */
export function useAdSession() {
  const sessionStartTime = useRef<number>(0)

  useEffect(() => {
    // Initialize ad session on first load
    if (sessionStartTime.current === 0) {
      resetAdSession()
      sessionStartTime.current = Date.now()
      console.log('🎯 Ad session initialized')
    }

    // Reset session when user navigates away and comes back
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sessionStartTime.current > 0) {
        // Reset session after user was away for more than 5 minutes
        const timeSinceInit = Date.now() - sessionStartTime.current
        if (timeSinceInit > 5 * 60 * 1000) { // 5 minutes
          resetAdSession()
          sessionStartTime.current = Date.now()
          console.log('🎯 Ad session reset after inactivity')
        }
      }
    }

    // Reset session on page refresh or new visit
    const handleBeforeUnload = () => {
      resetAdSession()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return {
    resetSession: resetAdSession
  }
}