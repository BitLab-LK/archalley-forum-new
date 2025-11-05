import { Metadata } from "next"
import CategoryListing from "@/components/category-listing"

export const metadata: Metadata = {
  title: "Public Architecture Projects | Civic & Government Buildings",
  description: "Explore our portfolio of public architecture projects including libraries, museums, civic centers, and government buildings that serve and inspire communities.",
  keywords: ["public architecture", "civic buildings", "government buildings", "municipal architecture", "libraries", "museums", "community centers", "cultural centers"],
}

export default async function PublicProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={52} title="Public Architecture" basePath="/projects/public" pageParam={pageParam} />
}
