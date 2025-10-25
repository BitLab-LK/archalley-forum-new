import { Suspense } from "react"
import { Metadata } from "next"
import ResidentialProjectsClient from "./residential-projects-client"
import { 
  getAllCategories, 
  getResidentialProjects,
  type WordPressCategory, 
  type WordPressPost 
} from '@/lib/wordpress-api'

export const metadata: Metadata = {
  title: "Residential Architecture Projects | Homes, Villas & Apartments",
  description: "Explore our portfolio of residential architecture projects including houses, villas, apartments, and residential buildings designed for modern living.",
  keywords: ["residential architecture", "house design", "villa design", "apartment design", "residential building", "home architecture", "housing design"],
}

export default async function ResidentialProjectsPage() {
  // Try to fetch residential architecture projects from WordPress
  let initialProjects: WordPressPost[] = []
  let initialCategories: WordPressCategory[] = []
  
  try {
    // Use the new enhanced residential projects fetcher
    initialProjects = await getResidentialProjects(1, 20)
    
    // Get all categories for filtering
    initialCategories = await getAllCategories()
    
    console.log(`Fetched ${initialProjects.length} residential architecture projects from WordPress`)
  } catch (error) {
    console.error('Error fetching residential architecture projects:', error)
    // Will use fallback data in client component
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <ResidentialProjectsClient 
          initialProjects={initialProjects}
          initialCategories={initialCategories}
        />
      </Suspense>
    </div>
  )
}
