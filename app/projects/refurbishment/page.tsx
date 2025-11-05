import { Metadata } from "next"
import CategoryListing from "@/components/category-listing"

export const metadata: Metadata = {
  title: "Refurbishment Projects | Renovation & Restoration",
  description: "Explore our portfolio of refurbishment and renovation projects that breathe new life into existing structures through adaptive reuse and modern restoration techniques.",
  keywords: ["refurbishment", "renovation", "restoration", "adaptive reuse", "building renovation", "retrofit", "remodel", "modernization"],
}

export default async function RefurbishmentProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={49} title="Refurbishment" basePath="/projects/refurbishment" pageParam={pageParam} />
}
