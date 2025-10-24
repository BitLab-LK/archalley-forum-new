import { Suspense } from "react"
import CommercialProjectsClient from "./commercial-projects-client"
import { 
  getAllCategories, 
  getCommercialProjects,
  type WordPressCategory, 
  type WordPressPost 
} from '@/lib/wordpress-api'

export default async function CommercialProjectsPage() {
  // Try to fetch commercial projects from WordPress
  let initialProjects: WordPressPost[] = []
  let initialCategories: WordPressCategory[] = []
  
  try {
    // Use the new enhanced commercial projects fetcher
    initialProjects = await getCommercialProjects(1, 20)
    
    // Get all categories for filtering
    initialCategories = await getAllCategories()
    
    console.log(`Fetched ${initialProjects.length} commercial projects from WordPress`)
  } catch (error) {
    console.error('Error fetching commercial projects:', error)
    // Will use fallback data in client component
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <CommercialProjectsClient 
          initialProjects={initialProjects}
          initialCategories={initialCategories}
        />
      </Suspense>
    </div>
  )
}