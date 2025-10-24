"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { fetchInstagramPosts, truncateCaption, type InstagramPost } from "@/app/actions/instagram"
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
      <section className="py-6 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Instagram</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-800 aspect-square rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || posts.length === 0) {
    return (
      <section className="py-6 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Instagram</h2>
            <Button onClick={fetchPosts} variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              Try Again
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-6 bg-white/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Minimal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Instagram</h2>
          <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800">
            <a href={SOCIAL_MEDIA.instagram} target="_blank" rel="noopener noreferrer">
              View All →
            </a>
          </Button>
        </div>

        {/* Minimal Instagram Grid */}
        <div className="relative">
          {/* Subtle Navigation */}
          {posts.length > postsPerView && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevSlide}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-white/60 hover:bg-white/80 shadow-sm rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextSlide}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-white/60 hover:bg-white/80 shadow-sm rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Clean Posts Grid */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-out gap-3"
              style={{ transform: `translateX(-${currentIndex * (100 / postsPerView)}%)` }}
            >
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="flex-shrink-0"
                  style={{ width: `calc(${100 / postsPerView}% - ${12 * (postsPerView - 1) / postsPerView}px)` }}
                >
                  <InstagramCard post={post} />
                </div>
              ))}
            </div>
          </div>

          {/* Minimal Dots */}
          {posts.length > postsPerView && (
            <div className="flex justify-center mt-4 space-x-1">
              {Array.from({ length: Math.ceil((posts.length - postsPerView + 1)) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    index === currentIndex ? 'bg-pink-500 w-6' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function InstagramCard({ post }: { post: InstagramPost }) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={post.media_url}
          alt={truncateCaption(post.caption, 50)}
          fill
          className={`object-cover transition-all duration-200 ease-out group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
        />
        
        {/* Simple loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        )}
        
        {/* Minimal overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        </div>

        {/* Link overlay */}
        <a 
          href={post.permalink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0 z-10"
          aria-label={`View Instagram post`}
        />
      </div>
    </div>
  )
}