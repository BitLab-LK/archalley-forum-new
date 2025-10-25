"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, ChevronLeft, ChevronRight, Share2 } from 'lucide-react'
import { WordPressPost, getFeaturedImageUrl, getFeaturedImageAlt, stripHtml, formatDate } from '@/lib/wordpress-api'
import WordPressBreadcrumb from '@/components/wordpress-breadcrumb'
import ArchAlleySidebar from '@/components/archalley-sidebar'
import { ImageGallery } from '@/components/image-gallery'
import ShareDropdown from '@/components/share-dropdown'

interface SinglePostPageProps {
  post: WordPressPost
  previousPost: WordPressPost | null
  nextPost: WordPressPost | null
  relatedPosts: WordPressPost[]
  photoUrls: string[]
}

export default function SinglePostPage({
  post,
  previousPost,
  nextPost,
  relatedPosts,
  photoUrls
}: SinglePostPageProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [initialGalleryIndex, setInitialGalleryIndex] = useState(0)

  const openGallery = (index: number) => {
    setInitialGalleryIndex(index)
    setIsGalleryOpen(true)
  }

  // Extract categories
  const categories = post._embedded?.['wp:term']?.[0]?.filter(term => term.taxonomy === 'category') || []
  const tags = post._embedded?.['wp:term']?.[0]?.filter(term => term.taxonomy === 'post_tag') || []

  // Get featured image URL
  const featuredImageUrl = getFeaturedImageUrl(post, 'large')
  const featuredImageAlt = getFeaturedImageAlt(post)

  // Create share object for ShareDropdown
  const sharePost = {
    id: post.id.toString(),
    title: stripHtml(post.title.rendered),
    content: stripHtml(post.excerpt.rendered),
    link: typeof window !== 'undefined' ? window.location.href : post.link
  }

  // Build breadcrumb items
  const breadcrumbItems = categories.slice(0, 1).map(cat => ({
    label: cat.name,
    href: `/categories/${cat.slug}`
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Breadcrumb */}
          <WordPressBreadcrumb 
            items={breadcrumbItems}
            currentTitle={stripHtml(post.title.rendered)}
          />

          {/* Post Title */}
          <h1 
            className="text-3xl md:text-4xl font-bold mb-6"
            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />

          {/* Date and Categories */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.date}>
                {formatDate(post.date)}
              </time>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, idx) => (
                  <span key={cat.id}>
                    <Link 
                      href={`/categories/${cat.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {cat.name}
                    </Link>
                    {idx < categories.length - 1 && ','}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Share Options - Top */}
          <div className="mb-6">
            <ShareDropdown 
              post={sharePost}
              variant="outline"
              showLabel={true}
            />
          </div>

          {/* Featured Image */}
          {featuredImageUrl && (
            <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden">
              <Image
                src={featuredImageUrl}
                alt={featuredImageAlt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 75vw"
              />
            </div>
          )}

          {/* Post Content */}
          <div 
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: post.content.rendered }}
          />

          {/* Post Tags */}
          {tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80 transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Photo Gallery */}
          {photoUrls.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Photo Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photoUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => openGallery(index)}
                    className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity group"
                  >
                    <Image
                      src={url}
                      alt={`Gallery image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Share2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Share Options - Bottom */}
          <div className="mb-8">
            <ShareDropdown 
              post={sharePost}
              variant="outline"
              showLabel={true}
            />
          </div>

          {/* Previous/Next Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {previousPost && (
              <Link 
                href={`/articles/${previousPost.slug}`}
                className="group p-4 border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm">Previous Post</span>
                </div>
                <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                  {stripHtml(previousPost.title.rendered)}
                </h4>
              </Link>
            )}
            {nextPost && (
              <Link 
                href={`/articles/${nextPost.slug}`}
                className="group p-4 border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-end gap-2 text-muted-foreground mb-2">
                  <span className="text-sm">Next Post</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
                <h4 className="font-semibold text-right group-hover:text-primary transition-colors line-clamp-2">
                  {stripHtml(nextPost.title.rendered)}
                </h4>
              </Link>
            )}
          </div>

          {/* Related Posts Grid */}
          {relatedPosts.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Related Posts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/articles/${relatedPost.slug}`}
                    className="group"
                  >
                    <div className="relative aspect-video mb-3 rounded-lg overflow-hidden">
                      <Image
                        src={getFeaturedImageUrl(relatedPost, 'medium')}
                        alt={getFeaturedImageAlt(relatedPost)}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {stripHtml(relatedPost.title.rendered)}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      {formatDate(relatedPost.date)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ArchAlleySidebar />
        </div>
      </div>

      {/* Image Gallery Lightbox */}
      <ImageGallery
        images={photoUrls}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        initialIndex={initialGalleryIndex}
      />
    </div>
  )
}
