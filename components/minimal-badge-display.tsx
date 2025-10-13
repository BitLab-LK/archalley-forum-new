"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface BadgeData {
  id: string
  name: string
  description: string
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | string
  type: string
  color?: string
}

interface UserBadge {
  id: string
  badges: BadgeData
  earnedAt: string | Date
}

interface MinimalBadgeDisplayProps {
  badges: UserBadge[]
  maxDisplay?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

// Minimalistic design with simple circles and subtle colors
const MinimalBadgeDisplay = ({ 
  badges, 
  maxDisplay = 3,
  size = 'sm',
  showTooltip = true,
  className = '' 
}: MinimalBadgeDisplayProps) => {
  
  if (!badges || badges.length === 0) return null

  // Size configurations - smaller and more subtle
  const sizeConfig = {
    xs: { 
      size: 'w-4 h-4', 
      text: 'text-[8px]', 
      spacing: 'gap-1',
      fontSize: '8px'
    },
    sm: { 
      size: 'w-5 h-5', 
      text: 'text-[9px]', 
      spacing: 'gap-1',
      fontSize: '9px'
    },
    md: { 
      size: 'w-6 h-6', 
      text: 'text-[10px]', 
      spacing: 'gap-1.5',
      fontSize: '10px'
    },
    lg: { 
      size: 'w-7 h-7', 
      text: 'text-xs', 
      spacing: 'gap-2',
      fontSize: '11px'
    }
  }

  // Minimalistic level colors - more subtle and professional
  const getLevelColor = (level: string) => {
    const colors = {
      BRONZE: 'bg-amber-50 border-amber-200 text-amber-600',
      SILVER: 'bg-slate-50 border-slate-200 text-slate-600', 
      GOLD: 'bg-yellow-50 border-yellow-200 text-yellow-600',
      PLATINUM: 'bg-blue-50 border-blue-200 text-blue-600'
    }
    return colors[level as keyof typeof colors] || colors.SILVER
  }

  // Simple, minimal badge icons - just dots with level styling
  const getMinimalIcon = (level: string) => {
    // Use simple geometric shapes based on level
    switch (level) {
      case 'BRONZE': return '●'
      case 'SILVER': return '◆' 
      case 'GOLD': return '★'
      case 'PLATINUM': return '♦'
      default: return '●'
    }
  }

  const displayBadges = badges.slice(0, maxDisplay)
  const remainingCount = badges.length - displayBadges.length
  const { size: sizeClass, text, spacing, fontSize } = sizeConfig[size]

  const BadgeElement = ({ badge }: { badge: UserBadge }) => (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full border transition-all duration-200',
        'hover:scale-110 hover:shadow-sm',
        sizeClass,
        getLevelColor(badge.badges.level),
        'cursor-help font-medium'
      )}
      style={{ 
        fontSize,
        lineHeight: '1'
      }}
    >
      {getMinimalIcon(badge.badges.level)}
    </div>
  )

  if (!showTooltip) {
    return (
      <div className={cn('flex items-center', spacing, className)}>
        {displayBadges.map((badge) => (
          <BadgeElement key={badge.id} badge={badge} />
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              'inline-flex items-center justify-center rounded-full border bg-gray-50 border-gray-200 text-gray-500',
              sizeClass,
              text,
              'font-medium'
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center', spacing, className)}>
        {displayBadges.map((badge) => (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <BadgeElement badge={badge} />
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="max-w-xs"
            >
              <div className="text-center space-y-1">
                <div className="font-medium text-sm">{badge.badges.name}</div>
                <div className="text-xs text-muted-foreground">
                  {badge.badges.description}
                </div>
                <div className="text-xs text-muted-foreground">
                  {badge.badges.level} • {new Date(badge.earnedAt).toLocaleDateString()}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'inline-flex items-center justify-center rounded-full border bg-gray-50 border-gray-200 text-gray-500',
                  sizeClass,
                  text,
                  'font-medium cursor-help hover:scale-110 hover:shadow-sm transition-all duration-200'
                )}
              >
                +{remainingCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {remainingCount} more badge{remainingCount > 1 ? 's' : ''}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

export default MinimalBadgeDisplay