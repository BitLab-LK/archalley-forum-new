import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProjectBySlug, getPostsByCategoryPaginated, getMediaUrl } from '@/lib/wordpress-api'
import { prisma } from '@/lib/prisma'
import PostDetailPage from './post-detail-page'
import WordPressPostDetail from './wordpress-post-detail'

export const dynamic = 'force-dynamic'
export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  
  // Check if it's a numeric slug (WordPress post)
  const isWordPressSlug = !slug.match(/^[a-z0-9]{25}$/i) // CUIDs are 25 characters
  
  if (isWordPressSlug) {
    // WordPress post
    const post = await getProjectBySlug(slug)
    if (!post) {
      return { title: 'Post Not Found' }
    }
    
    return {
      title: `${post.title.rendered} | ArchAlley`,
      description: post.excerpt.rendered || 'ArchAlley Post',
    }
  } else {
    // Forum post (CUID)
    const post = await prisma.post.findUnique({
      where: { id: slug },
      include: {
        users: {
          select: {
            name: true,
            image: true,
          }
        }
      }
    })
    
    if (!post) {
      return { title: 'Post Not Found' }
    }
    
    const authorName = post.isAnonymous ? 'Anonymous' : post.users?.name || 'Unknown'
    const preview = post.content.substring(0, 150)
    
    return {
      title: `${authorName}'s Post | ArchAlley Forum`,
      description: preview,
    }
  }
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params
  
  // Check if it's a numeric slug (WordPress post) or CUID (forum post)
  const isCUID = slug.match(/^[a-z0-9]{25}$/i) // CUIDs are 25 characters
  
  if (isCUID) {
    // Forum post - fetch from database
    const post = await prisma.post.findUnique({
      where: { id: slug },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
            userBadges: {
              take: 3,
              orderBy: { earnedAt: 'desc' },
              include: {
                badges: true
              }
            }
          }
        },
        primaryCategory: true,
        postCategories: {
          include: {
            category: true
          }
        },
        _count: {
          select: {
            Comment: true
          }
        }
      }
    })
    
    if (!post) {
      notFound()
    }
    
    // Get vote counts
    const [upvotes, downvotes] = await Promise.all([
      prisma.votes.count({
        where: { postId: slug, type: 'UP' }
      }),
      prisma.votes.count({
        where: { postId: slug, type: 'DOWN' }
      })
    ])
    
    // Format images
    const images = post.images && post.images.length > 0 ? post.images : undefined
    
    // Format post data
    const formattedPost = {
      id: post.id,
      author: {
        id: post.users?.id || '',
        name: post.isAnonymous ? "Anonymous" : (post.users?.name || 'Anonymous'),
        avatar: post.users?.image || '/archalley-pro-pic.png',
        isVerified: post.users?.isVerified || false,
        badges: post.users?.userBadges || []
      },
      content: post.content || '',
      category: post.primaryCategory?.name || 'General',
      categories: post.primaryCategory || { id: '', name: 'General', color: '#gray', slug: 'general' },
      allCategories: post.postCategories?.map(pc => pc.category).filter((cat, idx, arr) => 
        arr.findIndex(c => c.id === cat.id) === idx
      ) || [],
      isAnonymous: post.isAnonymous || false,
      isPinned: post.isPinned || false,
      upvotes,
      downvotes,
      userVote: null as "up" | "down" | null, // Will be set client-side
      comments: post._count?.Comment || 0,
      timeAgo: new Date(post.createdAt).toLocaleString(),
      images,
      topComment: undefined as any
    }
    
    return <PostDetailPage post={formattedPost} />
  } else {
    // WordPress post - fetch from WordPress API
    const post = await getProjectBySlug(slug)
    
    if (!post) {
      notFound()
    }
    
    // Get posts in the same category for navigation and related posts
    const categoryId = post.categories && post.categories.length > 0 ? post.categories[0] : null
    let postsInCategory: any[] = []
    
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
        post.acf.photos.map(async (mediaId: number) => {
          const url = await getMediaUrl(mediaId)
          return url || ''
        })
      )
      photoUrls = photoUrls.filter(url => url !== '')
    }
    
    return <WordPressPostDetail post={post} slug={slug} previousPost={previousPost} nextPost={nextPost} relatedPosts={relatedPosts} photoUrls={photoUrls} />
  }
}

