import { Suspense } from "react"
import { Metadata } from "next"
import ReligiousProjectsClient from "./religious-projects-client"
import { 
  getAllCategories, 
  getReligiousProjects,
  type WordPressCategory, 
  type WordPressPost 
} from '@/lib/wordpress-api'

export const metadata: Metadata = {
  title: "Religious Architecture Projects | Sacred Spaces & Places of Worship",
  description: "Explore our portfolio of religious architecture projects including churches, temples, mosques, and sacred spaces designed for worship, contemplation, and community.",
  keywords: ["religious architecture", "sacred spaces", "churches", "temples", "mosques", "places of worship", "cathedral design", "chapel architecture"],
}

export default async function ReligiousProjectsPage() {
  // Try to fetch religious architecture projects from WordPress
  let initialProjects: WordPressPost[] = []
  let initialCategories: WordPressCategory[] = []
  
  try {
    // Use the new enhanced religious projects fetcher
    initialProjects = await getReligiousProjects(1, 20)
    
    // Get all categories for filtering
    initialCategories = await getAllCategories()
    
    console.log(`Fetched ${initialProjects.length} religious architecture projects from WordPress`)
  } catch (error) {
    console.error('Error fetching religious architecture projects:', error)
    // Will use fallback data in client component
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <ReligiousProjectsClient 
          initialProjects={initialProjects}
          initialCategories={initialCategories}
        />
      </Suspense>
    </div>
  )
}
