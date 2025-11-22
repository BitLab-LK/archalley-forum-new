import CategoryListing from "@/components/category-listing"

export default async function AcademicPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams
  const pageParam = typeof resolvedSearchParams?.page === 'string' ? resolvedSearchParams.page : Array.isArray(resolvedSearchParams?.page) ? resolvedSearchParams.page[0] : null
  return <CategoryListing categoryId={58} title="Academic" basePath="/academic" pageParam={pageParam} />
}