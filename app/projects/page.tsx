import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Box, Home, Factory, Palette, TreePine, Landmark, Wrench, Church, HouseIcon } from "lucide-react"
import { HorizontalAd } from "@/components/ad-banner"

const projectCategories = [
  {
    title: "Commercial & Offices",
    description: "Modern commercial spaces and office complexes designed for productivity and innovation.",
    icon: Box,
    href: "/projects/commercial",
    count: 45
  },
  {
    title: "Hospitality Architecture",
    description: "Hotels, resorts, and hospitality venues that create memorable experiences.",
    icon: Home,
    href: "/projects/hospitality",
    count: 32
  },
  {
    title: "Industrial & Infrastructure",
    description: "Industrial buildings and infrastructure projects built for functionality and efficiency.",
    icon: Factory,
    href: "/projects/industrial",
    count: 28
  },
  {
    title: "Interior Design",
    description: "Interior spaces that blend aesthetics with functionality.",
    icon: Palette,
    href: "/projects/interior",
    count: 67
  },
  {
    title: "Landscape & Urbanism",
    description: "Urban planning and landscape architecture projects.",
    icon: TreePine,
    href: "/projects/landscape",
    count: 41
  },
  {
    title: "Public Architecture",
    description: "Public buildings and civic structures that serve communities.",
    icon: Landmark,
    href: "/projects/public",
    count: 23
  },
  {
    title: "Refurbishment",
    description: "Renovation and refurbishment projects bringing new life to existing structures.",
    icon: Wrench,
    href: "/projects/refurbishment",
    count: 19
  },
  {
    title: "Religious Architecture",
    description: "Sacred spaces and religious buildings designed for worship and community.",
    icon: Church,
    href: "/projects/religious",
    count: 15
  },
  {
    title: "Residential Architecture",
    description: "Homes and residential complexes designed for modern living.",
    icon: HouseIcon,
    href: "/projects/residential",
    count: 89
  }
]

export default function ProjectsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Architecture Projects
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore our comprehensive portfolio of architectural projects across various categories. 
            From residential homes to commercial complexes, discover innovative designs and 
            sustainable solutions.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">350+</CardTitle>
              <CardDescription>Total Projects</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">150+</CardTitle>
              <CardDescription>Architects</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">25+</CardTitle>
              <CardDescription>Countries</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Advertisement between stats and categories */}
        <div className="my-12">
          <HorizontalAd className="mx-auto animate-fade-in" />
        </div>

        {/* Project Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectCategories.map((category) => {
            const IconComponent = category.icon
            return (
              <Card key={category.href} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary">{category.count} projects</Badge>
                  </div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="w-full">
                    <Link href={category.href}>
                      View Projects →
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="text-2xl">Submit Your Project</CardTitle>
              <CardDescription className="text-lg">
                Have an architectural project to showcase? Join our community and share your work with professionals worldwide.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/forum">
                    Join Discussion
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/academic/submit">
                    Submit Project
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