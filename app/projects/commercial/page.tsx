import CategoryListing from "@/components/category-listing"

export default async function CommercialProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={50} title="Commercial & Offices" basePath="/projects/commercial" pageParam={pageParam} />
}