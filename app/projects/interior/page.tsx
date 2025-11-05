import { Metadata } from "next"
import CategoryListing from "@/components/category-listing"

export const metadata: Metadata = {
  title: "Interior Design Projects | Residential & Commercial Interiors",
  description: "Explore our portfolio of exceptional interior design projects that blend aesthetics with functionality. Discover innovative residential and commercial interior spaces.",
  keywords: ["interior design", "interior architecture", "residential interiors", "commercial interiors", "interior spaces", "furniture design", "spatial design"],
}

export default async function InteriorProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={48} title="Interior Design" basePath="/projects/interior" pageParam={pageParam} />
}
