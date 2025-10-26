import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProjectBySlug, getPostsByCategoryPaginated, getMediaUrl, WordPressPost } from '@/lib/wordpress-api'
import EventPageClient from './event-page-client'

export const dynamic = 'force-dynamic'
export const revalidate = 300

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // For the specific "tree-without-a-tree" event, return custom metadata
  if (params.slug === 'tree-without-a-tree') {
    return {
      title: 'Tree Without a Tree | Architecture Event | Archalley',
      description: 'Join us for an innovative architecture event exploring sustainable design and urban forestry. Discover how architects are reimagining green spaces in urban environments.',
      keywords: 'architecture event, sustainable design, urban forestry, green architecture, environmental design',
    }
  }

  // For other events, try to fetch from WordPress
  const post = await getProjectBySlug(params.slug)
  
  if (!post) {
    return {
      title: 'Event Not Found',
    }
  }

  const title = post.title.rendered.replace(/<[^>]*>/g, '')
  const excerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '')

  return {
    title: `${title} | Archalley Events`,
    description: excerpt,
  }
}

export default async function EventPage({ params }: PageProps) {
  // Handle the specific "tree-without-a-tree" event
  if (params.slug === 'tree-without-a-tree') {
    return <EventPageClient eventSlug="tree-without-a-tree" />
  }

  // For other events, try to fetch from WordPress
  const post = await getProjectBySlug(params.slug)

  if (!post) {
    notFound()
  }

  // Get posts in the same category for navigation and related posts
  const categoryId = post.categories && post.categories.length > 0 ? post.categories[0] : null
  let postsInCategory: WordPressPost[] = []
  
  if (categoryId) {
    postsInCategory = await getPostsByCategoryPaginated(categoryId)
  }

  // Find current post index for navigation
  const currentIndex = postsInCategory.findIndex(p => p.id === post.id)
  const previousPost = currentIndex > 0 ? postsInCategory[currentIndex - 1] : null
  const nextPost = currentIndex < postsInCategory.length - 1 ? postsInCategory[currentIndex + 1] : null

  // Get latest 6 posts from the same category for related posts grid
  const relatedPosts = postsInCategory
    .filter(p => p.id !== post.id)
    .slice(0, 6)

  // Fetch photo URLs if ACF photos exist
  let photoUrls: string[] = []
  if (post.acf?.photos && post.acf.photos.length > 0) {
    photoUrls = await Promise.all(
      post.acf.photos.map(async (mediaId) => {
        const url = await getMediaUrl(mediaId)
        return url || ''
      })
    )
    photoUrls = photoUrls.filter(url => url !== '')
  }

  return (
    <EventPageClient 
      post={post}
      previousPost={previousPost}
      nextPost={nextPost}
      relatedPosts={relatedPosts}
      photoUrls={photoUrls}
    />
  )
}