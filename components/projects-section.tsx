"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink, MapPin, Users } from "lucide-react"
import { 
  getPostsByCategory,
  getAllCategories,
  getFeaturedImageUrl, 
  getFeaturedImageAlt, 
  stripHtml, 
  formatDate, 
  getPostExcerpt,
  type WordPressPost,
  type WordPressCategory
} from "@/lib/wordpress-api"

interface ProjectsSectionProps {
  initialProjects?: WordPressPost[]
  initialCategories?: WordPressCategory[]
}

export default function ProjectsSection({ initialProjects = [], initialCategories = [] }: ProjectsSectionProps) {
  const [projects, setProjects] = useState<WordPressPost[]>(initialProjects)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch projects on client side if no initial data
  useEffect(() => {
    if (initialProjects.length === 0 && initialCategories.length === 0) {
      fetchProjectsData()
    }
  }, [initialProjects.length, initialCategories.length])

  const fetchProjectsData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // First fetch categories to find the projects category ID
      const fetchedCategories = await getAllCategories()
      
      // Find the projects category
      const projectsCategoryId = fetchedCategories.find((cat) => cat.slug === "projects")?.id || 0
      
      if (projectsCategoryId > 0) {
        // Fetch project posts
        const fetchedProjects = await getPostsByCategory(projectsCategoryId, 1, 8)
        setProjects(fetchedProjects)
      } else {
        setError('Projects category not found')
      }
    } catch (err) {
      setError('Failed to load projects')
      console.error('Error fetching projects:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Projects</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[4/3] rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || projects.length === 0) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Projects</h2>
          <p className="text-muted-foreground mb-8">
            {error || "No projects available at the moment."}
          </p>
          <Button onClick={fetchProjectsData} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured Projects
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our latest architectural projects showcasing innovative design, sustainable practices, and cutting-edge solutions.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>

        {/* View All Projects Link */}
        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/projects">
              View All Projects
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function ProjectCard({ project, index }: { project: WordPressPost; index: number }) {
  const imageUrl = getFeaturedImageUrl(project, 'large')
  const imageAlt = getFeaturedImageAlt(project)
  const title = stripHtml(project.title.rendered)
  const excerpt = getPostExcerpt(project, 100)
  const formattedDate = formatDate(project.date)

  return (
    <Card 
      className="group overflow-hidden hover:shadow-xl transition-all duration-500 ease-in-out hover:-translate-y-2 border-0 bg-white"
      style={{
        animationDelay: `${index * 100}ms`,
        animation: `fadeInUp 0.6s ease-out forwards ${index * 100}ms`,
        opacity: 0,
        transform: 'translateY(30px)'
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover transition-all duration-700 ease-in-out group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        
        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Project Type Badge */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-primary/90 text-white hover:bg-primary border-0">
            Project
          </Badge>
        </div>

        {/* Hover Content */}
        <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
          <div className="flex items-center text-sm mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            {formattedDate}
          </div>
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2" />
            Architecture Project
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
          {excerpt}
        </p>
        
        {/* Project Stats */}
        <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            Team Project
          </div>
          <div className="text-primary font-medium">
            Read More →
          </div>
        </div>

        <Button 
          asChild 
          variant="ghost" 
          size="sm" 
          className="w-full p-0 h-auto justify-start text-primary hover:text-primary/80 hover:bg-primary/5"
        >
          <a 
            href={project.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center w-full py-2"
          >
            View Project Details
            <ExternalLink className="ml-auto h-4 w-4" />
          </a>
        </Button>
      </CardContent>

      <style jsx>{`
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  )
}