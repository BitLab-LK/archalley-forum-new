"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Star, 
  MessageSquare, 
  Crown, 
  Award,
  Users,
  Heart,
  TrendingUp,
  Briefcase,
  CheckCircle,
  Lightbulb,
  ThumbsUp,
  UserCheck,
  GraduationCap,
  Clock,
  FileText
} from 'lucide-react'

interface BadgeData {
  id: string
  name: string
  description: string
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | string
  type: string
  category?: string
  icon?: string
  color?: string
}

interface UserBadge {
  id: string
  badges: BadgeData
  earnedAt: string | Date
}

interface ProfessionalBadgeSystemProps {
  badges: UserBadge[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'shield' | 'certificate' | 'modern'
  animated?: boolean
  showTooltip?: boolean
  className?: string
}

// LinkedIn-style Professional Badge Component
const LinkedInStyleBadge = ({ 
  badge, 
  size = 'md', 
  animated = true, 
  className = '' 
}: { 
  badge: BadgeData
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}) => {
  // Size configurations
  const sizes = {
    sm: { width: 32, height: 32, iconSize: 14, padding: 'p-1.5' },
    md: { width: 40, height: 40, iconSize: 16, padding: 'p-2' },
    lg: { width: 48, height: 48, iconSize: 20, padding: 'p-2.5' }
  }
  
  const { width, height, iconSize, padding } = sizes[size]

  // Professional LinkedIn-style color schemes
  const getLevelStyles = (level: string) => {
    const styles = {
      BRONZE: {
        bg: 'bg-orange-100 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        icon: 'text-orange-600 dark:text-orange-400',
        text: 'text-orange-700 dark:text-orange-300'
      },
      SILVER: {
        bg: 'bg-slate-100 dark:bg-slate-900/20',
        border: 'border-slate-200 dark:border-slate-800',
        icon: 'text-slate-600 dark:text-slate-400',
        text: 'text-slate-700 dark:text-slate-300'
      },
      GOLD: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-400',
        text: 'text-yellow-700 dark:text-yellow-300'
      },
      PLATINUM: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-700 dark:text-blue-300'
      }
    }
    return styles[level as keyof typeof styles] || styles.SILVER
  }

  // Get appropriate icon for badge category/type with LinkedIn-style professional icons
  const getBadgeIcon = (badgeId: string, badgeType: string) => {
    // Primary mapping by badge ID from seed data
    const iconMap: Record<string, React.ComponentType<any>> = {
      // Activity Badges
      'first-post': Star,
      'active-contributor': UserCheck,
      'prolific-writer': FileText,
      'content-creator': Lightbulb,
      
      // Engagement Badges
      'conversationalist': MessageSquare,
      'discussion-leader': Users,
      'community-voice': ThumbsUp,
      
      // Appreciation Badges
      'helpful': Heart,
      'well-liked': ThumbsUp,
      'problem-solver': Lightbulb,
      'mentor': Users,
      
      // Tenure Badges
      'newcomer': Star,
      'regular': UserCheck,
      'veteran': Crown,
      'legend': Crown,
      
      // Achievement Badges
      'expert': GraduationCap,
      'trending': TrendingUp,
      'professional': Briefcase,
      
      // Quality Badges
      'quality-contributor': CheckCircle,
      'top-poster': Award,
      
      // Fallback by type (enum values from database)
      'ACTIVITY': UserCheck,
      'ENGAGEMENT': MessageSquare,
      'APPRECIATION': Heart,
      'TENURE': Clock,
      'ACHIEVEMENT': Award,
      'QUALITY': CheckCircle
    }
    
    // First try badge ID, then try badge type, finally fallback to UserCheck
    return iconMap[badgeId] || iconMap[badgeType] || UserCheck
  }

  const levelStyles = getLevelStyles(badge.level)
  const IconComponent = getBadgeIcon(badge.id, badge.type)

  return (
    <div 
      className={cn(
        "inline-flex items-center justify-center rounded-full border-2 transition-all duration-200",
        levelStyles.bg,
        levelStyles.border,
        padding,
        animated && "hover:scale-110 hover:shadow-md",
        "cursor-pointer",
        className
      )}
      style={{ width, height }}
    >
      <IconComponent 
        size={iconSize}
        className={cn(levelStyles.icon)}
        strokeWidth={2}
      />
    </div>
  )
}

