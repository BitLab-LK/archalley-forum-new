"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  FileText, 
  User,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { activityEventManager, ActivityEvent } from "@/lib/activity-events"

interface Activity {
  id: string
  type: "post_liked" | "post_disliked" | "comment_created" | "post_created"
  action: string
  target: {
    type: string
    id: string
    content: string
    category?: string
    author?: {
      name: string | null
      id: string
    }
  }
  metadata?: {
    upvotes?: number
    comments?: number
  }
  createdAt: string
  timeAgo: string
}

interface ActivityFeedProps {
  userId: string
  userName?: string
  isOwnProfile?: boolean
}

export default function ActivityFeed({ userId, userName, isOwnProfile = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchActivities()
  }, [userId])

  const refreshActivities = useCallback(() => {
    fetchActivities(1, true)
  }, [])

  // Listen to real-time activity events
  useEffect(() => {
    const handleActivityEvent = (event: ActivityEvent) => {
      // Refresh activities when user performs actions
      .toISOString()}`)

// Add a small delay to ensure database has been updated
      setTimeout(() => {
        
        refreshActivities()
      }, 500)
    }

activityEventManager.subscribe(userId, handleActivityEvent)
    
    return () => {
      
      activityEventManager.unsubscribe(userId, handleActivityEvent)
    }
  }, [userId, refreshActivities])

  // Auto-refresh every 30 seconds if user is active on the page
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshActivities()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [refreshActivities]) // Fixed: use refreshActivities instead of userId

  // Listen for page visibility changes to refresh when user comes back
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshActivities()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshActivities]) // Fixed: use refreshActivities instead of userId

  const fetchActivities = async (pageNum = 1, isRefresh = false) => {
    try {
      
      if (!isRefresh) setLoading(true)
      if (isRefresh) setIsRefreshing(true)
      
      const response = await fetch(`/api/users/${userId}/activity?page=${pageNum}&limit=10&t=${Date.now()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch activities")
      }
      
      const data = await response.json()

if (pageNum === 1) {
        setActivities(data.activities)
        
      } else {
        setActivities(prev => [...prev, ...data.activities])
        
      }
      
      setHasMore(data.pagination.hasMore)
      setPage(pageNum)
    } catch (err) {
      console.error(`❌ Failed to fetch activities for user ${userId}:`, err)
      setError(err instanceof Error ? err.message : "Failed to load activities")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const loadMore = () => {
    fetchActivities(page + 1)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "post_liked":
        return <ThumbsUp className="w-4 h-4 text-blue-500" />
      case "post_disliked":
        return <ThumbsDown className="w-4 h-4 text-red-500" />
      case "comment_created":
        return <MessageCircle className="w-4 h-4 text-green-500" />
      case "post_created":
        return <FileText className="w-4 h-4 text-purple-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "post_liked":
        return "bg-blue-50 border-blue-200"
      case "post_disliked":
        return "bg-red-50 border-red-200"
      case "comment_created":
        return "bg-green-50 border-green-200"
      case "post_created":
        return "bg-purple-50 border-purple-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const formatActivityText = (activity: Activity) => {
    const { action, target } = activity
    const authorName = target.author?.name || "someone"
    
    switch (activity.type) {
      case "post_liked":
        return (
          <span>
            <span className="font-medium">{action}</span> {target.author?.id !== userId ? `${authorName}'s post` : "their own post"}
          </span>
        )
      case "post_disliked":
        return (
          <span>
            <span className="font-medium">{action}</span> {target.author?.id !== userId ? `${authorName}'s post` : "their own post"}
          </span>
        )
      case "comment_created":
        return (
          <span>
            <span className="font-medium">{action}</span> {target.author?.id !== userId ? `${authorName}'s post` : "their own post"}
          </span>
        )
      case "post_created":
        return (
          <span>
            <span className="font-medium">{action}</span>
            {target.category && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {target.category}
              </Badge>
            )}
          </span>
        )
      default:
        return <span className="font-medium">{action}</span>
    }
  }

  if (loading && activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading activities: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No activity yet</p>
            <p className="text-sm">
              {isOwnProfile 
                ? "Your activity will appear here when you start interacting with posts" 
                : `${userName}'s activity will appear here`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayedActivities = showAll ? activities : activities.slice(0, 5)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              {isRefreshing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshActivities}
                disabled={isRefreshing}
                className="text-sm"
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              {activities.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show All ({activities.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {displayedActivities.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start space-x-3 p-4 rounded-lg border transition-colors hover:bg-gray-50",
                  getActivityColor(activity.type)
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">
                        {formatActivityText(activity)}
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        <span>{activity.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showAll && hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Loading more...
                  </>
                ) : (
                  "Load More Activities"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

