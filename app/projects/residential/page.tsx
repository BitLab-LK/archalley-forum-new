import { Metadata } from "next"
import CategoryListing from "@/components/category-listing"

export const metadata: Metadata = {
  title: "Residential Architecture Projects | Homes, Villas & Apartments",
  description: "Explore our portfolio of residential architecture projects including houses, villas, apartments, and residential buildings designed for modern living.",
  keywords: ["residential architecture", "house design", "villa design", "apartment design", "residential building", "home architecture", "housing design"],
}

export default async function ResidentialProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={47} title="Residential Architecture" basePath="/projects/residential" pageParam={pageParam} />
}
