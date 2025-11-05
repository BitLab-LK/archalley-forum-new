import CategoryListing from "@/components/category-listing"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hospitality Architecture Projects | Hotels, Resorts & Venues",
  description: "Explore our portfolio of exceptional hospitality architecture projects including hotels, resorts, restaurants, and venues designed to create unforgettable guest experiences.",
  keywords: ["hospitality architecture", "hotel design", "resort architecture", "restaurant design", "hospitality projects", "guest experience design"],
}

export default async function HospitalityProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={51} title="Hospitality Architecture" basePath="/projects/hospitality" pageParam={pageParam} />
}
