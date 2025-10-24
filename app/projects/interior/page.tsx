import { Suspense } from "react"
import { Metadata } from "next"
import InteriorProjectsClient from "./interior-projects-client"
import { 
  getAllCategories, 
  getInteriorProjects,
  type WordPressCategory, 
  type WordPressPost 
} from '@/lib/wordpress-api'

export const metadata: Metadata = {
  title: "Interior Design Projects | Residential & Commercial Interiors",
  description: "Explore our portfolio of exceptional interior design projects that blend aesthetics with functionality. Discover innovative residential and commercial interior spaces.",
  keywords: ["interior design", "interior architecture", "residential interiors", "commercial interiors", "interior spaces", "furniture design", "spatial design"],
}

export default async function InteriorProjectsPage() {
  // Try to fetch interior design projects from WordPress
  let initialProjects: WordPressPost[] = []
  let initialCategories: WordPressCategory[] = []
  
  try {
    // Use the new enhanced interior projects fetcher
    initialProjects = await getInteriorProjects(1, 20)
    
    // Get all categories for filtering
    initialCategories = await getAllCategories()
    
    console.log(`Fetched ${initialProjects.length} interior design projects from WordPress`)
  } catch (error) {
    console.error('Error fetching interior design projects:', error)
    // Will use fallback data in client component
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <InteriorProjectsClient 
          initialProjects={initialProjects}
          initialCategories={initialCategories}
        />
      </Suspense>
    </div>
  )
}
