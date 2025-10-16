"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Instagram, ExternalLink, Heart } from "lucide-react"
import { fetchInstagramPosts, formatInstagramDate, truncateCaption, type InstagramPost } from "@/app/actions/instagram"
import { SOCIAL_MEDIA } from "@/lib/constants"

interface InstagramSliderProps {
  initialPosts?: InstagramPost[]
}

export default function InstagramSlider({ initialPosts = [] }: InstagramSliderProps) {
  const [posts, setPosts] = useState<InstagramPost[]>(initialPosts)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Responsive posts per view
  const [postsPerView, setPostsPerView] = useState(4)

  useEffect(() => {
    // Set posts per view based on screen size
    const updatePostsPerView = () => {
      if (window.innerWidth < 640) {
        setPostsPerView(2) // Mobile: 2 posts
      } else if (window.innerWidth < 1024) {
        setPostsPerView(3) // Tablet: 3 posts
      } else if (window.innerWidth < 1280) {
        setPostsPerView(4) // Desktop: 4 posts
      } else {
        setPostsPerView(6) // Large desktop: 6 posts
      }
    }

    updatePostsPerView()
    window.addEventListener('resize', updatePostsPerView)
    return () => window.removeEventListener('resize', updatePostsPerView)
  }, [])

  // Fetch posts on client side if no initial data
  useEffect(() => {
    if (initialPosts.length === 0) {
      fetchPosts()
    }
  }, [initialPosts.length])

  const fetchPosts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedPosts = await fetchInstagramPosts(12)
      setPosts(fetchedPosts)
    } catch (err) {
      setError('Failed to load Instagram posts')
      console.error('Error fetching Instagram posts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, posts.length - postsPerView)
      return prevIndex >= maxIndex ? 0 : prevIndex + 1
    })
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, posts.length - postsPerView)
      return prevIndex <= 0 ? maxIndex : prevIndex - 1
    })
  }

  // Auto-play functionality
  useEffect(() => {
    if (posts.length > postsPerView) {
      const interval = setInterval(nextSlide, 4000) // Change slide every 4 seconds
      return () => clearInterval(interval)
    }
    return undefined
  }, [posts.length, postsPerView])

  if (isLoading) {
    return (
      <section className="py-8 bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest from Instagram</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-xl mb-2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || posts.length === 0) {
    return (
      <section className="py-8 bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest from Instagram</h2>
          <p className="text-muted-foreground mb-6">
            {error || "No Instagram posts available at the moment."}
          </p>
          <Button onClick={fetchPosts} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Instagram className="h-8 w-8 text-pink-500 mr-3" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Latest from Instagram
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Follow our journey and see the latest architectural inspirations, behind-the-scenes moments, and project updates.
          </p>
        </div>

        {/* Instagram Slider */}
        <div className="relative">
          {/* Navigation Buttons */}
          {posts.length > postsPerView && (
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
              className="flex transition-transform duration-500 ease-in-out gap-4"
              style={{ transform: `translateX(-${currentIndex * (100 / postsPerView)}%)` }}
            >
              {posts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="flex-shrink-0"
                  style={{ width: `calc(${100 / postsPerView}% - ${16 * (postsPerView - 1) / postsPerView}px)` }}
                >
                  <InstagramCard post={post} index={index} />
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {posts.length > postsPerView && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: Math.ceil((posts.length - postsPerView + 1)) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentIndex ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Follow Instagram Link */}
        <div className="text-center mt-8">
          <Button asChild variant="outline" size="lg" className="border-pink-200 text-pink-700 hover:bg-pink-50">
            <a href={SOCIAL_MEDIA.instagram} target="_blank" rel="noopener noreferrer">
              <Instagram className="mr-2 h-5 w-5" />
              Follow us on Instagram
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

function InstagramCard({ post, index }: { post: InstagramPost; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 bg-white border-0"
      style={{
        animationDelay: `${index * 100}ms`,
        animation: `fadeInScale 0.6s ease-out forwards ${index * 100}ms`,
        opacity: 0,
        transform: 'scale(0.9)'
      }}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={post.media_url}
          alt={truncateCaption(post.caption, 50)}
          fill
          className={`object-cover transition-all duration-300 ease-in-out group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
        />
        
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100 animate-pulse" />
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4 text-white">
            {post.caption && (
              <p className="text-sm font-medium mb-2 line-clamp-2">
                {truncateCaption(post.caption, 80)}
              </p>
            )}
            <div className="flex items-center justify-between text-xs">
              <span>{formatInstagramDate(post.timestamp)}</span>
              <div className="flex items-center">
                <Heart className="h-3 w-3 mr-1" />
                <Instagram className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Instagram badge */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Badge variant="secondary" className="bg-white/90 text-pink-700 hover:bg-white">
            <Instagram className="h-3 w-3 mr-1" />
            IG
          </Badge>
        </div>

        {/* Link overlay */}
        <a 
          href={post.permalink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0 z-10"
          aria-label={`View Instagram post: ${truncateCaption(post.caption, 50)}`}
        />
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </Card>
  )
}