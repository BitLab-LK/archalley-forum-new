"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, ExternalLink, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"
import { 
  getAllPosts,
  getFeaturedImageUrl, 
  getFeaturedImageAlt, 
  getPostCategory,
  cleanText,
  formatDate,
  type WordPressPost
} from "@/lib/wordpress-api"

interface HorizontalTrendingSectionProps {
  initialPosts?: WordPressPost[]
}

export default function HorizontalTrendingSection({ initialPosts = [] }: HorizontalTrendingSectionProps) {
  const [trendingPosts, setTrendingPosts] = useState<WordPressPost[]>(initialPosts)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Responsive posts per view
  const [postsPerView, setPostsPerView] = useState(4)

  useEffect(() => {
    // Set posts per view based on screen size
    const updatePostsPerView = () => {
      if (window.innerWidth < 640) {
        setPostsPerView(1) // Mobile: 1 post
      } else if (window.innerWidth < 768) {
        setPostsPerView(2) // Small tablet: 2 posts
      } else if (window.innerWidth < 1024) {
        setPostsPerView(3) // Tablet: 3 posts
      } else {
        setPostsPerView(4) // Desktop: 4 posts
      }
    }

    updatePostsPerView()
    window.addEventListener('resize', updatePostsPerView)
    return () => window.removeEventListener('resize', updatePostsPerView)
  }, [])

  // Fetch trending posts on client side if no initial data
  useEffect(() => {
    if (initialPosts.length === 0) {
      fetchTrendingPosts()
    }
  }, [initialPosts.length])

  const fetchTrendingPosts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedPosts = await getAllPosts(1, 8) // Get 8 posts for better sliding
      setTrendingPosts(fetchedPosts)
    } catch (err) {
      setError('Failed to load trending posts')
      console.error('Error fetching trending posts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, trendingPosts.length - postsPerView)
      return prevIndex >= maxIndex ? 0 : prevIndex + 1
    })
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, trendingPosts.length - postsPerView)
      return prevIndex <= 0 ? maxIndex : prevIndex - 1
    })
  }

  // Auto-play functionality
  useEffect(() => {
    if (trendingPosts.length > postsPerView) {
      const interval = setInterval(nextSlide, 5000) // Change slide every 5 seconds
      return () => clearInterval(interval)
    }
    return undefined
  }, [trendingPosts.length, postsPerView])

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary mr-3 animate-pulse" />
              <h2 className="text-2xl md:text-3xl font-bold">Trending Now</h2>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <Card className="overflow-hidden">
                  <div className="bg-gray-200 aspect-[16/9] w-full"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-5 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || trendingPosts.length === 0) {
    return (
      <section className="py-12 bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-primary mr-3" />
            <h2 className="text-2xl md:text-3xl font-bold">Trending Now</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            {error || "No trending posts available at the moment."}
          </p>
          <Button onClick={fetchTrendingPosts} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-y">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-primary mr-3" />
            <h2 className="text-2xl md:text-3xl font-bold">Trending Now</h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the most popular architecture articles, projects, and discussions from our community.
          </p>
        </div>

        {/* Trending Slider */}
        <div className="relative">
          {/* Navigation Buttons */}
          {trendingPosts.length > postsPerView && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Posts Grid */}
          <div className="overflow-hidden mx-8">
            <div 
              className="flex transition-transform duration-500 ease-in-out gap-6"
              style={{ transform: `translateX(-${currentIndex * (100 / postsPerView)}%)` }}
            >
              {trendingPosts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="flex-shrink-0"
                  style={{ width: `calc(${100 / postsPerView}% - ${24 * (postsPerView - 1) / postsPerView}px)` }}
                >
                  <TrendingCard post={post} index={index} />
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {trendingPosts.length > postsPerView && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: Math.ceil((trendingPosts.length - postsPerView + 1)) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Link */}
        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <a href="https://archalley.com/blog" target="_blank" rel="noopener noreferrer">
              View All Posts
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

function TrendingCard({ post, index }: { post: WordPressPost; index: number }) {
  const category = getPostCategory(post)
  const imageUrl = getFeaturedImageUrl(post, 'medium')
  const imageAlt = getFeaturedImageAlt(post)
  const title = cleanText(post.title.rendered)
  const formattedDate = formatDate(post.date)

  // Truncate title for card display
  const truncatedTitle = title.length > 80 ? title.substring(0, 80) + '...' : title

  return (
    <a 
      href={post.link} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block group h-full"
      style={{
        animationDelay: `${index * 150}ms`,
        animation: `slideInUp 0.6s ease-out forwards ${index * 150}ms`,
        opacity: 0,
        transform: 'translateY(30px)'
      }}
    >
      <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category Badge */}
          <div className="mb-2">
            <Badge 
              variant="outline" 
              className="text-xs px-2 py-1 text-muted-foreground border-muted-foreground/20"
            >
              {category.name}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm leading-tight mb-2 group-hover:text-primary transition-colors duration-200">
            {truncatedTitle}
          </h3>

          {/* Date */}
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {formattedDate}
          </div>
        </div>
      </Card>

      <style jsx>{`
        @keyframes slideInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </a>
  )
}
