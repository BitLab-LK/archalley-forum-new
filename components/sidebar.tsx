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
  name: string
  rank: string
  posts: number
  avatar: string
}

const topContributors: TopContributor[] = [
  { name: "Sarah Chen", rank: "Community Expert", posts: 156, avatar: "/placeholder.svg?height=32&width=32" },
  { name: "Mike Johnson", rank: "Top Contributor", posts: 134, avatar: "/placeholder.svg?height=32&width=32" },
  { name: "Alex Rivera", rank: "Visual Storyteller", posts: 98, avatar: "/placeholder.svg?height=32&width=32" },
  { name: "Emma Davis", rank: "Valued Responder", posts: 87, avatar: "/placeholder.svg?height=32&width=32" },
]

export default function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([])
  const [isTrendingLoading, setIsTrendingLoading] = useState(true)
  
  // Use sidebar context for real-time updates
  const { categoriesKey, trendingKey } = useSidebar()

  // Fetch categories - now responds to categoriesKey changes
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      try {
        console.log('📊 Fetching categories (refresh key:', categoriesKey, ')')
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
        console.log('✅ Categories loaded:', data.length, 'categories')
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
        console.log('🔥 Fetching trending posts (refresh key:', trendingKey, ')')
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
        console.log('✅ Trending posts loaded:', data.posts?.length || 0, 'posts')
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

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className={cn("w-4 h-4 text-blue-600 dark:text-blue-400", isLoading && "animate-pulse")} />
              </div>
              <span className="text-gray-900 dark:text-gray-100">Categories</span>
            </div>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
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
            categories.map((category) => {
              // Generate colorful badge styles based on category color
              const getBadgeStyle = (colorClass: string) => {
                // Map specific colors to their badge styles
                switch (colorClass) {
                  case 'bg-blue-500':
                    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50'
                  case 'bg-purple-500':
                    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50'
                  case 'bg-green-500':
                    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 group-hover:bg-green-200 dark:group-hover:bg-green-900/50'
                  case 'bg-yellow-500':
                    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50'
                  case 'bg-indigo-500':
                    return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50'
                  case 'bg-cyan-500':
                    return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50'
                  case 'bg-gray-500':
                    return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-900/50'
                  case 'bg-red-500':
                    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 group-hover:bg-red-200 dark:group-hover:bg-red-900/50'
                  case 'bg-orange-500':
                    return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50'
                  case 'bg-pink-500':
                    return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800 group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50'
                  case 'bg-teal-500':
                    return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50'
                  case 'bg-emerald-500':
                    return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50'
                  case 'bg-violet-500':
                    return 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50'
                  case 'bg-rose-500':
                    return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 group-hover:bg-rose-200 dark:group-hover:bg-rose-900/50'
                  case 'bg-lime-500':
                    return 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800 group-hover:bg-lime-200 dark:group-hover:bg-lime-900/50'
                  case 'bg-amber-500':
                    return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50'
                  case 'bg-sky-500':
                    return 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 group-hover:bg-sky-200 dark:group-hover:bg-sky-900/50'
                  case 'bg-slate-500':
                    return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-900/50'
                  default:
                    return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-900/50'
                }
              }

              return (
                <div key={category.id} className="group flex items-center justify-between hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-xl p-3 transition-all duration-200 cursor-pointer hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${category.color} ring-2 ring-white dark:ring-gray-800 group-hover:scale-110 transition-transform`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">{category.name}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs font-semibold border transition-all duration-200 ${getBadgeStyle(category.color)}`}>
                    {category.count || 0}
                  </Badge>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Trending Posts */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-900/10">
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
            trendingPosts.map((post) => (
              <div key={post.id} className="group p-4 rounded-xl bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/60 transition-all duration-200 cursor-pointer hover:shadow-sm border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800">
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
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg font-semibold">
            <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-gray-900 dark:text-gray-100">Top Contributors</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {topContributors.map((contributor, index) => (
            <div key={contributor.name} className="group flex items-center space-x-3 p-3 rounded-xl bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/60 transition-all duration-200 cursor-pointer hover:shadow-sm border border-gray-100 dark:border-gray-800 hover:border-green-200 dark:hover:border-green-800">
              <div className="relative">
                <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-800 group-hover:ring-green-200 dark:group-hover:ring-green-800 transition-all">
                  <AvatarImage src={contributor.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold">{contributor.name[0]}</AvatarFallback>
                </Avatar>
                {index < 3 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">{contributor.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{contributor.rank}</p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                  {contributor.posts}
                </Badge>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">posts</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
