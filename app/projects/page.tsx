import CategoryListing from "@/components/category-listing"

export default async function ProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={33} title="Projects" basePath="/projects" pageParam={pageParam} />
}