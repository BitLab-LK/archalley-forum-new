import { Metadata } from "next"
import CategoryListing from "@/components/category-listing"

export const metadata: Metadata = {
  title: "Industrial & Infrastructure Projects | Manufacturing & Facilities",
  description: "Explore our portfolio of industrial and infrastructure projects including factories, warehouses, manufacturing facilities, and logistics centers built for functionality and efficiency.",
  keywords: ["industrial architecture", "infrastructure projects", "factory design", "warehouse design", "manufacturing facilities", "industrial buildings", "logistics centers"],
}

export default async function IndustrialProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={54} title="Industrial & Infrastructure" basePath="/projects/industrial" pageParam={pageParam} />
}
