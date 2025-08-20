import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BadgeDisplayProps {
  badges: Array<{
    id: string
    name: string
    description: string
    icon: string
    color: string
    level: string
    earnedAt?: Date
  }>
  limit?: number
  showNames?: boolean
  size?: "sm" | "md" | "lg"
}

const levelColors = {
  BRONZE: "bg-amber-100 text-amber-800 border-amber-300",
  SILVER: "bg-gray-100 text-gray-800 border-gray-300", 
  GOLD: "bg-yellow-100 text-yellow-800 border-yellow-300",
  PLATINUM: "bg-purple-100 text-purple-800 border-purple-300"
}

const fallbackIcons = {
  BRONZE: "●",
  SILVER: "◆", 
  GOLD: "★",
  PLATINUM: "♦"
}

const sizeClasses = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-sm px-2 py-1", 
  lg: "text-base px-3 py-1.5"
}

export default function BadgeDisplay({ 
  badges, 
  limit = 5, 
  showNames = false, 
  size = "md" 
}: BadgeDisplayProps) {
  const displayBadges = limit ? badges.slice(0, limit) : badges
  const remainingCount = badges.length - displayBadges.length

  if (badges.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        No badges earned yet
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <TooltipProvider>
        {displayBadges.map((badge) => (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`${levelColors[badge.level as keyof typeof levelColors]} ${sizeClasses[size]} transition-all hover:scale-105 cursor-help`}
                style={{ backgroundColor: badge.color + "20", borderColor: badge.color + "40" }}
              >
                <span className="mr-1">
                  {badge.icon && badge.icon !== '?' && badge.icon !== '�' 
                    ? badge.icon 
                    : fallbackIcons[badge.level as keyof typeof fallbackIcons] || "●"
                  }
                </span>
                {showNames && <span>{badge.name}</span>}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-semibold">{badge.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{badge.description}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {badge.level} • {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'Recently earned'}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
      
      {remainingCount > 0 && (
        <Badge variant="outline" className={`bg-gray-50 text-gray-600 border-gray-200 ${sizeClasses[size]}`}>
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}
