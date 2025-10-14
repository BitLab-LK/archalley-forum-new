import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, Users, Award } from "lucide-react"
import { useEffect, useState, memo } from "react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { generateCategoryStyles } from "@/lib/color-utils"

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
  title: string
  author: {
    name: string
    avatar: string
  }
  category: {
    name: string
    color: string
  }
  stats: {
    upvotes: number
    comments: number
  }
  timeAgo: string
}

interface TopContributor {
  id: string
  name: string
  avatar: string
  isVerified: boolean
  totalPosts: number
  totalComments: number
  totalContributions: number
  totalUpvotes: number
  contributionScore: number
  badge: {
    name: string
    icon: string
    color: string
    level: string
    type: string
  } | null
}

function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([])
  const [isTrendingLoading, setIsTrendingLoading] = useState(false) // Start with false, will be set to true when fetching
  const [topContributors, setTopContributors] = useState<TopContributor[]>([])
  const [isContributorsLoading, setIsContributorsLoading] = useState(false) // Start with false, will be set to true when fetching
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false) // Track if we've attempted initial load
  
  // Use sidebar context for real-time updates
  const { categoriesKey, trendingKey } = useSidebar()

  // Helper function to get category styles using database colors
  const getCategoryStyles = (categoryColor: string) => {
    return generateCategoryStyles(categoryColor)
  }


  // Load sidebar data with staggered loading for better perceived performance
  useEffect(() => {
    if (hasLoadedInitialData) return // Prevent duplicate loads
    
    console.log('🔄 Loading sidebar data...')
    
    // Helper function for fetch with retry but shorter timeouts for sidebar
    const fetchWithRetry = async (url: string, retries = 2): Promise<Response> => {
      for (let i = 0; i <= retries; i++) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json'
            },
            // Use default caching for sidebar data
          })
          
          if (response.ok) {
            return response
          }
          
          // Shorter delays for sidebar data
          const delay = 300 * (i + 1)
          
          if (i < retries) {
            console.warn(`Sidebar API ${url} failed with ${response.status}, retrying in ${delay}ms`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        } catch (error) {
          if (i === retries) {
            throw error
          }
          const delay = 500 * (i + 1)
          console.warn(`Sidebar network error for ${url}, retrying in ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
      throw new Error('Max retries exceeded')
    }

    // Load categories first (most important), then stagger other requests
    const loadSidebarData = async () => {
      setHasLoadedInitialData(true)
      
      // 1. Load categories from database
      const fetchCategories = async () => {
        try {
          const response = await fetchWithRetry('/api/categories')
          const categoriesData = await response.json()
          
          if (categoriesData && Array.isArray(categoriesData) && categoriesData.length > 0) {
            setCategories(categoriesData);
          } else {
            // If no categories in database, show empty state
            setCategories([]);
          }
        } catch (error) {
          console.error('Sidebar: Error fetching categories:', error)
          // On error, show empty state
          setCategories([]);
        } finally {
          setIsLoading(false)
        }
      }

      // 2. Load trending posts (optimized endpoint)
      const fetchTrending = async () => {
        setIsTrendingLoading(true)
        
        try {
          const response = await fetchWithRetry('/api/trending-posts?limit=5')
          
          if (response.ok) {
            const trendingData = await response.json()
            if (trendingData && trendingData.posts && Array.isArray(trendingData.posts)) {
              setTrendingPosts(trendingData.posts)
            }
          }
        } catch (error) {
          console.error('Sidebar: Error fetching trending posts:', error)
          setTrendingPosts([])
        } finally {
          setIsTrendingLoading(false)
        }
      }

      // 3. Load contributors after another delay
      const fetchContributors = async () => {
        setIsContributorsLoading(true)
        try {
          const response = await fetchWithRetry('/api/contributors/top')
          if (response.ok) {
            const contributorsData = await response.json()
            setTopContributors(contributorsData || [])
          }
        } catch (error) {
          console.error('Sidebar: Error fetching contributors:', error)
          setTopContributors([])
        } finally {
          setIsContributorsLoading(false)
        }
      }

      // Execute with optimized parallel loading for faster performance
      await fetchCategories()
      
      // Load trending posts and contributors in parallel without delays
      Promise.all([
        fetchTrending(),
        fetchContributors()
      ])
    }

    loadSidebarData()
  }, [categoriesKey, trendingKey, hasLoadedInitialData]) // Re-fetch when keys change

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 smooth-transition hover-lift animate-fade-in-up animate-delay-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <TrendingUp className={cn("w-4 h-4 text-orange-600 dark:text-orange-400", isLoading && "animate-pulse")} />
              </div>
              <span className="text-gray-900 dark:text-gray-100">Categories</span>
            </div>
            <div className="flex items-center space-x-2">
              {isLoading && (
                <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0 px-2">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between animate-pulse p-3 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-10" />
              </div>
            ))
          ) : categories.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 italic animate-fade-in">
              No categories available. Create categories in the admin dashboard to get started.
            </div>
          ) : (
            // Display categories with "Other" always at the bottom
            (() => {
              // Sort categories: alphabetically, but "Other" always last
              const sortedCategories = [...categories].sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                
                // "Other" always goes to the bottom
                if (aName === 'other') return 1;
                if (bName === 'other') return -1;
                
                // All other categories sorted alphabetically
                return a.name.localeCompare(b.name);
              });
              
              return sortedCategories.map((category, index) => {
                // Get category styles using database colors
                const categoryStyles = getCategoryStyles(category.color);
                
                return (
                  <div
                    key={category.id}
                    className="group flex items-center rounded-lg py-2 px-3 transition-all duration-200 cursor-pointer smooth-transition hover-lift animate-slide-in-up max-w-[280px] mx-auto border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      backgroundColor: categoryStyles.lightBackground
                    }}
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-base font-semibold text-gray-700 dark:text-gray-300">{category.name}</span>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </CardContent>
      </Card>

      {/* Trending Posts */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-900/10 smooth-transition hover-lift animate-fade-in-up animate-delay-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Award className={cn("w-4 h-4 text-orange-600 dark:text-orange-400", isTrendingLoading && "animate-pulse")} />
              </div>
              <span className="text-gray-900 dark:text-gray-100">Trending Posts</span>
            </div>
            <div className="flex items-center space-x-2">
              {isTrendingLoading && (
                <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
              )}
            </div>
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
          ) : trendingPosts.length === 0 && !isTrendingLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 italic animate-fade-in">
              No trending posts available right now.
            </div>
          ) : (
            trendingPosts.map((post, index) => (
              <div 
                key={post.id} 
                className="group p-3 rounded-lg bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/60 transition-all duration-200 cursor-pointer hover:shadow-sm border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800 animate-slide-in-up hover-lift smooth-transition"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Post Title */}
                <h4 className="text-sm font-medium line-clamp-3 text-gray-900 dark:text-gray-100 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors mb-3 leading-relaxed">
                  {post.title}
                </h4>
                
                {/* Author and Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span>by</span>
                    <span className="font-medium text-gray-600 dark:text-gray-300">{post.author.name}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    {/* Upvotes */}
                    <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-medium">{post.stats.upvotes}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-900/10 smooth-transition hover-lift animate-fade-in-up animate-delay-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-gray-900 dark:text-gray-100">Top Contributors</span>
            </div>
            <div className="flex items-center space-x-2">
              {isContributorsLoading && (
                <div className="w-4 h-4 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {isContributorsLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="group flex items-center space-x-3 p-3 rounded-xl bg-white/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                </div>
                <div className="text-right">
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                  <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : topContributors.length === 0 && !isContributorsLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 italic animate-fade-in">
              No contributors available right now.
            </div>
          ) : (
            topContributors.map((contributor, index) => (
              <div 
                key={contributor.id} 
                className="group flex items-center space-x-3 p-3 rounded-xl bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/60 transition-all duration-200 cursor-pointer hover:shadow-sm border border-gray-100 dark:border-gray-800 hover:border-green-200 dark:hover:border-green-800 animate-slide-in-up hover-lift smooth-transition"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-800 group-hover:ring-green-200 dark:group-hover:ring-green-800 transition-all">
                    <AvatarImage src={contributor.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold">
                      {contributor.name ? contributor.name[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                  )}
                  {contributor.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                    {contributor.name || 'Anonymous'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                    {contributor.totalContributions}
                  </Badge>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {contributor.totalPosts} posts · {contributor.totalComments} comments
                  </p>
                  {contributor.totalUpvotes > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ↑ {contributor.totalUpvotes} upvotes
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(Sidebar)
