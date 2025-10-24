"use client"

/**
 * Hook to monitor session validity and auto-logout when role changes
 */

import { useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface UseSessionMonitorOptions {
  checkInterval?: number // Check interval in milliseconds (default: 30 seconds)
  enabled?: boolean // Whether to enable monitoring (default: true)
}

export function useSessionMonitor(options: UseSessionMonitorOptions = {}) {
  const { checkInterval = 30000, enabled = true } = options
  const { data: session, status } = useSession()
  const router = useRouter()
  const lastCheckRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled || status !== "authenticated" || !session?.user) {
      return
    }

    const checkSessionValidity = async () => {
      try {
        const response = await fetch('/api/auth/session-check', {
          method: 'GET',
          credentials: 'include'
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          
          if (response.status === 401 && data.requiresReauth) {
            console.log('🔐 Session invalidated due to role change')
            
            // Show notification
            toast.error(
              data.reason === 'Role changed after session creation' 
                ? "Your account privileges have been updated. Please sign in again."
                : "Your session has expired. Please sign in again.",
              { duration: 5000 }
            )
            
            // Sign out and redirect
            await signOut({ 
              callbackUrl: '/auth/register?tab=login&message=' + 
                encodeURIComponent('Your session has expired due to account changes. Please sign in again.'),
              redirect: true 
            })
            
            return
          }
        }

        const data = await response.json()
        
        if (!data.valid) {
          console.log('🔐 Session check failed:', data.reason)
          
          toast.error("Your session has expired. Please sign in again.", { duration: 5000 })
          
          await signOut({ 
            callbackUrl: '/auth/register?tab=login&message=' + 
              encodeURIComponent('Your session has expired. Please sign in again.'),
            redirect: true 
          })
        }
        
      } catch (error) {
        console.error('❌ Session check failed:', error)
        // Don't auto-logout on network errors - might be temporary
      }
    }

    // Initial check
    checkSessionValidity()

    // Set up periodic checking
    intervalRef.current = setInterval(checkSessionValidity, checkInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session, status, enabled, checkInterval, router])

  // Also check when the window gains focus (user returns to tab)
  useEffect(() => {
    if (!enabled || status !== "authenticated") {
      return
    }

    const handleFocus = () => {
      const now = Date.now()
      // Only check if it's been more than 10 seconds since last check
      if (now - lastCheckRef.current > 10000) {
        lastCheckRef.current = now
        
        fetch('/api/auth/session-check', {
          method: 'GET',
          credentials: 'include'
        })
        .then(async (response) => {
          if (!response.ok && response.status === 401) {
            const data = await response.json().catch(() => ({}))
            if (data.requiresReauth) {
              toast.error("Your account privileges have been updated. Please sign in again.")
              await signOut({ 
                callbackUrl: '/auth/register?tab=login',
                redirect: true 
              })
            }
          }
        })
        .catch(console.error)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [enabled, status])
}

/**
 * Component wrapper that automatically monitors session validity
 */
export function SessionMonitor({ 
  children, 
  ...options 
}: UseSessionMonitorOptions & { children: React.ReactNode }) {
  useSessionMonitor(options)
  return <>{children}</>
}