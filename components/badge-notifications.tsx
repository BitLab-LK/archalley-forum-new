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

  useEffect(() => {
    if (!user?.id || !isAuthenticated) return

    const checkBadges = async () => {
      // Only check every 30 seconds to avoid spam
      const now = Date.now()
      if (now - lastCheck < 30000) return

      try {
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
                  duration: 6000,
                }
              )
            })
          }
        }
        
        setLastCheck(now)
      } catch (error) {
        console.error('Error checking badges:', error)
      }
    }

    // Check badges immediately and then periodically
    checkBadges()
    
    // Set up periodic checking every 60 seconds
    const interval = setInterval(checkBadges, 60000)
    
    return () => clearInterval(interval)
  }, [user?.id, isAuthenticated, lastCheck])

  return null // This component doesn't render anything
}

// Function to manually trigger badge check (can be called after user actions)
export async function triggerBadgeCheck(userId?: string) {
  if (!userId) return []
  
  try {
    const response = await fetch(`/api/badges/user/${userId}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      return data.result?.awardedBadges || []
    }
  } catch (error) {
    console.error('Error checking badges:', error)
    return []
  }
}
