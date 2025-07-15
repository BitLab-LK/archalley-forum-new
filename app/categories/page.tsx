import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Briefcase,
  Palette,
  GraduationCap,
  HardHat,
  BookOpen,
  Info,
  MoreHorizontal,
  TrendingUp,
  MessageCircle,
  Clock,
} from "lucide-react"

const categories = [
  {
    id: "business",
    name: "Business",
    description: "Discuss business strategies, entrepreneurship, and industry trends in architecture and construction.",
    icon: Briefcase,
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
    icon: Palette,
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
    icon: GraduationCap,
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
    icon: HardHat,
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
    icon: BookOpen,
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
    icon: Info,
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
    icon: MoreHorizontal,
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Forum Categories</h1>
          <p className="text-gray-600 dark:text-gray-400">Explore discussions organized by topic and interest</p>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Active discussion topics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.reduce((total, cat) => total + cat.posts, 0)}</div>
              <p className="text-xs text-muted-foreground">Across all categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Active</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Business</div>
              <p className="text-xs text-muted-foreground">245 posts this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{category.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {category.posts} posts
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">{category.description}</CardDescription>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-sm mb-2">Latest Post</h4>
                    <p className="text-sm font-medium mb-1">{category.latestPost.title}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>by {category.latestPost.author}</span>
                      <span>{category.latestPost.timeAgo}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Link href={`/category/${category.id}`}>
                      <Button variant="outline">View Category</Button>
                    </Link>
                    <Link href={`/category/${category.id}/new`}>
                      <Button>New Post</Button>
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