// LinkedIn-style Certificate Badge
const LinkedInCertificateBadge = ({ 
  badge, 
  size = 'md', 
  animated = true, 
  className = '' 
}: { 
  badge: BadgeData
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}) => {
  const sizes = {
    sm: { iconSize: 12, padding: 'px-2 py-1', text: 'text-xs' },
    md: { iconSize: 14, padding: 'px-3 py-1.5', text: 'text-sm' },
    lg: { iconSize: 16, padding: 'px-4 py-2', text: 'text-base' }
  }
  
  const { iconSize, padding, text } = sizes[size]

  // Professional LinkedIn-style color schemes
  const getLevelStyles = (level: string) => {
    const styles = {
      BRONZE: {
        bg: 'bg-orange-50 dark:bg-orange-900/10',
        border: 'border-orange-200 dark:border-orange-800',
        icon: 'text-orange-600 dark:text-orange-400',
        text: 'text-orange-700 dark:text-orange-300'
      },
      SILVER: {
        bg: 'bg-slate-50 dark:bg-slate-900/10',
        border: 'border-slate-200 dark:border-slate-800',
        icon: 'text-slate-600 dark:text-slate-400',
        text: 'text-slate-700 dark:text-slate-300'
      },
      GOLD: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/10',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-400',
        text: 'text-yellow-700 dark:text-yellow-300'
      },
      PLATINUM: {
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-700 dark:text-blue-300'
      }
    }
    return styles[level as keyof typeof styles] || styles.SILVER
  }

  // Get appropriate icon
  const getBadgeIcon = (badgeId: string, badgeType: string) => {
    // Primary mapping by badge ID from seed data
    const iconMap: Record<string, React.ComponentType<any>> = {
      // Activity Badges
      'first-post': Star,
      'active-contributor': UserCheck,
      'prolific-writer': FileText,
      'content-creator': Lightbulb,
      
      // Engagement Badges
      'conversationalist': MessageSquare,
      'discussion-leader': Users,
      'community-voice': ThumbsUp,
      
      // Appreciation Badges
      'helpful': Heart,
      'well-liked': ThumbsUp,
      'problem-solver': Lightbulb,
      'mentor': Users,
      
      // Tenure Badges
      'newcomer': Star,
      'regular': UserCheck,
      'veteran': Crown,
      'legend': Crown,
      
      // Achievement Badges
      'expert': GraduationCap,
      'trending': TrendingUp,
      'professional': Briefcase,
      
      // Quality Badges
      'quality-contributor': CheckCircle,
      'top-poster': Award,
      
      // Fallback by type (enum values from database)
      'ACTIVITY': UserCheck,
      'ENGAGEMENT': MessageSquare,
      'APPRECIATION': Heart,
      'TENURE': Clock,
      'ACHIEVEMENT': Award,
      'QUALITY': CheckCircle
    }
    
    // First try badge ID, then try badge type, finally fallback to UserCheck
    return iconMap[badgeId] || iconMap[badgeType] || UserCheck
  }

  const levelStyles = getLevelStyles(badge.level)
  const IconComponent = getBadgeIcon(badge.id, badge.type)

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-2 border-2 transition-all duration-200 font-medium",
        levelStyles.bg,
        levelStyles.border,
        levelStyles.text,
        padding,
        text,
        animated && "hover:scale-105 hover:shadow-sm",
        className
      )}
    >
      <IconComponent 
        size={iconSize}
        className={levelStyles.icon}
        strokeWidth={2}
      />
      <span className="font-medium">{badge.name}</span>
      <span className="text-xs opacity-70 ml-1">{badge.level}</span>
    </Badge>
  )
}

// Main Professional Badge System Component
export const ProfessionalBadgeSystem = ({
  badges,
  maxDisplay = 3,
  size = 'md',
  variant = 'shield',
  animated = true,
  showTooltip = true,
  className = ''
}: ProfessionalBadgeSystemProps) => {
  const displayBadges = badges.slice(0, maxDisplay)
  const remainingCount = badges.length - maxDisplay

  const BadgeComponent = variant === 'certificate' ? LinkedInCertificateBadge : LinkedInStyleBadge

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {displayBadges.map((userBadge, index) => (
        <TooltipProvider key={userBadge.id}>
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <div
                className="group relative"
                style={{ 
                  animationDelay: animated ? `${index * 0.1}s` : '0s'
                }}
              >
                <BadgeComponent
                  badge={userBadge.badges}
                  size={size}
                  animated={animated}
                />
              </div>
            </TooltipTrigger>
            {showTooltip && (
              <TooltipContent 
                side="top" 
                align="center"
                sideOffset={12}
                className="max-w-xs z-[9999] bg-white dark:bg-gray-800 border shadow-xl p-3"
                avoidCollisions={true}
                collisionPadding={20}
                style={{ 
                  zIndex: 9999,
                  position: 'fixed'
                }}
              >
                <div className="text-center space-y-1">
                  <div className="font-semibold">{userBadge.badges.name}</div>
                  <div className="text-xs text-muted-foreground">{userBadge.badges.description}</div>
                  <div className="text-xs text-blue-500 font-medium">{userBadge.badges.level} Level</div>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {remainingCount > 0 && (
        <Badge variant="secondary" className="gap-1">
          <span>+{remainingCount}</span>
        </Badge>
      )}
    </div>
  )
}

export default ProfessionalBadgeSystem
