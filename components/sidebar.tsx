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

export default function Sidebar() {
  // Fallback categories to ensure they always display
  const FALLBACK_CATEGORIES: Category[] = [
    { id: "other", name: "Other", color: "bg-gray-500", icon: "📂", slug: "other", count: 0 },
    { id: "informative", name: "Informative", color: "bg-cyan-500", icon: "ℹ️", slug: "informative", count: 0 },
    { id: "business", name: "Business", color: "bg-blue-500", icon: "💼", slug: "business", count: 0 },
    { id: "design", name: "Design", color: "bg-purple-500", icon: "🎨", slug: "design", count: 0 },
    { id: "career", name: "Career", color: "bg-green-500", icon: "👔", slug: "career", count: 0 },
    { id: "construction", name: "Construction", color: "bg-yellow-500", icon: "🏗️", slug: "construction", count: 0 },
    { id: "academic", name: "Academic", color: "bg-indigo-500", icon: "🎓", slug: "academic", count: 0 },
  ]

  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES)
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
        
        // Use API data if available, otherwise fallback to standard categories
        if (data && Array.isArray(data) && data.length > 0) {
          // Check if all required categories exist
          const categoryNames = data.map((cat: Category) => cat.name.toLowerCase());
          const requiredCategories = FALLBACK_CATEGORIES.map(cat => cat.name.toLowerCase());
          const missingCategories = requiredCategories.filter(name => !categoryNames.includes(name));
          
          if (missingCategories.length > 0) {
            console.warn('Some categories are missing from API response:', missingCategories);
            
            // Add missing categories from the fallback list
            const combinedCategories = [...data];
            
            for (const missingCategory of missingCategories) {
              const fallbackCategory = FALLBACK_CATEGORIES.find(
                cat => cat.name.toLowerCase() === missingCategory
              );
              
              if (fallbackCategory) {
                combinedCategories.push(fallbackCategory);
              }
            }
            
            setCategories(combinedCategories);
          } else {
            setCategories(data);
          }
        } else {
          console.warn('API returned empty categories, using fallback')
          setCategories(FALLBACK_CATEGORIES)
        }
        
      } catch (error) {
        console.error('Error fetching categories:', error)
        // Always fallback to standard categories when API fails
        console.warn('Using fallback categories due to API error')
        setCategories(FALLBACK_CATEGORIES)
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
        const response = await fetch('/api/contributors/top', {
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
        setTopContributors(data)
        
      } catch (error) {
        console.error('Error fetching top contributors:', error)
        setTopContributors([])
      } finally {
        setIsContributorsLoading(false)
      }
    }

    const timeoutId = setTimeout(() => {
      fetchTopContributors()
    }, 150)

    return () => clearTimeout(timeoutId)
  }, []) // Fetch once on mount

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
            {isLoading && (
              <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 px-2">
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
          ) : (
            // Display categories in a specific order - ensure all required categories are shown
            (() => {
              // Get categories to display - use fetched or fallback
              const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;
              
              // Define the desired display order
              const categoryOrder = [
                "Other", 
                "Informative", 
                "Business", 
                "Design", 
                "Career", 
                "Construction", 
                "Academic"
              ];
              
              // Sort categories by the predefined order
              const sortedCategories = [...displayCategories].sort((a, b) => {
                const aIndex = categoryOrder.findIndex(name => name.toLowerCase() === a.name.toLowerCase());
                const bIndex = categoryOrder.findIndex(name => name.toLowerCase() === b.name.toLowerCase());
                
                // If both categories are in the order list, sort by order
                if (aIndex !== -1 && bIndex !== -1) {
                  return aIndex - bIndex;
                }
                
                // If only one category is in the order list, prioritize it
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                
                // Otherwise, sort alphabetically
                return a.name.localeCompare(b.name);
              });
              
              return sortedCategories.map((category, index) => {
                // Get the appropriate colors based on the category
                const dotColor = getCategoryDotColor(category.name);
                
                return (
                  <div 
                    key={category.id} 
                    className={`group flex items-center rounded-xl py-2 px-4 transition-all duration-200 cursor-pointer smooth-transition hover-lift animate-slide-in-up ${getCategoryLightColor(category.name)}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${dotColor}`} />
                      <span className="text-sm font-medium">{category.name}</span>
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
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 italic animate-fade-in">No trending posts found.</div>
          ) : (
            trendingPosts.map((post, index) => (
              <div 
                key={post.id} 
                className="group p-4 rounded-xl bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/60 transition-all duration-200 cursor-pointer hover:shadow-sm border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800 animate-slide-in-up hover-lift smooth-transition"
                style={{ animationDelay: `${index * 100}ms` }}
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
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-900/10 smooth-transition hover-lift animate-fade-in-up animate-delay-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
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
          ) : topContributors.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 italic animate-fade-in">No contributors found.</div>
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

