import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, Users, Award } from "lucide-react"

const categories = [
  { name: "Business", count: 245, color: "bg-blue-500" },
  { name: "Design", count: 189, color: "bg-purple-500" },
  { name: "Career", count: 156, color: "bg-green-500" },
  { name: "Construction", count: 134, color: "bg-yellow-500" },
  { name: "Academic", count: 98, color: "bg-indigo-500" },
  { name: "Informative", count: 87, color: "bg-cyan-500" },
  { name: "Other", count: 76, color: "bg-gray-500" },
]

const featuredPosts = [
  { title: "Sustainable Architecture Trends 2024", author: "Sarah Chen", upvotes: 45 },
  { title: "Modern Office Design Principles", author: "Mike Johnson", upvotes: 38 },
  { title: "Construction Technology Innovations", author: "Alex Rivera", upvotes: 32 },
]

const topContributors = [
  { name: "Sarah Chen", rank: "Community Expert", posts: 156, avatar: "/placeholder.svg?height=32&width=32" },
  { name: "Mike Johnson", rank: "Top Contributor", posts: 134, avatar: "/placeholder.svg?height=32&width=32" },
  { name: "Alex Rivera", rank: "Visual Storyteller", posts: 98, avatar: "/placeholder.svg?height=32&width=32" },
  { name: "Emma Davis", rank: "Valued Responder", posts: 87, avatar: "/placeholder.svg?height=32&width=32" },
]

export default function Sidebar() {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Categories</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${category.color}`} />
                <span className="text-sm font-medium">{category.name}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {category.count}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Featured Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Featured Posts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {featuredPosts.map((post, index) => (
            <div key={index} className="space-y-2">
              <h4 className="text-sm font-medium line-clamp-2">{post.title}</h4>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>by {post.author}</span>
                <span>{post.upvotes} upvotes</span>
              </div>
            </div>
          ))}
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
          {topContributors.map((contributor, index) => (
            <div key={index} className="flex items-center space-x-3">
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
