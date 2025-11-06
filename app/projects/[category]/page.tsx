import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CategoryListing from '@/components/category-listing'
import { getCategoryBySlug, getAllCategories } from '@/lib/wordpress-api'

export const dynamic = 'force-dynamic'
export const revalidate = 300

interface PageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Category slug mapping - URL slug to WordPress category slug
// Maps URL segment to WordPress category slug
const CATEGORY_SLUG_MAP: Record<string, string> = {
  'commercial-offices': 'commercial-offices',
  'commercial': 'commercial-offices', // Support old slug
  'hospitality-architecture': 'hospitality-architecture',
  'hospitality': 'hospitality-architecture', // Support old slug
  'industrial-infrastructure': 'industrial-infrastructure',
  'industrial': 'industrial-infrastructure', // Support old slug
  'interior-design': 'interior-design',
  'interior': 'interior-design', // Support old slug
  'landscape-urbanism': 'landscape-urbanism',
  'landscape': 'landscape-urbanism', // Support old slug
  'public-architecture': 'public-architecture',
  'public': 'public-architecture', // Support old slug
  'refurbishment': 'refurbishment',
  'religious-architecture': 'religious-architecture',
  'religious': 'religious-architecture', // Support old slug
  'residential-architecture': 'residential-architecture',
  'residential': 'residential-architecture', // Support old slug
}

/**
 * Step 1: Map URL slug to WordPress category slug
 * Step 2: Match slug against WordPress categories
 * Returns WordPress category if found, null otherwise
 */
async function findCategoryBySlug(urlSlug: string): Promise<{ id: number; name: string; slug: string } | null> {
  // Step 1: Map URL slug to WordPress category slug
  const mappedSlug = CATEGORY_SLUG_MAP[urlSlug] || urlSlug
  
  // Step 2: Fetch all categories and match by slug
  const allCategories = await getAllCategories()
  
  // Try exact match first (mapped slug)
  let found = allCategories.find(cat => cat.slug === mappedSlug)
  if (found) {
    return found
  }
  
  // Try original URL slug
  found = allCategories.find(cat => cat.slug === urlSlug)
  if (found) {
    return found
  }
  
  // Try with underscore variations
  const mappedUnderscore = mappedSlug.replace(/-/g, '_')
  const urlUnderscore = urlSlug.replace(/-/g, '_')
  
  found = allCategories.find(cat => cat.slug === mappedUnderscore)
  if (found) {
    return found
  }
  
  found = allCategories.find(cat => cat.slug === urlUnderscore)
  if (found) {
    return found
  }
  
  return null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  
  // Step 1: Map slug
  const mappedSlug = CATEGORY_SLUG_MAP[category] || category
  
  // Step 2: Match slug - fetch category
  const wpCategory = await getCategoryBySlug(mappedSlug)
  
  if (!wpCategory) {
    // Try original slug
    const wpCategoryAlt = await getCategoryBySlug(category)
    if (!wpCategoryAlt) {
      return {
        title: 'Category Not Found | Archalley',
      }
    }
    return {
      title: `${wpCategoryAlt.name} | Archalley`,
      description: `Explore ${wpCategoryAlt.name} projects and architecture designs.`,
    }
  }
  
  return {
    title: `${wpCategory.name} | Archalley`,
    description: `Explore ${wpCategory.name} projects and architecture designs.`,
  }
}

export default async function ProjectCategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params
  const resolvedSearchParams = await searchParams
  const pageParam = typeof resolvedSearchParams?.page === 'string' 
    ? resolvedSearchParams.page 
    : Array.isArray(resolvedSearchParams?.page) 
      ? resolvedSearchParams.page[0] 
      : null
  
  // Step 1: Map URL slug to WordPress category slug
  const mappedSlug = CATEGORY_SLUG_MAP[category] || category
  
  // Step 2: Match slug - fetch category from WordPress
  const wpCategory = await findCategoryBySlug(category)
  
  // Step 3: Show all posts from that category (via CategoryListing component)
  // Step 4: Show 404 only after fetching if category not found
  if (!wpCategory) {
    // Category not found after fetching - show 404
    notFound()
  }
  
  // Use the URL slug for basePath to maintain URL structure
  const basePath = `/projects/${category}`
  
  // CategoryListing will fetch and display posts from wpCategory.id
  return (
    <CategoryListing 
      categoryId={wpCategory.id} 
      title={wpCategory.name} 
      basePath={basePath} 
      pageParam={pageParam} 
    />
  )
}

