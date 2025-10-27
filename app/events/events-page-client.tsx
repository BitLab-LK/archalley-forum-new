"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Calendar, ExternalLink, Search, Loader2 } from "lucide-react"
import { 
  getPostsByCategory,
  getAllCategories,
  getFeaturedImageUrl, 
  getFeaturedImageAlt, 
  stripHtml, 
  formatDate, 
  getPostExcerpt,
  type WordPressPost,
  type WordPressCategory
} from "@/lib/wordpress-api"
import AdBannerComponent from "@/components/ad-banner"
import SidebarYouTube from "@/components/sidebar-youtube"
import SidebarFacebook from "@/components/sidebar-facebook"

interface EventsPageClientProps {
  initialEvents?: WordPressPost[]
  initialCategories?: WordPressCategory[]
}

// Static events for competitions
const treeEvent2024: WordPressPost = {
  id: -1, // Special ID to identify this static event
  date: '2024-12-01T00:00:00',
  title: {
    rendered: 'Tree Without a Tree - 2024'
  },
  excerpt: {
    rendered: 'Innovative Christmas Tree "Design, Make & Decorate" Competition - Explore alternative solutions for traditional methods of building Christmas trees.'
  },
  content: {
    rendered: '<p>Tree Without a Tree was a competition designed to explore alternative solutions for traditional methods of building Christmas trees, beyond the conventional approach. During the Christmas season, we embraced the spirit of giving by expressing our love and concern for the environment, with an attempt to protect natural trees & reduce waste after use, ensuring a joyful and eco-friendly celebration.</p>'
  },
  slug: 'tree-without-a-tree',
  link: '/events/tree-without-a-tree',
  featured_media: 0,
  categories: [],
  _embedded: {
    'wp:featuredmedia': [{
      id: 0,
      source_url: '/uploads/1749372032760-Tree_without_a_Tree_-_Thumbnail_for_Events_Page.webp',
      alt_text: 'Tree Without a Tree Competition 2024',
      media_details: {
        width: 800,
        height: 600,
        sizes: {
          large: {
            source_url: '/uploads/1749372032760-Tree_without_a_Tree_-_Thumbnail_for_Events_Page.webp',
            width: 800,
            height: 600
          }
        }
      }
    }]
  }
}

const architecturalEvent2025: WordPressPost = {
  id: -2, // Special ID to identify this static event
  date: '2025-03-15T00:00:00',
  title: {
    rendered: 'Innovative Design Challenge - 2025'
  },
  excerpt: {
    rendered: 'Architecture & Design Competition - Push the boundaries of sustainable architecture and create innovative solutions for modern living spaces.'
  },
  content: {
    rendered: '<p>The Innovative Design Challenge 2025 invites architects, designers, and creative minds to reimagine sustainable architecture. This competition focuses on creating innovative, eco-friendly solutions that address contemporary housing challenges while maintaining aesthetic excellence and environmental responsibility.</p>'
  },
  slug: 'innovative-design-challenge-2025',
  link: '/events/innovative-design-challenge-2025',
  featured_media: 0,
  categories: [],
  _embedded: {
    'wp:featuredmedia': [{
      id: 0,
      source_url: '/uploads/design-challenge-2025-thumbnail.svg',
      alt_text: 'Innovative Design Challenge 2025',
      media_details: {
        width: 800,
        height: 600,
        sizes: {
          large: {
            source_url: '/uploads/design-challenge-2025-thumbnail.svg',
            width: 800,
            height: 600
          }
        }
      }
    }]
  }
}

