"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import AdBannerComponent from "@/components/ad-banner"
import { 
  getPostsByCategory,
  getAllCategories,
  getFeaturedImageUrl, 
  cleanText,
  formatDate,
  getPostCategoryExcludingProjects,
  decodeHtmlEntities,
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
      <div className="mb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-1/3 h-48 bg-gray-200 rounded"></div>
                <div className="w-2/3 space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || projects.length === 0) {
    return null
  }

  // Split projects into two groups of 4 (or less if fewer posts)
  const firstGroup = projects.slice(0, 4)
  const secondGroup = projects.slice(4, 8)

  return (
    <div className="mb-8">
      <div className="flex items-center mb-6 pb-2">
        <h2 className="text-2xl font-bold mr-4 whitespace-nowrap">Projects</h2>
        <div className="flex-1 border-b-[5px] border-black"></div>
      </div>

      {/* First group of projects */}
      <div className="space-y-6 mb-8">
        {firstGroup.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Advertisement slot between first 4 and next 4 posts */}
      {secondGroup.length > 0 && (
        <div className="my-8">
          <AdBannerComponent 
            size="680x180" 
            className="w-full rounded-lg overflow-hidden" 
            positionId="projects-middle-horizontal"
            autoRotate={true}
            rotationInterval={45}
            showLabel={false}
          />
        </div>
      )}

      {/* Second group of projects */}
      {secondGroup.length > 0 && (
        <div className="space-y-6">
          {secondGroup.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project }: { project: WordPressPost }) {
  const imageUrl = getFeaturedImageUrl(project, 'large')
  const title = cleanText(project.title.rendered)
  const excerpt = cleanText(project.excerpt.rendered)
  const date = formatDate(project.date)
  const category = getPostCategoryExcludingProjects(project)

  return (
    <div className="flex flex-col md:flex-row gap-4 border-b border-gray-200 pb-6">
      <div className="md:w-1/3">
        <Link href={`/${project.slug}`}>
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '7/5' }}>
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
            {/* Category Badge - Top Left */}
            <div className="absolute top-0 left-0 p-2">
              <span className="inline-block px-2 py-1 text-white text-[10px] font-semibold uppercase tracking-wide shadow-md" style={{ backgroundColor: '#FFA000' }}>
                {decodeHtmlEntities(category.name)}
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="md:w-2/3">
        <Link href={`/${project.slug}`} className="block group">
          <h3 className="text-xl font-semibold group-hover:[color:#FFA000]">{title}</h3>
        </Link>
        <div className="text-sm text-gray-500 mb-2">{date}</div>
        <p className="text-gray-700 mb-3 text-justify">{excerpt.substring(0, 450)}...</p>
        <Link
          href={`/${project.slug}`}
          className="inline-block uppercase tracking-wider text-[11px] mt-[15px] px-[18px] py-[6px] border border-[#e0e0e0] transition-all duration-300 whitespace-nowrap text-[#1f2026] no-underline mb-[5px] hover:border-[#FFA000] hover:text-[#FFA000]"
          style={{ letterSpacing: '0.05em' }}
        >
          Read More
        </Link>
      </div>
    </div>
  )
}