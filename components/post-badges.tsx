'use client'

import React from 'react'
import { ProfessionalBadgeSystem } from './professional-badge-system'

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

  // Map size to ProfessionalBadgeSystem's expected sizes
  const mapSize = (inputSize: string): 'sm' | 'md' | 'lg' => {
    switch (inputSize) {
      case 'sm':
      case 'xs':
        return 'sm'
      case 'md':
        return 'md'
      case 'lg':
      case 'xl':
        return 'lg'
      default:
        return 'sm'
    }
  }

  // Convert BadgeData[] to UserBadge[] format expected by ProfessionalBadgeSystem
  const userBadges: UserBadge[] = badges.map((badge, index) => ({
    id: badge.id || `badge-${index}`,
    badges: badge,
    earnedAt: new Date()
  }))

  console.log('PostBadges converted userBadges:', userBadges);

  return (
    <ProfessionalBadgeSystem
      badges={userBadges}
      maxDisplay={maxDisplay}
      size={mapSize(size)}
      variant="shield"
      animated={true}
      showTooltip={true}
      className={className}
    />
  )
}
