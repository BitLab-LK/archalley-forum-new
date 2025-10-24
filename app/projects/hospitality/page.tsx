import { Suspense } from "react"
import { Metadata } from "next"
import HospitalityProjectsClient from "./hospitality-projects-client"
import { 
  getAllCategories, 
  getHospitalityProjects,
  type WordPressCategory, 
  type WordPressPost 
} from '@/lib/wordpress-api'

export const metadata: Metadata = {
  title: "Hospitality Architecture Projects | Hotels, Resorts & Venues",
  description: "Explore our portfolio of exceptional hospitality architecture projects including hotels, resorts, restaurants, and venues designed to create unforgettable guest experiences.",
  keywords: ["hospitality architecture", "hotel design", "resort architecture", "restaurant design", "hospitality projects", "guest experience design"],
}

export default async function HospitalityProjectsPage() {
  // Try to fetch hospitality projects from WordPress
  let initialProjects: WordPressPost[] = []
  let initialCategories: WordPressCategory[] = []
  
  try {
    // Use the new enhanced hospitality projects fetcher
    initialProjects = await getHospitalityProjects(1, 20)
    
    // Get all categories for filtering
    initialCategories = await getAllCategories()
    
    console.log(`Fetched ${initialProjects.length} hospitality projects from WordPress`)
  } catch (error) {
    console.error('Error fetching hospitality projects:', error)
    // Will use fallback data in client component
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <HospitalityProjectsClient 
          initialProjects={initialProjects}
          initialCategories={initialCategories}
        />
      </Suspense>
    </div>
  )
}
