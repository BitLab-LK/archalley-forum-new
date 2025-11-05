import CategoryListing from "@/components/category-listing"

export default async function AcademicPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={58} title="Academic" basePath="/academic" pageParam={pageParam} />
}