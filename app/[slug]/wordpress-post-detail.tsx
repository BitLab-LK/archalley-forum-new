import SinglePostPage from '@/app/articles/[slug]/single-post-page'

interface WordPressPostDetailProps {
  post: any
  slug: string
  previousPost?: any
  nextPost?: any
  relatedPosts?: any[]
  photoUrls?: string[]
}

export default function WordPressPostDetail({ post, previousPost, nextPost, relatedPosts, photoUrls }: WordPressPostDetailProps) {
  return (
    <SinglePostPage
      post={post}
      previousPost={previousPost || null}
      nextPost={nextPost || null}
      relatedPosts={relatedPosts || []}
      photoUrls={photoUrls || []}
    />
  )
}

