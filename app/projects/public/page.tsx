import { Suspense } from "react"
import { Metadata } from "next"
import PublicProjectsClient from "./public-projects-client"
import { 
  getAllCategories, 
  getPublicProjects,
  type WordPressCategory, 
  type WordPressPost 
} from '@/lib/wordpress-api'

export const metadata: Metadata = {
  title: "Public Architecture Projects | Civic & Government Buildings",
  description: "Explore our portfolio of public architecture projects including libraries, museums, civic centers, and government buildings that serve and inspire communities.",
  keywords: ["public architecture", "civic buildings", "government buildings", "municipal architecture", "libraries", "museums", "community centers", "cultural centers"],
}

export default async function PublicProjectsPage() {
  // Try to fetch public architecture projects from WordPress
  let initialProjects: WordPressPost[] = []
  let initialCategories: WordPressCategory[] = []
  
  try {
    // Use the new enhanced public projects fetcher
    initialProjects = await getPublicProjects(1, 20)
    
    // Get all categories for filtering
    initialCategories = await getAllCategories()
    
    console.log(`Fetched ${initialProjects.length} public architecture projects from WordPress`)
  } catch (error) {
    console.error('Error fetching public architecture projects:', error)
    // Will use fallback data in client component
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <PublicProjectsClient 
          initialProjects={initialProjects}
          initialCategories={initialCategories}
        />
      </Suspense>
    </div>
  )
}
