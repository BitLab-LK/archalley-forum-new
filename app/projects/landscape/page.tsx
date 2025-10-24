import { Suspense } from "react"
import { Metadata } from "next"
import LandscapeProjectsClient from "./landscape-projects-client"
import { 
  getAllCategories, 
  getLandscapeProjects,
  type WordPressCategory, 
  type WordPressPost 
} from '@/lib/wordpress-api'

export const metadata: Metadata = {
  title: "Landscape & Urbanism Projects | Urban Planning & Design",
  description: "Explore our portfolio of landscape architecture and urban planning projects that shape sustainable and vibrant public spaces, parks, and urban environments.",
  keywords: ["landscape architecture", "urbanism", "urban planning", "urban design", "landscape design", "public spaces", "parks", "gardens", "streetscape"],
}

export default async function LandscapeProjectsPage() {
  // Try to fetch landscape projects from WordPress
  let initialProjects: WordPressPost[] = []
  let initialCategories: WordPressCategory[] = []
  
  try {
    // Use the new enhanced landscape projects fetcher
    initialProjects = await getLandscapeProjects(1, 20)
    
    // Get all categories for filtering
    initialCategories = await getAllCategories()
    
    console.log(`Fetched ${initialProjects.length} landscape projects from WordPress`)
  } catch (error) {
    console.error('Error fetching landscape projects:', error)
    // Will use fallback data in client component
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <LandscapeProjectsClient 
          initialProjects={initialProjects}
          initialCategories={initialCategories}
        />
      </Suspense>
    </div>
  )
}
