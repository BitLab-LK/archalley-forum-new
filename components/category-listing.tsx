import SiteLayout from "@/components/site-layout"
import CategoryGridClient from "@/components/category-grid-client"
import AdBannerComponent from "@/components/ad-banner"

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://archalley.com/wp-json/wp/v2'

interface CategoryListingProps {
  categoryId: number
  title: string
  basePath: string
  pageParam?: string | null
}

export default async function CategoryListing({ categoryId, title, basePath, pageParam }: CategoryListingProps) {
  const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1)
  const perPage = 10

  const url = `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&categories=${categoryId}&page=${page}&per_page=${perPage}&status=publish&orderby=date&order=desc`
  const response = await fetch(url, { next: { revalidate: 300 } })
  const posts = response.ok ? await response.json() : []
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10)

  return (
    <>
      <SiteLayout>
        <div className="space-y-8">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          <CategoryGridClient posts={posts} currentPage={page} totalPages={totalPages} basePath={basePath} />
          <div className="mt-12">
            <AdBannerComponent size="970x180" className="w-full rounded-lg overflow-hidden" positionId="category-bottom-banner" autoRotate={true} rotationInterval={60} showLabel={false} />
          </div>
        </div>
      </SiteLayout>
    </>
  )
}


