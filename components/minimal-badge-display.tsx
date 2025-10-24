"use client"

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Star, 
  Award, 
  Crown, 
  Diamond,
  Zap,
  MessageSquare,
  Shield,
  Trophy,
  CheckCircle,
  Sparkles,
  Target,
  GraduationCap
} from 'lucide-react'

interface BadgeData {
  id: string
  name: string
  description: string
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | string
  type: string
  color?: string
  icon?: string
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
  showNames?: boolean
  className?: string
}

// Minimalistic design with simple circles and subtle colors
const MinimalBadgeDisplay = ({ 
  badges, 
  maxDisplay = 3,
  size = 'sm',
  showTooltip = true,
  showNames = false,
  className = '' 
}: MinimalBadgeDisplayProps) => {
  
  if (!badges || badges.length === 0) return null

  // Size configurations - smaller and more subtle
  const sizeConfig = {
    xs: { 
      size: 'w-4 h-4', 
      text: 'text-[8px]', 
      spacing: 'gap-1'
    },
    sm: { 
      size: 'w-5 h-5', 
      text: 'text-[9px]', 
      spacing: 'gap-1'
    },
    md: { 
      size: 'w-6 h-6', 
      text: 'text-[10px]', 
      spacing: 'gap-1.5'
    },
    lg: { 
      size: 'w-7 h-7', 
      text: 'text-xs', 
      spacing: 'gap-2'
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

  // Professional minimalistic icon mapping
  const getBadgeIcon = (badgeId: string, badgeType: string, level: string) => {
    // Primary mapping by badge ID for specific badges
    const iconMap: Record<string, React.ComponentType<any>> = {
      // Activity Badges
      'first-post': Star,
      'active-contributor': Zap,
      'prolific-writer': Award,
      'content-creator': Diamond,
      
      // Engagement Badges
      'conversationalist': MessageSquare,
      'discussion-leader': Target,
      'community-voice': MessageSquare,
      
      // Appreciation Badges
      'helpful': Star,
      'well-liked': Trophy,
      'community-favorite': Crown,
      'expert': Sparkles,
      
      // Achievement Badges
      'problem-solver': CheckCircle,
      'mentor': GraduationCap,
      'guru': Sparkles,
      
      // Tenure Badges
      'newcomer': Target,
      'regular': Shield,
      'veteran': Award,
      'legend': Crown,
      
      // Quality Badges
      'trending': Trophy,
      'viral': Diamond,
      'verified-expert': CheckCircle,
    }

    // Fallback by badge type
    const typeIcons: Record<string, React.ComponentType<any>> = {
      'ACTIVITY': Zap,
      'ENGAGEMENT': MessageSquare,
      'APPRECIATION': Trophy,
      'TENURE': Shield,
      'ACHIEVEMENT': Award,
      'QUALITY': CheckCircle,
    }

    // Level fallback icons
    const levelIcons: Record<string, React.ComponentType<any>> = {
      'BRONZE': Star,
      'SILVER': Shield,
      'GOLD': Trophy,
      'PLATINUM': Crown,
    }

    // Return icon in priority order: specific badge ID > badge type > level > default
    return iconMap[badgeId] || typeIcons[badgeType] || levelIcons[level] || Star
  }

  const displayBadges = badges.slice(0, maxDisplay)
  const remainingCount = badges.length - displayBadges.length
  const { size: sizeClass, text, spacing } = sizeConfig[size]

  const BadgeElement = ({ badge }: { badge: UserBadge }) => {
    const IconComponent = getBadgeIcon(badge.badges.id, badge.badges.type, badge.badges.level)
    const iconSize = size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'md' ? 14 : 16
    const [isHovered, setIsHovered] = useState(false)
    
    // Get level display name
    const getLevelDisplayName = (level: string) => {
      const levelNames = {
        'BRONZE': 'Bronze',
        'SILVER': 'Silver', 
        'GOLD': 'Gold',
        'PLATINUM': 'Platinum'
      }
      return levelNames[level as keyof typeof levelNames] || level
    }
    
    if (showNames) {
      // Show as pill-shaped badge with icon and level name
      return (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-200',
            'hover:scale-105 hover:shadow-sm',
            getLevelColor(badge.badges.level),
            'cursor-help font-medium',
            text
          )}
        >
          <IconComponent 
            size={iconSize} 
            className="flex-shrink-0"
            strokeWidth={2}
          />
          <span className="whitespace-nowrap">{getLevelDisplayName(badge.badges.level)}</span>
        </div>
      )
    }
    
    // Show as circular icon only, expand to show level name on hover
    return (
      <div
        className={cn(
          'inline-flex items-center overflow-hidden rounded-full border transition-all duration-300 ease-out',
          'hover:shadow-sm cursor-help',
          getLevelColor(badge.badges.level),
          isHovered ? 'gap-1.5 px-2 py-1' : 'justify-center',
          isHovered ? '' : sizeClass
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <IconComponent 
          size={iconSize} 
          className="flex-shrink-0"
          strokeWidth={2}
        />
        <span 
          className={cn(
            'whitespace-nowrap font-medium transition-all duration-300 ease-out',
            text,
            isHovered ? 'opacity-100 max-w-20' : 'opacity-0 max-w-0'
          )}
        >
          {getLevelDisplayName(badge.badges.level)}
        </span>
      </div>
    )
  }

  if (!showTooltip) {
    return (
      <div className={cn('flex items-center', spacing, className)}>
        {displayBadges.map((badge) => (
          <BadgeElement key={badge.id} badge={badge} />
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              'inline-flex items-center justify-center border bg-gray-50 border-gray-200 text-gray-500',
              showNames ? 'px-2 py-1 rounded-full' : 'rounded-full',
              showNames ? '' : sizeClass,
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
                  'inline-flex items-center justify-center border bg-gray-50 border-gray-200 text-gray-500',
                  showNames ? 'px-2 py-1 rounded-full' : 'rounded-full',
                  showNames ? '' : sizeClass,
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