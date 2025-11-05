import { Metadata } from "next"
import CategoryListing from "@/components/category-listing"

export const metadata: Metadata = {
  title: "Landscape & Urbanism Projects | Urban Planning & Design",
  description: "Explore our portfolio of landscape architecture and urban planning projects that shape sustainable and vibrant public spaces, parks, and urban environments.",
  keywords: ["landscape architecture", "urbanism", "urban planning", "urban design", "landscape design", "public spaces", "parks", "gardens", "streetscape"],
}

export default async function LandscapeProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={55} title="Landscape & Urbanism" basePath="/projects/landscape" pageParam={pageParam} />
}
