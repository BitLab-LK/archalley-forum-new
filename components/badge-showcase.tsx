import { useState } from 'react'
import { useUserBadges, useBadges } from '@/hooks/use-badges'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Star, Award, Crown } from 'lucide-react'

interface BadgeShowcaseProps {
  userId?: string
  showAvailableBadges?: boolean
}

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'BRONZE': return <Award className="w-4 h-4" />
    case 'SILVER': return <Star className="w-4 h-4" />
    case 'GOLD': return <Trophy className="w-4 h-4" />
    case 'PLATINUM': return <Crown className="w-4 h-4" />
    default: return <Award className="w-4 h-4" />
  }
}

const getLevelColor = (level: string) => {
  switch (level) {
    case 'BRONZE': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'SILVER': return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'GOLD': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'PLATINUM': return 'bg-purple-100 text-purple-800 border-purple-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function BadgeShowcase({ userId, showAvailableBadges = false }: BadgeShowcaseProps) {
  const { userBadges, loading: userBadgesLoading, checkAndAwardBadges } = useUserBadges(userId)
  const { badges, loading: badgesLoading } = useBadges()
  const [checking, setChecking] = useState(false)

  const handleCheckBadges = async () => {
    if (!userId) return
    
    setChecking(true)
    try {
      const result = await checkAndAwardBadges()
      if (result.awardedBadges.length > 0) {
        // Show success message or toast
        
      }
    } catch (error) {
      console.error('Error checking badges:', error)
    } finally {
      setChecking(false)
    }
  }

  if (userBadgesLoading || badgesLoading) {
    return <div className="text-center py-4">Loading badges...</div>
  }

  const earnedBadgeIds = userBadges.map(ub => ub.badgeId)
  const availableBadges = badges.filter(badge => !earnedBadgeIds.includes(badge.id))

  return (
    <div className="space-y-6">
      {/* User's Earned Badges */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Earned Badges ({userBadges.length})
              </CardTitle>
              <CardDescription>
                Your achievements and contributions to the community
              </CardDescription>
            </div>
            {userId && (
              <Button 
                onClick={handleCheckBadges} 
                disabled={checking}
                size="sm"
                variant="outline"
              >
                {checking ? 'Checking...' : 'Check for New Badges'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {userBadges.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No badges earned yet. Start participating to earn your first badges!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBadges.map((userBadge) => (
                <div
                  key={userBadge.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: userBadge.badges.color + '20' }}
                  >
                    {userBadge.badges.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">
                        {userBadge.badges.name}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getLevelColor(userBadge.badges.level)}`}
                      >
                        {getLevelIcon(userBadge.badges.level)}
                        {userBadge.badges.level}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {userBadge.badges.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Earned {new Date(userBadge.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Badges */}
      {showAvailableBadges && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Available Badges ({availableBadges.length})
            </CardTitle>
            <CardDescription>
              Badges you can earn by participating in the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 opacity-60"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: badge.color + '20' }}
                  >
                    {badge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">
                        {badge.name}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getLevelColor(badge.level)}`}
                      >
                        {getLevelIcon(badge.level)}
                        {badge.level}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {badge.description}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {badge.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

