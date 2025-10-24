import { Suspense } from "react"
import { Metadata } from "next"
import RefurbishmentProjectsClient from "./refurbishment-projects-client"
import { 
  getAllCategories, 
  getRefurbishmentProjects,
  type WordPressCategory, 
  type WordPressPost 
} from '@/lib/wordpress-api'

export const metadata: Metadata = {
  title: "Refurbishment Projects | Renovation & Restoration",
  description: "Explore our portfolio of refurbishment and renovation projects that breathe new life into existing structures through adaptive reuse and modern restoration techniques.",
  keywords: ["refurbishment", "renovation", "restoration", "adaptive reuse", "building renovation", "retrofit", "remodel", "modernization"],
}

export default async function RefurbishmentProjectsPage() {
  // Try to fetch refurbishment projects from WordPress
  let initialProjects: WordPressPost[] = []
  let initialCategories: WordPressCategory[] = []
  
  try {
    // Use the new enhanced refurbishment projects fetcher
    initialProjects = await getRefurbishmentProjects(1, 20)
    
    // Get all categories for filtering
    initialCategories = await getAllCategories()
    
    console.log(`Fetched ${initialProjects.length} refurbishment projects from WordPress`)
  } catch (error) {
    console.error('Error fetching refurbishment projects:', error)
    // Will use fallback data in client component
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <RefurbishmentProjectsClient 
          initialProjects={initialProjects}
          initialCategories={initialCategories}
        />
      </Suspense>
    </div>
  )
}
