import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, User, BookOpen } from "lucide-react"
import { HorizontalAd } from "@/components/ad-banner"

const articles = [
  {
    title: "The Psychology of Space: How Architecture Affects Human Behavior",
    description: "An in-depth exploration of how architectural design influences mood, productivity, and social interaction in different environments.",
    author: "Dr. Sarah Mitchell",
    readTime: "15 min read",
    category: "Psychology",
    featured: true,
    level: "Advanced"
  },
  {
    title: "Sustainable Materials: Beyond Traditional Green Building",
    description: "Investigating innovative eco-friendly materials that are revolutionizing sustainable construction practices worldwide.",
    author: "Michael Chen",
    readTime: "12 min read",
    category: "Sustainability",
    featured: true,
    level: "Intermediate"
  },
  {
    title: "Digital Twin Technology in Construction Management",
    description: "How digital twin technology is transforming project management, maintenance, and lifecycle planning in architecture.",
    author: "Prof. Elena Rodriguez",
    readTime: "18 min read",
    category: "Technology",
    featured: false,
    level: "Advanced"
  },
  {
    title: "Biophilic Design: Bringing Nature Indoors",
    description: "Practical strategies for incorporating natural elements into interior and exterior architectural design.",
    author: "James Park",
    readTime: "10 min read",
    category: "Design",
    featured: false,
    level: "Beginner"
  },
  {
    title: "Adaptive Reuse: Transforming Old Buildings for Modern Needs",
    description: "Case studies and best practices for converting historical structures into contemporary functional spaces.",
    author: "Anna Thompson",
    readTime: "14 min read",
    category: "Heritage",
    featured: false,
    level: "Intermediate"
  },
  {
    title: "Climate-Responsive Architecture in Tropical Regions",
    description: "Design strategies and techniques for creating comfortable, energy-efficient buildings in hot and humid climates.",
    author: "Dr. Raj Patel",
    readTime: "16 min read",
    category: "Climate",
    featured: false,
    level: "Advanced"
  }
]

const categories = ["All", "Psychology", "Sustainability", "Technology", "Design", "Heritage", "Climate"]
const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"]

export default function ArticlesPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl font-bold tracking-tight">
              Architecture Articles
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover in-depth articles, research papers, and expert insights on various aspects 
            of architecture, design theory, and construction technology.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-12">
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button 
                  key={category} 
                  variant={category === "All" ? "default" : "outline"} 
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3">Difficulty Level</h3>
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => (
                <Button 
                  key={level} 
                  variant={level === "All Levels" ? "default" : "outline"} 
                  size="sm"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Articles */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {articles.filter(article => article.featured).map((article, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-2">
                      <Badge variant="secondary">{article.category}</Badge>
                      <Badge variant="outline">{article.level}</Badge>
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {article.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {article.author}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {article.readTime}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Read Article <BookOpen className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Advertisement between featured and recent articles */}
        <div className="my-12">
          <HorizontalAd className="mx-auto animate-fade-in" />
        </div>

        {/* Recent Articles */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.filter(article => !article.featured).map((article, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{article.category}</Badge>
                    <Badge variant="secondary" className="text-xs">{article.level}</Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription>
                    {article.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {article.author}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {article.readTime}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Read Article <BookOpen className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Submit Article CTA */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Share Your Knowledge</CardTitle>
              <CardDescription className="text-lg">
                Have insights to share with the architecture community? Submit your article and contribute to professional knowledge.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/academic/submit">
                    Submit Article
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/forum">
                    Join Discussion
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advertisement after content */}
        <div className="mt-12">
          <HorizontalAd className="mx-auto animate-fade-in" />
        </div>
      </div>
    </div>
  )
}