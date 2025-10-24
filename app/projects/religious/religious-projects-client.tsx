"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { 
  Search, 
  Grid3X3, 
  List, 
  ExternalLink, 
  Calendar,
  Church,

} from "lucide-react"
import { 
  getReligiousProjects,
  searchPosts,
  getFeaturedImageUrl, 
  getFeaturedImageAlt, 
  getPostExcerpt, 
  formatDate, 
  stripHtml,
  type WordPressPost,
  type WordPressCategory
} from "@/lib/wordpress-api"
import AdBannerComponent from "@/components/ad-banner"
import SidebarYouTube from "@/components/sidebar-youtube"
import SidebarFacebook from "@/components/sidebar-facebook"

interface ReligiousProjectsClientProps {
  initialProjects?: WordPressPost[]
  initialCategories?: WordPressCategory[]
}

export default function ReligiousProjectsClient({ 
  initialProjects = [], 
  initialCategories = [] 
}: ReligiousProjectsClientProps) {
  const [projects, setProjects] = useState<WordPressPost[]>(initialProjects)
  const [categories] = useState<WordPressCategory[]>(initialCategories)
  const [filteredProjects, setFilteredProjects] = useState<WordPressPost[]>(initialProjects)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<WordPressPost | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter projects based on search term and category
  useEffect(() => {
    let filtered = projects

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.rendered.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stripHtml(project.excerpt.rendered).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(project =>
        project.categories.includes(parseInt(selectedCategory))
      )
    }

    setFilteredProjects(filtered)
  }, [searchTerm, selectedCategory, projects])

  // Fallback projects data when WordPress is not available (only show if no real data)
  const fallbackProjects = initialProjects.length === 0 ? [
    {
      id: 1,
      title: { rendered: "Religious Architecture Projects Coming Soon" },
      excerpt: { rendered: "We're currently updating our religious architecture portfolio. Please check back soon for our latest work." },
      content: { rendered: "Our religious architecture and sacred spaces projects showcase will be available soon with detailed case studies and project galleries." },
      featured_media: 1,
      date: "2024-10-20T00:00:00",
      link: "#",
      slug: "coming-soon",
      categories: [1],
      _embedded: {
        'wp:featuredmedia': [{
          id: 1,
          source_url: "/placeholder.svg?height=300&width=400&text=Coming+Soon",
          alt_text: "Projects Coming Soon",
          media_details: { width: 400, height: 300, sizes: {} }
        }]
      }
    }
  ] : []

  // Load more projects function
  const loadMoreProjects = async () => {
    setIsLoading(true)
    try {
      const newPage = currentPage + 1
      const newProjects = await getReligiousProjects(newPage, 20)
      
      if (newProjects.length > 0) {
        // Filter out any duplicates
        const uniqueNewProjects = newProjects.filter(newProject => 
          !projects.some(existingProject => existingProject.id === newProject.id)
        )
        
        if (uniqueNewProjects.length > 0) {
          setProjects(prev => [...prev, ...uniqueNewProjects])
          setCurrentPage(newPage)
        }
      }
    } catch (error) {
      console.error('Error loading more projects:', error)
      // Don't show error to user, just stop loading
    } finally {
      setIsLoading(false)
    }
  }

  // Search projects function
  const searchProjects = async (term: string) => {
    if (!term.trim()) return
    
    setIsLoading(true)
    try {
      const searchResults = await searchPosts(term, 1, 20)
      setProjects(searchResults)
      setCurrentPage(1)
    } catch (error) {
      console.error('Error searching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Use fallback data only if no initial projects were loaded from WordPress
  const hasRealData = initialProjects.length > 0
  const displayProjects = hasRealData ? filteredProjects : fallbackProjects
  const displayCategories = categories.length > 0 ? categories : [
    { id: 1, name: "Religious Architecture", slug: "religious", description: "Religious architecture projects", count: 1 }
  ]

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Religious Architecture
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Discover our portfolio of sacred spaces and religious buildings designed 
            to inspire worship, foster community, and create meaningful spiritual experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters and Search */}
            <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-8">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchProjects(searchTerm)
                  }
                }}
                className="pl-10 pr-20"
              />
              {searchTerm && (
                <Button
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  onClick={() => searchProjects(searchTerm)}
                >
                  Search
                </Button>
              )}
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {displayCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Projects Grid/List */}
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
            : "space-y-6"
        }>
          {displayProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              viewMode={viewMode}
              onReadMore={setSelectedProject}
            />
          ))}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        )}

        {/* Load More Button - Only show for real WordPress data */}
        {!isLoading && hasRealData && filteredProjects.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" onClick={loadMoreProjects}>
              Load More Projects
            </Button>
          </div>
        )}

        {/* No Results */}
        {displayProjects.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm ? 'No projects found' : 'No projects available'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : 'Religious architecture projects will be displayed here once they are available.'
              }
            </p>
          </div>
        )}
        
        {/* Search No Results */}
        {filteredProjects.length === 0 && searchTerm && hasRealData && !isLoading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No projects found for "{searchTerm}"
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or clear filters to see all projects
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              {/* Square Ad in Sidebar */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-1">
                <AdBannerComponent 
                  size="320x320" 
                  className="w-full" 
                  positionId="sidebar-square-religious"
                  autoRotate={true}
                  rotationInterval={30}
                  showLabel={false}
                />
              </div>

              {/* YouTube Section */}
              <SidebarYouTube />

              {/* Facebook Section */}
              <SidebarFacebook />
            </div>
          </div>
        </div>

        {/* Project Detail Modal */}
        {selectedProject && (
          <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl mb-4">
                  {selectedProject.title.rendered}
                </DialogTitle>
              </DialogHeader>
            <div className="space-y-6">
              <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
                <Image
                  src={getFeaturedImageUrl(selectedProject, 'large')}
                  alt={getFeaturedImageAlt(selectedProject)}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedProject.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Church className="w-4 h-4" />
                  <span>Religious Architecture</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <Link 
                    href={selectedProject.link} 
                    target="_blank"
                    className="hover:text-primary transition-colors"
                  >
                    View Original
                  </Link>
                </div>
              </div>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: selectedProject.content.rendered 
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>
    </div>
  )
}

// Project Card Component
function ProjectCard({ 
  project, 
  viewMode, 
  onReadMore 
}: { 
  project: WordPressPost; 
  viewMode: "grid" | "list"; 
  onReadMore: (project: WordPressPost) => void;
}) {
  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row">
          <div className="relative h-48 md:h-32 md:w-48 flex-shrink-0">
            <Image
              src={getFeaturedImageUrl(project, 'medium')}
              alt={getFeaturedImageAlt(project)}
              fill
              className="object-cover"
            />
          </div>
          <CardContent className="flex-1 p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold mb-2 line-clamp-1">
                {project.title.rendered}
              </h3>
              <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                {formatDate(project.date)}
              </span>
            </div>
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {getPostExcerpt(project, 150)}
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onReadMore(project)}
            >
              Read More
            </Button>
          </CardContent>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={getFeaturedImageUrl(project, 'medium')}
          alt={getFeaturedImageAlt(project)}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      </div>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2 flex-1">
            {project.title.rendered}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {getPostExcerpt(project, 120)}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {formatDate(project.date)}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onReadMore(project)}
          >
            View Project
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
