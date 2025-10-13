'use client'

import React from 'react'
import MinimalBadgeDisplay from './minimal-badge-display'

export interface BadgeData {
  id: string
  name: string
  type: string
  level: string
  description: string
  color: string
  icon?: string
}

interface UserBadge {
  id: string
  badges: BadgeData
  earnedAt: Date | string
}

interface PostBadgesProps {
  badges: BadgeData[]
  maxDisplay?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function PostBadges({ 
  badges, 
  maxDisplay = 3,
  size = 'sm',
  className
}: PostBadgesProps) {
  // Debug log to see what badges are being passed
  console.log('PostBadges DEBUG:', { badges, badgesLength: badges?.length });
  
  if (!badges || badges.length === 0) return null

  // Convert BadgeData[] to UserBadge[] format expected by MinimalBadgeDisplay
  const userBadges: UserBadge[] = badges.map((badge, index) => ({
    id: badge.id || `badge-${index}`,
    badges: badge,
    earnedAt: new Date()
  }))

  console.log('PostBadges converted userBadges:', userBadges);

  return (
    <MinimalBadgeDisplay
      badges={userBadges}
      maxDisplay={maxDisplay}
      size={size as 'xs' | 'sm' | 'md' | 'lg'}
      showTooltip={true}
      className={className}
    />
  )
}
