"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Users, Share2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { WordPressPost, getFeaturedImageUrl, getFeaturedImageAlt, stripHtml, formatDate } from '@/lib/wordpress-api'
import WordPressBreadcrumb from '@/components/wordpress-breadcrumb'
import ArchAlleySidebar from '@/components/archalley-sidebar'
import { ImageGallery } from '@/components/image-gallery'
import ShareDropdown from '@/components/share-dropdown'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AdBannerComponent from '@/components/ad-banner'

interface EventPageClientProps {
  eventSlug?: string
  post?: WordPressPost
  previousPost?: WordPressPost | null
  nextPost?: WordPressPost | null
  relatedPosts?: WordPressPost[]
  photoUrls?: string[]
}

export default function EventPageClient({
  eventSlug,
  post,
  previousPost,
  nextPost,
  relatedPosts = [],
  photoUrls = []
}: EventPageClientProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [initialGalleryIndex, setInitialGalleryIndex] = useState(0)

  const openGallery = (index: number) => {
    setInitialGalleryIndex(index)
    setIsGalleryOpen(true)
  }

  // Handle the specific "tree-without-a-tree" event
  if (eventSlug === 'tree-without-a-tree') {
    return <TreeWithoutATreeEvent />
  }

  // Handle WordPress events
  if (!post) {
    return <div>Event not found</div>
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
  const breadcrumbItems = [
    { label: 'Events', href: '/events' },
    ...categories.slice(0, 1).map(cat => ({
      label: cat.name,
      href: `/categories/${cat.slug}`
    }))
  ]

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

          {/* Event Title */}
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

          {/* Event Content */}
          <div 
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: post.content.rendered }}
          />

          {/* Event Tags */}
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
              <h3 className="text-lg font-semibold mb-4">Event Gallery</h3>
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
                href={`/events/${previousPost.slug}`}
                className="group p-4 border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm">Previous Event</span>
                </div>
                <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                  {stripHtml(previousPost.title.rendered)}
                </h4>
              </Link>
            )}
            {nextPost && (
              <Link 
                href={`/events/${nextPost.slug}`}
                className="group p-4 border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-end gap-2 text-muted-foreground mb-2">
                  <span className="text-sm">Next Event</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
                <h4 className="font-semibold text-right group-hover:text-primary transition-colors line-clamp-2">
                  {stripHtml(nextPost.title.rendered)}
                </h4>
              </Link>
            )}
          </div>

          {/* Related Events Grid */}
          {relatedPosts.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Related Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/events/${relatedPost.slug}`}
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

// Special component for the "Tree Without a Tree" event
function TreeWithoutATreeEvent() {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [initialGalleryIndex, setInitialGalleryIndex] = useState(0)

  const openGallery = (index: number) => {
    setInitialGalleryIndex(index)
    setIsGalleryOpen(true)
  }

  // Event details
  const eventDetails = {
    title: "Tree Without a Tree",
    subtitle: "Reimagining Urban Green Spaces",
    date: "March 15, 2024",
    time: "6:00 PM - 9:00 PM",
    location: "Architecture Center, Downtown",
    address: "123 Design Street, Creative District",
    capacity: "150 attendees",
    price: "Free for members, $25 for non-members",
    organizer: "Archalley Community",
    category: "Sustainable Design",
    tags: ["Urban Planning", "Sustainability", "Green Architecture", "Community Design"]
  }

  // Sample gallery images (you can replace with actual images)
  const galleryImages = [
    "/api/placeholder/600/400",
    "/api/placeholder/600/400", 
    "/api/placeholder/600/400",
    "/api/placeholder/600/400",
    "/api/placeholder/600/400",
    "/api/placeholder/600/400"
  ]

  const breadcrumbItems = [
    { label: 'Events', href: '/events' },
    { label: 'Sustainable Design', href: '/categories/sustainable-design' }
  ]

  const sharePost = {
    id: 'tree-without-a-tree',
    title: eventDetails.title,
    content: eventDetails.subtitle,
    link: typeof window !== 'undefined' ? window.location.href : '/events/tree-without-a-tree'
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 py-16 mb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <WordPressBreadcrumb 
              items={breadcrumbItems}
              currentTitle={eventDetails.title}
            />
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
              {eventDetails.title}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
              {eventDetails.subtitle}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                {eventDetails.date}
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Clock className="h-4 w-4 mr-2" />
                {eventDetails.time}
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <MapPin className="h-4 w-4 mr-2" />
                {eventDetails.location}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                Register Now
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="mr-2 h-4 w-4" />
                Share Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Event Details Card */}
            <Card className="p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6">Event Information</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <p className="font-semibold">Date & Time</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {eventDetails.date} at {eventDetails.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {eventDetails.location}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {eventDetails.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <p className="font-semibold">Capacity</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {eventDetails.capacity}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-6">Registration</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">Pricing</p>
                      <p className="text-lg text-green-600 font-semibold">
                        {eventDetails.price}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold mb-2">Organizer</p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {eventDetails.organizer}
                      </p>
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Register for Event
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Event Description */}
            <div className="prose prose-lg max-w-none mb-8">
              <h2>About This Event</h2>
              <p>
                Join us for an innovative exploration of sustainable design and urban forestry in "Tree Without a Tree" - 
                a groundbreaking event that challenges conventional approaches to green space design in urban environments.
              </p>
              
              <p>
                This unique gathering brings together architects, urban planners, environmental designers, and community 
                advocates to explore how we can create meaningful green experiences in cities without relying on traditional 
                tree planting. Through interactive workshops, expert presentations, and collaborative design sessions, 
                participants will discover innovative approaches to urban greening.
              </p>

              <h3>What You'll Learn</h3>
              <ul>
                <li>Alternative approaches to urban greening beyond traditional tree planting</li>
                <li>Integration of vertical gardens and living walls in architectural design</li>
                <li>Community-driven green space initiatives and their impact</li>
                <li>Technology and innovation in sustainable urban design</li>
                <li>Case studies from successful urban greening projects worldwide</li>
              </ul>

              <h3>Who Should Attend</h3>
              <p>
                This event is perfect for architects, urban planners, landscape designers, environmental consultants, 
                community organizers, and anyone passionate about creating sustainable, livable cities.
              </p>
            </div>

            {/* Event Gallery */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-6">Event Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {galleryImages.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => openGallery(index)}
                    className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity group"
                  >
                    <Image
                      src={url}
                      alt={`Event gallery image ${index + 1}`}
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

            {/* Event Tags */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Event Tags</h3>
              <div className="flex flex-wrap gap-2">
                {eventDetails.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="px-3 py-1">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Share Options */}
            <div className="mb-8">
              <ShareDropdown 
                post={sharePost}
                variant="outline"
                showLabel={true}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              {/* Event Registration Card */}
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Quick Registration</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">Free</p>
                    <p className="text-sm text-gray-500">for members</p>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Register Now
                  </Button>
                  <p className="text-xs text-center text-gray-500">
                    Limited seats available
                  </p>
                </div>
              </Card>

              {/* Ad Banner */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-1">
                <AdBannerComponent 
                  size="300x250" 
                  className="w-full" 
                  positionId="sidebar-rectangle-event"
                  autoRotate={true}
                  rotationInterval={30}
                  showLabel={false}
                />
              </div>

              {/* Related Events */}
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Related Events</h3>
                <div className="space-y-4">
                  <Link href="/events" className="block group">
                    <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      Sustainable Architecture Workshop
                    </h4>
                    <p className="text-sm text-gray-500">March 22, 2024</p>
                  </Link>
                  <Link href="/events" className="block group">
                    <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      Urban Design Conference
                    </h4>
                    <p className="text-sm text-gray-500">April 5, 2024</p>
                  </Link>
                  <Link href="/events" className="block group">
                    <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      Green Building Summit
                    </h4>
                    <p className="text-sm text-gray-500">April 15, 2024</p>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Lightbox */}
      <ImageGallery
        images={galleryImages}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        initialIndex={initialGalleryIndex}
      />
    </div>
  )
}