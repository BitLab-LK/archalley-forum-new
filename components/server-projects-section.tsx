import { getAllCategories, getPostsByCategory, type WordPressPost } from "@/lib/wordpress-api"
import ProjectsSection from "@/components/projects-section"

export default async function ServerProjectsSection() {
  try {
    // Fetch categories to find the projects category ID
    const categories = await getAllCategories()
    const projectsCategoryId = categories.find((cat) => cat.slug === "projects")?.id || 0
    
    let projects: WordPressPost[] = []
    if (projectsCategoryId > 0) {
      // Fetch project posts
      projects = await getPostsByCategory(projectsCategoryId, 1, 8)
    }
    
    return <ProjectsSection initialProjects={projects} initialCategories={categories} />
  } catch (error) {
    console.error('Failed to fetch projects on server:', error)
    // Fall back to client-side fetching
    return <ProjectsSection />
  }
}