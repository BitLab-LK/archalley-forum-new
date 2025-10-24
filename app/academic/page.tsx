import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, BookOpen, Users, Award, Upload, Search } from "lucide-react"

const academicSections = [
  {
    title: "Research",
    description: "Access cutting-edge architectural research papers, studies, and academic publications from universities worldwide.",
    icon: Search,
    href: "/academic/research",
    count: "1,200+",
    features: ["Peer-reviewed papers", "Research methodologies", "Case studies", "Academic databases"]
  },
  {
    title: "Student Projects",
    description: "Showcase and explore innovative student work from architecture schools and universities around the globe.",
    icon: Users,
    href: "/academic/student-projects",
    count: "850+",
    features: ["Final year projects", "Design portfolios", "Thesis projects", "International submissions"]
  },
  {
    title: "Submit",
    description: "Submit your research, projects, or academic work to be featured in our academic collection.",
    icon: Upload,
    href: "/academic/submit",
    count: "Submit",
    features: ["Easy submission process", "Peer review", "Academic recognition", "Global exposure"]
  }
]

const featuredResearch = [
  {
    title: "AI-Driven Sustainable Design Optimization",
    authors: "Dr. Maria Santos, Prof. John Smith",
    institution: "MIT Architecture Lab",
    year: "2025",
    category: "Sustainability",
    downloads: "2,340"
  },
  {
    title: "Cultural Sensitivity in Urban Planning",
    authors: "Dr. Aisha Patel, Dr. Chen Wei",
    institution: "Oxford Institute of Design",
    year: "2025",
    category: "Urban Planning",
    downloads: "1,890"
  },
  {
    title: "Biomimetic Structures in Modern Architecture",
    authors: "Prof. Elena Rodriguez",
    institution: "Barcelona Architecture School",
    year: "2024",
    category: "Innovation",
    downloads: "3,120"
  }
]

const featuredProjects = [
  {
    title: "Floating Community Center",
    student: "Alex Thompson",
    school: "Royal College of Art",
    year: "2025",
    category: "Community Design",
    award: "Best Concept Award"
  },
  {
    title: "Zero-Waste Housing Complex",
    student: "Priya Sharma",
    school: "Delhi School of Architecture",
    year: "2025",
    category: "Sustainable Housing",
    award: "Sustainability Excellence"
  },
  {
    title: "Adaptive Refugee Shelter System",
    student: "Marcus Johnson",
    school: "Harvard GSD",
    year: "2024",
    category: "Social Architecture",
    award: "Innovation Award"
  }
]

export default function AcademicPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl font-bold tracking-tight">
              Academic Hub
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore architectural research, student projects, and academic resources. 
            Connect with educational institutions and contribute to architectural knowledge.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">2,050+</CardTitle>
              <CardDescription>Research Papers</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">850+</CardTitle>
              <CardDescription>Student Projects</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">180+</CardTitle>
              <CardDescription>Universities</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">45+</CardTitle>
              <CardDescription>Countries</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Academic Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {academicSections.map((section) => {
            const IconComponent = section.icon
            return (
              <Card key={section.href} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary">{section.count}</Badge>
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <CardDescription className="text-base">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {section.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Button asChild className="w-full">
                      <Link href={section.href}>
                        Explore {section.title}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Featured Research */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Research</h2>
            <Button variant="outline" asChild>
              <Link href="/academic/research">
                View All Research
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredResearch.map((research, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{research.category}</Badge>
                    <span className="text-xs text-muted-foreground">{research.year}</span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {research.title}
                  </CardTitle>
                  <CardDescription>
                    By {research.authors}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {research.institution}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {research.downloads} downloads
                      </div>
                      <Button variant="ghost" size="sm">
                        Read Paper
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Student Projects */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Student Projects</h2>
            <Button variant="outline" asChild>
              <Link href="/academic/student-projects">
                View All Projects
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map((project, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{project.category}</Badge>
                    <div className="flex items-center text-xs text-primary">
                      <Award className="h-3 w-3 mr-1" />
                      {project.award}
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {project.title}
                  </CardTitle>
                  <CardDescription>
                    By {project.student}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {project.school} • {project.year}
                    </div>
                    <Button variant="ghost" size="sm" className="w-full">
                      View Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Submission CTA */}
        <div>
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Contribute to Academic Knowledge</CardTitle>
              <CardDescription className="text-lg">
                Share your research, thesis, or innovative projects with the global architecture academic community.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/academic/submit">
                    Submit Your Work
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
      </div>
    </div>
  )
}