"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

interface UserBadge {
  id: string
  badges: {
    id: string
    name: string
    description: string
    icon: string
    color: string
    level: string
    type: string
  }
  earnedAt: Date
}

// This component handles automatic badge checking and notifications
export function BadgeNotificationHandler() {
  const { user, isAuthenticated } = useAuth()
  const [lastCheck, setLastCheck] = useState<number>(0)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (!user?.id || !isAuthenticated) return

    const checkBadges = async () => {
      // Only check every 30 seconds to avoid spam and prevent concurrent checks
      const now = Date.now()
      if (now - lastCheck < 30000 || isChecking) return

      try {
        setIsChecking(true)
        const response = await fetch(`/api/badges/user/${user.id}/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const data = await response.json()
          
          // Show notifications for new badges
          if (data.result?.awardedBadges && data.result.awardedBadges.length > 0) {
            data.result.awardedBadges.forEach((userBadge: UserBadge) => {
              toast.success(
                `🎉 Badge Earned: ${userBadge.badges.name}!`,
                {
                  description: userBadge.badges.description,
                  duration: 8000, // Longer duration for badge notifications
                  action: {
                    label: 'View Badges',
                    onClick: () => {
                      // Could navigate to profile/badges page
                      console.log('Navigate to badges page')
                    },
                  },
                }
              )
            })
          }
        } else {
          console.warn('Badge check failed with status:', response.status)
        }
        
        setLastCheck(now)
      } catch (error) {
        console.error('Error checking badges:', error)
        // Don't show error toasts to avoid spam, just log
      } finally {
        setIsChecking(false)
      }
    }

    // Check badges on component mount
    checkBadges()
    
    // Set up periodic checking every 2 minutes (less frequent)
    const interval = setInterval(checkBadges, 120000)
    
    return () => clearInterval(interval)
  }, [user?.id, isAuthenticated, lastCheck, isChecking])

  return null // This component doesn't render anything
}

// Function to manually trigger badge check (can be called after user actions)
export async function triggerBadgeCheck(userId?: string): Promise<UserBadge[]> {
  if (!userId) {
    console.warn('triggerBadgeCheck called without userId')
    return []
  }
  
  try {
    const response = await fetch(`/api/badges/user/${userId}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000)
    })

    if (response.ok) {
      const data = await response.json()
      const awardedBadges = data.result?.awardedBadges || []
      
      // Show toast notifications for manually triggered badge checks
      if (awardedBadges.length > 0) {
        awardedBadges.forEach((userBadge: UserBadge) => {
          toast.success(
            `🎉 Badge Earned: ${userBadge.badges.name}!`,
            {
              description: userBadge.badges.description,
              duration: 8000,
            }
          )
        })
      }
      
      return awardedBadges
    } else {
      console.error('Badge check failed:', response.status, response.statusText)
      return []
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Badge check timeout')
    } else {
      console.error('Error checking badges:', error)
    }
    return []
  }
}
