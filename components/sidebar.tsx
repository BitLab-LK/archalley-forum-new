import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, Users, Award } from "lucide-react"
import { useEffect, useState } from "react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  color: string
  icon: string
  slug: string
  count: number
}

interface TrendingPost {
  id: string
  content: string
  author: {
    name: string
    avatar: string
  }
  upvotes: number
}

interface TopContributor {
  id: string
  name: string
  rank: string
  posts: number
  avatar: string
  isVerified?: boolean
}

export default function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([])
  const [isTrendingLoading, setIsTrendingLoading] = useState(true)
  const [topContributors, setTopContributors] = useState<TopContributor[]>([])
  const [isContributorsLoading, setIsContributorsLoading] = useState(true)
  
  // Use sidebar context for real-time updates
  const { categoriesKey, trendingKey } = useSidebar()

  // Category color mapping consistent with post-card.tsx
  const CATEGORY_COLORS = {
    business: "bg-blue-500",
    design: "bg-purple-500", 
    career: "bg-green-500",
    construction: "bg-yellow-500",
    academic: "bg-indigo-500",
    informative: "bg-cyan-500",
    other: "bg-gray-500",
  } as const

  // Get light background color for categories
  const getCategoryLightColor = (categoryName: string): string => {
    const normalizedName = categoryName.toLowerCase()
    const colorClass = CATEGORY_COLORS[normalizedName as keyof typeof CATEGORY_COLORS] ?? "bg-gray-500"
    
    // Map to light background versions
    switch (colorClass) {
      case 'bg-blue-500':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50'
      case 'bg-purple-500':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50'
      case 'bg-green-500':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50'
      case 'bg-yellow-500':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
      case 'bg-indigo-500':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
      case 'bg-cyan-500':
        return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-200 dark:hover:bg-cyan-900/50'
      case 'bg-gray-500':
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-900/50'
    }
  }

  // Get dot color for category indicator
  const getCategoryDotColor = (categoryName: string): string => {
    const normalizedName = categoryName.toLowerCase()
    return CATEGORY_COLORS[normalizedName as keyof typeof CATEGORY_COLORS] ?? "bg-gray-500"
  }

  // Fetch categories - now responds to categoriesKey changes
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache', // Prevent caching issues after logout
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to fetch categories:', response.status, errorText)
          throw new Error(`Failed to fetch categories: ${response.status}`)
        }
        
        const data = await response.json()
        setCategories(data)
        
      } catch (error) {
        console.error('Error fetching categories:', error)
        // Set empty array instead of keeping old data
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }

    // Add a small delay to prevent race conditions after logout
    const timeoutId = setTimeout(() => {
      fetchCategories()
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [categoriesKey]) // Re-fetch when categoriesKey changes

  // Fetch trending posts - now responds to trendingKey changes  
  useEffect(() => {
    const fetchTrendingPosts = async () => {
      setIsTrendingLoading(true)
      try {
        const response = await fetch('/api/posts?limit=5&sortBy=upvotes&sortOrder=desc', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache', // Prevent caching issues after logout
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to fetch trending posts:', response.status, errorText)
          throw new Error(`Failed to fetch trending posts: ${response.status}`)
        }
        
        const data = await response.json()
        setTrendingPosts(data.posts || [])
        
      } catch (error) {
        console.error('Error fetching trending posts:', error)
        // Set empty array instead of keeping old data
        setTrendingPosts([])
      } finally {
        setIsTrendingLoading(false)
      }
    }

    // Add a small delay to prevent race conditions after logout
    const timeoutId = setTimeout(() => {
      fetchTrendingPosts()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [trendingKey]) // Re-fetch when trendingKey changes

  // Fetch top contributors
  useEffect(() => {
    const fetchTopContributors = async () => {
      setIsContributorsLoading(true)
      try {
        const response = await fetch('/api/users/top-contributors?limit=4', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache',
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to fetch top contributors:', response.status, errorText)
          throw new Error(`Failed to fetch top contributors: ${response.status}`)
        }
        
        const data = await response.json()
        setTopContributors(data.contributors || [])
        
      } catch (error) {
        console.error('Error fetching top contributors:', error)
        // Set empty array instead of keeping old data
        setTopContributors([])
      } finally {
        setIsContributorsLoading(false)
      }
    }

    // Add a small delay to prevent race conditions after logout
    const timeoutId = setTimeout(() => {
      fetchTopContributors()
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [trendingKey]) // Re-fetch when trendingKey changes

  // Helper function to format rank display
  const formatRank = (rank: string) => {
    return rank.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get rank color based on rank level
  const getRankColor = (rank: string) => {
    const rankColors = {
      'NEW_MEMBER': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
      'CONVERSATION_STARTER': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200',
      'RISING_STAR': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200',
      'VISUAL_STORYTELLER': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200',
      'VALUED_RESPONDER': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200',
      'COMMUNITY_EXPERT': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-200',
      'TOP_CONTRIBUTOR': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200',
    };
    return rankColors[rank as keyof typeof rankColors] || rankColors.NEW_MEMBER;
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 transform animate-slideInUp" style={{ animationDelay: '0ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <TrendingUp className={cn("w-4 h-4 text-orange-600 dark:text-orange-400", isLoading && "animate-pulse")} />
              </div>
              <span className="text-gray-900 dark:text-gray-100">Categories</span>
            </div>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between animate-pulse p-3 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-10" />
              </div>
            ))
          ) : (
            categories.map((category, index) => {
              return (
                <div 
                  key={category.id} 
                  className={`group flex items-center justify-between rounded-xl p-3 transition-all duration-200 cursor-pointer border border-transparent ${getCategoryLightColor(category.name)} transform animate-slideInUp`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getCategoryDotColor(category.name)} ring-2 ring-white dark:ring-gray-800 group-hover:scale-110 transition-transform`} />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Trending Posts */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-900/10 transform animate-slideInUp" style={{ animationDelay: '200ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Award className={cn("w-4 h-4 text-orange-600 dark:text-orange-400", isTrendingLoading && "animate-pulse")} />
              </div>
              <span className="text-gray-900 dark:text-gray-100">Trending Posts</span>
            </div>
            {isTrendingLoading && (
              <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {isTrendingLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3 animate-pulse p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="flex items-center justify-between text-xs">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
                </div>
              </div>
            ))
          ) : trendingPosts.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 italic">No trending posts found.</div>
          ) : (
            trendingPosts.map((post, index) => (
              <div 
                key={post.id} 
                className="group p-4 rounded-xl bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/60 transition-all duration-200 cursor-pointer hover:shadow-sm border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800 transform animate-slideInUp"
                style={{
                  animationDelay: `${index * 150}ms`,
                  animationFillMode: 'both'
                }}
              >
                <h4 className="text-sm font-medium line-clamp-2 text-gray-800 dark:text-gray-200 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">{post.content}</h4>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="flex items-center space-x-1">
                    <span>by</span>
                    <span className="font-medium text-gray-600 dark:text-gray-300">{post.author.name}</span>
                  </span>
                  <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-medium">{post.upvotes}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-900/10 transform animate-slideInUp" style={{ animationDelay: '400ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className={cn("w-4 h-4 text-green-600 dark:text-green-400", isContributorsLoading && "animate-pulse")} />
              </div>
              <span className="text-gray-900 dark:text-gray-100">Top Contributors</span>
            </div>
            {isContributorsLoading && (
              <div className="w-4 h-4 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {isContributorsLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="group flex items-center space-x-3 p-3 rounded-xl animate-pulse">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                </div>
                <div className="text-right space-y-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-6" />
                </div>
              </div>
            ))
          ) : topContributors.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 italic">No contributors found.</div>
          ) : (
            topContributors.map((contributor, index) => (
              <div 
                key={contributor.id} 
                className="group flex items-center space-x-3 p-3 rounded-xl bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/60 transition-all duration-200 cursor-pointer hover:shadow-sm border border-gray-100 dark:border-gray-800 hover:border-green-200 dark:hover:border-green-800 transform animate-slideInUp"
                style={{
                  animationDelay: `${index * 120}ms`,
                  animationFillMode: 'both'
                }}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-800 group-hover:ring-green-200 dark:group-hover:ring-green-800 transition-all">
                    <AvatarImage src={contributor.avatar || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold">
                      {contributor.name[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                  )}
                  {contributor.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                    {contributor.name}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs mt-1 px-2 py-0.5",
                      getRankColor(contributor.rank)
                    )}
                  >
                    {formatRank(contributor.rank)}
                  </Badge>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                    {contributor.posts}
                  </Badge>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">posts</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideInUp {
          animation: slideInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  )
}

