import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ExternalLink, Newspaper } from "lucide-react"

const newsItems = [
  {
    title: "Revolutionary Sustainable Architecture Awards 2025",
    description: "Celebrating the most innovative sustainable building designs of the year. Winners showcase cutting-edge green technology and eco-friendly materials.",
    category: "Awards",
    date: "October 12, 2025",
    readTime: "5 min read",
    featured: true
  },
  {
    title: "New Building Regulations for Climate Resilience",
    description: "Government announces updated building codes focusing on climate adaptation and energy efficiency standards for new construction projects.",
    category: "Regulations",
    date: "October 10, 2025",
    readTime: "8 min read",
    featured: false
  },
  {
    title: "AI in Architecture: The Future is Now",
    description: "How artificial intelligence is transforming architectural design, from automated planning to smart building systems.",
    category: "Technology",
    date: "October 8, 2025",
    readTime: "6 min read",
    featured: true
  },
  {
    title: "World Architecture Festival 2025 Highlights",
    description: "Key takeaways from this year's festival including emerging trends, innovative materials, and groundbreaking projects.",
    category: "Events",
    date: "October 5, 2025",
    readTime: "12 min read",
    featured: false
  },
  {
    title: "Affordable Housing Solutions: Global Innovations",
    description: "Exploring creative approaches to affordable housing challenges across different continents and cultures.",
    category: "Housing",
    date: "October 3, 2025",
    readTime: "10 min read",
    featured: false
  },
  {
    title: "Biomimetic Architecture: Learning from Nature",
    description: "How architects are drawing inspiration from natural forms and processes to create more efficient and beautiful buildings.",
    category: "Design",
    date: "October 1, 2025",
    readTime: "7 min read",
    featured: false
  }
]

const categories = ["All", "Awards", "Regulations", "Technology", "Events", "Housing", "Design"]

export default function NewsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Newspaper className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl font-bold tracking-tight">
              Architecture News
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay updated with the latest developments in architecture, design trends, 
            industry regulations, and innovative projects from around the world.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
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

        {/* Featured News */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Stories</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {newsItems.filter(item => item.featured).map((item, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{item.category}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {item.date}
                    </div>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.readTime}</span>
                    <Button variant="ghost" size="sm">
                      Read More <ExternalLink className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent News */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsItems.filter(item => !item.featured).map((item, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{item.category}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {item.date}
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription>
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.readTime}</span>
                    <Button variant="ghost" size="sm">
                      Read More <ExternalLink className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Stay Informed</CardTitle>
              <CardDescription className="text-lg">
                Subscribe to our newsletter for weekly updates on architecture news, trends, and industry insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Button asChild>
                  <Link href="/forum">
                    Join Community
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/auth/register">
                    Subscribe
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}