import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  type: string
  level: string
  isActive: boolean
}

interface UserBadge {
  id: string
  userId: string
  badgeId: string
  earnedAt: Date
  awardedBy?: string
  badges: Badge
}

export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/badges')
      if (!response.ok) {
        throw new Error('Failed to fetch badges')
      }
      const data = await response.json()
      setBadges(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch badges')
    } finally {
      setLoading(false)
    }
  }

  const awardBadge = async (userId: string, badgeId: string) => {
    try {
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, badgeId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to award badge')
      }
      
      return await response.json()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to award badge')
    }
  }

  return {
    badges,
    loading,
    error,
    fetchBadges,
    awardBadge,
  }
}

export function useUserBadges(userId?: string) {
  const { user } = useAuth()
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const targetUserId = userId || user?.id

  useEffect(() => {
    if (targetUserId) {
      fetchUserBadges()
    }
  }, [targetUserId])

  const fetchUserBadges = async () => {
    if (!targetUserId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/badges/user/${targetUserId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user badges')
      }
      const data = await response.json()
      setUserBadges(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user badges')
    } finally {
      setLoading(false)
    }
  }

  const checkAndAwardBadges = async () => {
    if (!targetUserId) return

    try {
      const response = await fetch(`/api/badges/user/${targetUserId}/check`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to check badges')
      }
      
      const result = await response.json()
      
      // Refresh user badges if any were awarded
      if (result.awardedBadges.length > 0) {
        await fetchUserBadges()
      }
      
      return result
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to check badges')
    }
  }

  return {
    userBadges,
    loading,
    error,
    fetchUserBadges,
    checkAndAwardBadges,
  }
}

export function useBadgeLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/badges/leaderboard')
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      const data = await response.json()
      setLeaderboard(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard')
    } finally {
      setLoading(false)
    }
  }

  return {
    leaderboard,
    loading,
    error,
    fetchLeaderboard,
  }
}
