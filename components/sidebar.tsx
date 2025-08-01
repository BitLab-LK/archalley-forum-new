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
        const response = await fetch('/api/categories')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const data = await response.json()
        setCategories(data)
        console.log('✅ Categories loaded:', data.length, 'categories')
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [categoriesKey]) // Re-fetch when categoriesKey changes

  // Fetch trending posts - now responds to trendingKey changes  
  useEffect(() => {
    const fetchTrendingPosts = async () => {
      setIsTrendingLoading(true)
      try {
        console.log('🔥 Fetching trending posts (refresh key:', trendingKey, ')')
        const response = await fetch('/api/posts?limit=5&sortBy=upvotes&sortOrder=desc')
        if (!response.ok) {
          throw new Error('Failed to fetch trending posts')
        }
        const data = await response.json()
        setTrendingPosts(data.posts || [])
        console.log('✅ Trending posts loaded:', data.posts?.length || 0, 'posts')
      } catch (error) {
        console.error('Error fetching trending posts:', error)
      } finally {
        setIsTrendingLoading(false)
      }
    }
    fetchTrendingPosts()
  }, [trendingKey]) // Re-fetch when trendingKey changes

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className={cn("w-5 h-5", isLoading && "animate-pulse")} />
            <span>Categories</span>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-8" />
              </div>
            ))
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors cursor-pointer">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {category.count || 0}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Trending Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className={cn("w-5 h-5", isTrendingLoading && "animate-pulse")} />
            <span>Trending Posts</span>
            {isTrendingLoading && (
              <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTrendingLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-10" />
                </div>
              </div>
            ))
          ) : trendingPosts.length === 0 ? (
            <div className="text-sm text-gray-500">No trending posts found.</div>
          ) : (
            trendingPosts.map((post) => (
              <div key={post.id} className="space-y-2">
                <h4 className="text-sm font-medium line-clamp-2">{post.content}</h4>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>by {post.author.name}</span>
                  <span>{post.upvotes} upvotes</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Top Contributors</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topContributors.map((contributor) => (
            <div key={contributor.name} className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={contributor.avatar || "/placeholder.svg"} />
                <AvatarFallback>{contributor.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{contributor.name}</p>
                <p className="text-xs text-gray-500">{contributor.rank}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {contributor.posts}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