export default function EventsPageClient({ initialEvents = [], initialCategories = [] }: EventsPageClientProps) {
  const [events, setEvents] = useState<WordPressPost[]>([architecturalEvent2025, treeEvent2024, ...initialEvents])
  const [categories, setCategories] = useState<WordPressCategory[]>(initialCategories)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialEvents.length >= 20) // Set based on initial data
  const [selectedEvent, setSelectedEvent] = useState<WordPressPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showAnimations, setShowAnimations] = useState(false)

  // Trigger animations when component mounts or data loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimations(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Reset animations when search changes
  useEffect(() => {
    if (searchTerm) {
      setShowAnimations(false)
      const timer = setTimeout(() => {
        setShowAnimations(true)
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setShowAnimations(true)
      return () => {} // Return empty cleanup function
    }
  }, [searchTerm])

  // Fetch events on client side if no initial data
  useEffect(() => {
    if (initialEvents.length === 0 && initialCategories.length === 0) {
      fetchEventsData()
    }
  }, [initialEvents.length, initialCategories.length])

  const fetchEventsData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // First fetch categories to find the events category ID
      const fetchedCategories = await getAllCategories()
      setCategories(fetchedCategories)
      
      // Find the events category
      const eventsCategory = fetchedCategories.find((cat) => 
        cat.slug.toLowerCase().includes('event') || 
        cat.name.toLowerCase().includes('event')
      )
      
      if (eventsCategory) {
        // Fetch events posts
        const fetchedEvents = await getPostsByCategory(eventsCategory.id, 1, 20)
        setEvents([architecturalEvent2025, treeEvent2024, ...fetchedEvents]) // Always prepend the static events
        setCurrentPage(1) // Reset to first page
        setHasMore(fetchedEvents.length === 20)
      } else {
        setError('Events category not found')
      }
    } catch (err) {
      setError('Failed to load events')
      console.error('Error fetching events:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreEvents = async () => {
    console.log('Load more clicked - Current page:', currentPage, 'Has more:', hasMore, 'Categories:', categories.length)
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      // Add small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Find the events category - if not found in current categories, fetch them again
      let eventsCategory = categories.find((cat) => 
        cat.slug.toLowerCase().includes('event') || 
        cat.name.toLowerCase().includes('event')
      )
      
      // If categories is empty or no events category found, fetch categories again
      if (!eventsCategory || categories.length === 0) {
        console.log('Fetching categories because not found or empty')
        const fetchedCategories = await getAllCategories()
        setCategories(fetchedCategories)
        eventsCategory = fetchedCategories.find((cat) => 
          cat.slug.toLowerCase().includes('event') || 
          cat.name.toLowerCase().includes('event')
        )
      }
      
      if (eventsCategory) {
        const nextPage = currentPage + 1
        console.log('Fetching page:', nextPage, 'for category:', eventsCategory.name)
        const moreEvents = await getPostsByCategory(eventsCategory.id, nextPage, 10)
        
        if (moreEvents.length > 0) {
          console.log('Loaded', moreEvents.length, 'more events')
          // Deduplicate posts by ID to prevent duplicate keys
          // Keep static events at the beginning if they exist
          setEvents(prev => {
            const staticEvents = prev.filter(e => e.id === -1 || e.id === -2)
            const nonStaticEvents = prev.filter(e => e.id !== -1 && e.id !== -2)
            const existingIds = new Set(prev.map(post => post.id))
            const newPosts = moreEvents.filter(post => !existingIds.has(post.id))
            const updatedEvents = [...nonStaticEvents, ...newPosts]
            return [...staticEvents, ...updatedEvents]
          })
          setCurrentPage(nextPage)
          setHasMore(moreEvents.length === 10)
        } else {
          console.log('No more events found')
          setHasMore(false)
        }
      } else {
        console.error('Events category not found')
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more events:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter events based on search term
  const filteredEvents = events.filter(item => {
    const matchesSearch = searchTerm === "" || 
      stripHtml(item.title.rendered).toLowerCase().includes(searchTerm.toLowerCase()) ||
      stripHtml(item.excerpt.rendered).toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (isLoading && events.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Events</h1>
            </div>
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && events.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Events</h1>
          </div>
          <p className="text-muted-foreground mb-8 text-lg">{error}</p>
          <Button onClick={fetchEventsData} variant="ghost" className="rounded-full">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Minimalistic */}
        <div className={`text-center mb-16 ${showAnimations ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-center">
            Events
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-center">
            Discover conferences, workshops, exhibitions, and networking events in the architecture and design community
          </p>
        </div>

        {/* Search Bar - Minimalistic */}
        <div className={`max-w-2xl mx-auto mb-16 text-center ${showAnimations ? 'animate-fade-in-up-delay' : 'opacity-0'}`}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 text-base border-0 bg-muted/30 rounded-full focus:bg-background transition-all duration-300"
                />
              </div>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            {searchTerm && (
              <div className={`text-center mb-12 ${showAnimations ? 'animate-fade-in' : 'opacity-0'}`}>
                <p className="text-sm text-muted-foreground">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                </p>
              </div>
            )}

        {/* Events Grid - Minimalistic Layout */}
        {filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((item, index) => (
              <EventCard 
                key={`event-${item.id}-${index}`} 
                event={item} 
                index={index}
                onReadMore={(eventItem) => {
                  setSelectedEvent(eventItem)
                  setIsModalOpen(true)
                }}
              />
            ))}
          </div>
        )}

        {/* Loading skeleton for additional content */}
        {isLoading && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse bg-muted/30 border-0 flex flex-col">
                <div className="aspect-video bg-muted/50"></div>
                <div className="p-6 flex flex-col">
                  <div className="h-6 bg-muted/50 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-muted/50 rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted/50 rounded w-2/3 mb-6"></div>
                  <div className="h-10 bg-muted/50 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredEvents.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? `No events found for "${searchTerm}"` : 'No events available'}
            </p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !searchTerm && filteredEvents.length > 0 && (
          <div className="text-center mt-16">
            <Button 
              onClick={loadMoreEvents} 
              variant="ghost" 
              size="lg"
              disabled={isLoading}
              className="hover:bg-muted/50 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}

        {/* Newsletter Signup - Minimalistic */}
        <div className="mt-24">
          <div className="text-center py-16 border-t border-border/50">
            <h3 className="text-2xl font-semibold mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join our community for the latest events and opportunities
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
              <Button asChild variant="default" className="rounded-full">
                <Link href="/forum">Join Community</Link>
              </Button>
              <Button variant="outline" asChild className="rounded-full">
                <Link href="/auth/register">Subscribe</Link>
              </Button>
            </div>
          </div>
        </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              {/* Square Ad in Sidebar */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-1">
                <AdBannerComponent 
                  size="320x320" 
                  className="w-full" 
                  positionId="sidebar-square-events"
                  autoRotate={true}
                  rotationInterval={30}
                  showLabel={false}
                />
              </div>

              {/* YouTube Section */}
              <SidebarYouTube />

              {/* Facebook Section */}
              <SidebarFacebook />
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 border-0 bg-white/95 backdrop-blur-sm">
          {selectedEvent && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{stripHtml(selectedEvent.title.rendered)}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[85vh] modal-content">
                {/* Featured Image */}
                <div className="relative aspect-[16/8] overflow-hidden">
                <Image
                  src={getFeaturedImageUrl(selectedEvent, 'large')}
                  alt={getFeaturedImageAlt(selectedEvent)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-6 lg:p-8">
                {/* Title */}
                <h1 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight text-foreground">
                  {stripHtml(selectedEvent.title.rendered)}
                </h1>

                {/* Meta Info */}
                <div className="flex items-center mb-6 pb-4 border-b border-border/20">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{formatDate(selectedEvent.date)}</span>
                </div>

                {/* Content */}
                <div 
                  className="prose prose-base max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground/85 prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-strong:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80 hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md prose-blockquote:border-primary/30 prose-blockquote:bg-muted/30 prose-blockquote:rounded-lg prose-blockquote:py-3 prose-ul:text-foreground/85 prose-ol:text-foreground/85 prose-li:mb-1"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedEvent.content.rendered 
                  }}
                />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slideInUp 0.8s ease-out forwards;
          opacity: 0;
          transform: translateY(40px);
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-fade-in-up-delay {
          animation: fadeInUp 0.8s ease-out forwards 0.2s;
          opacity: 0;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        /* Custom scrollbar for modal content */
        .modal-content::-webkit-scrollbar {
          width: 6px;
        }
        .modal-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-content::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .modal-content::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        
        /* Enhanced prose styling for modal */
        .prose img {
          margin: 1.5rem auto;
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .prose h1, .prose h2, .prose h3 {
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .prose p {
          font-size: 1rem;
          line-height: 1.65;
        }
      `}</style>
    </div>
  )
}

function EventCard({ 
  event, 
  index, 
  onReadMore 
}: { 
  event: WordPressPost; 
  index: number;
  onReadMore: (event: WordPressPost) => void;
}) {
  const imageUrl = getFeaturedImageUrl(event, 'large')
  const imageAlt = getFeaturedImageAlt(event)
  const title = stripHtml(event.title.rendered)
  const excerpt = getPostExcerpt(event, 150)

  // Check if this is a static event (id === -1 or -2)
  const isStaticEvent = event.id === -1 || event.id === -2
  const eventLink = isStaticEvent ? event.link : null

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-500 ease-in-out hover:-translate-y-1 bg-white/50 backdrop-blur-sm border-0 overflow-hidden animate-slide-in flex flex-col"
      style={{
        animationDelay: `${Math.min(index * 150, 1000)}ms`, // Cap delay at 1000ms
      } as React.CSSProperties}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed text-sm flex-grow">
          {excerpt}
        </p>

        {/* View Event Button */}
        {isStaticEvent && eventLink ? (
          <Button 
            variant="default" 
            size="sm" 
            asChild
            className="w-full"
          >
            <Link href={eventLink}>
              <span className="inline-flex items-center">
                View Event
                <ExternalLink className="ml-2 h-4 w-4" />
              </span>
            </Link>
          </Button>
        ) : (
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => onReadMore(event)}
            className="w-full"
          >
            <span className="inline-flex items-center">
              View Event
              <ExternalLink className="ml-2 h-4 w-4" />
            </span>
          </Button>
        )}
      </div>
    </Card>
  )
}