import { Metadata } from "next"
import CategoryListing from "@/components/category-listing"

export const metadata: Metadata = {
  title: "Religious Architecture Projects | Sacred Spaces & Places of Worship",
  description: "Explore our portfolio of religious architecture projects including churches, temples, mosques, and sacred spaces designed for worship, contemplation, and community.",
  keywords: ["religious architecture", "sacred spaces", "churches", "temples", "mosques", "places of worship", "cathedral design", "chapel architecture"],
}

export default async function ReligiousProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={53} title="Religious Architecture" basePath="/projects/religious" pageParam={pageParam} />
}
