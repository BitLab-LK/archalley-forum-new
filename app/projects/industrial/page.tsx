import { Suspense } from "react"
import { Metadata } from "next"
import IndustrialProjectsClient from "./industrial-projects-client"
import { 
  getAllCategories, 
  getIndustrialProjects,
  type WordPressCategory, 
  type WordPressPost 
} from '@/lib/wordpress-api'

export const metadata: Metadata = {
  title: "Industrial & Infrastructure Projects | Manufacturing & Facilities",
  description: "Explore our portfolio of industrial and infrastructure projects including factories, warehouses, manufacturing facilities, and logistics centers built for functionality and efficiency.",
  keywords: ["industrial architecture", "infrastructure projects", "factory design", "warehouse design", "manufacturing facilities", "industrial buildings", "logistics centers"],
}

export default async function IndustrialProjectsPage() {
  // Try to fetch industrial projects from WordPress
  let initialProjects: WordPressPost[] = []
  let initialCategories: WordPressCategory[] = []
  
  try {
    // Use the new enhanced industrial projects fetcher
    initialProjects = await getIndustrialProjects(1, 20)
    
    // Get all categories for filtering
    initialCategories = await getAllCategories()
    
    console.log(`Fetched ${initialProjects.length} industrial projects from WordPress`)
  } catch (error) {
    console.error('Error fetching industrial projects:', error)
    // Will use fallback data in client component
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <IndustrialProjectsClient 
          initialProjects={initialProjects}
          initialCategories={initialCategories}
        />
      </Suspense>
    </div>
  )
}
