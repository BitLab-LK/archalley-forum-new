import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { generateCategoryStyles } from "@/lib/color-utils"
import {
  TrendingUp,
  MessageCircle,
  Clock,
} from "lucide-react"

const categories = [
  {
    id: "business",
    name: "Business",
    description: "Discuss business strategies, entrepreneurship, and industry trends in architecture and construction.",
    color: "bg-blue-500",
    posts: 245,
    latestPost: {
      title: "Starting an Architecture Firm in 2024",
      author: "Sarah Chen",
      timeAgo: "2 hours ago",
    },
  },
  {
    id: "design",
    name: "Design",
    description: "Share and discuss architectural designs, concepts, and creative inspiration.",
    color: "bg-purple-500",
    posts: 189,
    latestPost: {
      title: "Sustainable Design Principles for Modern Homes",
      author: "Mike Johnson",
      timeAgo: "4 hours ago",
    },
  },
  {
    id: "career",
    name: "Career",
    description: "Career advice, job opportunities, and professional development in the industry.",
    color: "bg-green-500",
    posts: 156,
    latestPost: {
      title: "Transitioning from Traditional to Sustainable Architecture",
      author: "Anonymous",
      timeAgo: "6 hours ago",
    },
  },
  {
    id: "construction",
    name: "Construction",
    description: "Construction techniques, materials, project management, and industry innovations.",
    color: "bg-yellow-500",
    posts: 134,
    latestPost: {
      title: "3D Printing in Construction: Real-World Applications",
      author: "Alex Rivera",
      timeAgo: "8 hours ago",
    },
  },
  {
    id: "academic",
    name: "Academic",
    description: "Academic discussions, research, theories, and educational resources.",
    color: "bg-indigo-500",
    posts: 98,
    latestPost: {
      title: "Latest Research in Biophilic Design",
      author: "Dr. Emma Davis",
      timeAgo: "12 hours ago",
    },
  },
  {
    id: "informative",
    name: "Informative",
    description: "News, updates, tutorials, and informational content about the industry.",
    color: "bg-cyan-500",
    posts: 87,
    latestPost: {
      title: "New Building Codes and Regulations 2024",
      author: "David Wilson",
      timeAgo: "1 day ago",
    },
  },
  {
    id: "other",
    name: "Other",
    description: "General discussions and topics that don't fit into other categories.",
    color: "bg-gray-500",
    posts: 76,
    latestPost: {
      title: "Architecture Photography Tips",
      author: "Lisa Thompson",
      timeAgo: "2 days ago",
    },
  },
]

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Forum Categories</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Explore discussions organized by topic and interest</p>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Categories</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Active discussion topics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Posts</CardTitle>
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{categories.reduce((total, cat) => total + cat.posts, 0)}</div>
              <p className="text-xs text-muted-foreground">Across all categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Most Active</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">Business</div>
              <p className="text-xs text-muted-foreground">245 posts this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {categories.map((category) => {
            const categoryStyles = generateCategoryStyles(category.color)
            
            return (
              <Card 
                key={category.id} 
                className="hover:shadow-lg transition-shadow"
                style={{ backgroundColor: categoryStyles.lightBackground }}
              >
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div 
                        className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg"
                        style={{ backgroundColor: category.color }}
                      >
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-xl">{category.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {category.posts} posts
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div 
                    className="rounded-lg p-3 sm:p-4 mb-3 sm:mb-4"
                    style={{ backgroundColor: categoryStyles.accentBackground }}
                  >
                    <h4 className="font-medium text-xs sm:text-sm mb-2">Latest Post</h4>
                    <p className="text-xs sm:text-sm font-medium mb-1 line-clamp-2">{category.latestPost.title}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>by {category.latestPost.author}</span>
                      <span>{category.latestPost.timeAgo}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0">
                    <Link href={`/category/${category.id}`} className="flex-1 sm:flex-none">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">View Category</Button>
                    </Link>
                    <Link href={`/category/${category.id}/new`} className="flex-1 sm:flex-none">
                      <Button size="sm" className="w-full sm:w-auto">New Post</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
