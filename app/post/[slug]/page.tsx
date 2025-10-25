import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProjectBySlug, getPostsByCategoryPaginated, getMediaUrl, WordPressPost } from '@/lib/wordpress-api'
import SinglePostPage from './single-post-page'

export const dynamic = 'force-dynamic'
export const revalidate = 300

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getProjectBySlug(params.slug)
  
  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const title = post.title.rendered.replace(/<[^>]*>/g, '')
  const excerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '')

  return {
    title: `${title} | Archalley`,
    description: excerpt,
  }
}

export default async function PostPage({ params }: PageProps) {
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
    <SinglePostPage 
      post={post}
      previousPost={previousPost}
      nextPost={nextPost}
      relatedPosts={relatedPosts}
      photoUrls={photoUrls}
    />
  )
}
