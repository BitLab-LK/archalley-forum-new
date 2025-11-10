"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  getAllPosts, 
  getFeaturedImageUrl, 
  getPostCategory, 
  stripHtml, 
  formatDate,
  decodeHtmlEntities,
  type WordPressPost 
} from "@/lib/wordpress-api"

interface BlogCarouselProps {
  initialPosts?: WordPressPost[]
  autoPlayInterval?: number // in milliseconds
}

export default function BlogCarousel({ initialPosts = [], autoPlayInterval = 3000 }: BlogCarouselProps) {
  const [posts, setPosts] = useState<WordPressPost[]>(initialPosts)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visiblePosts, setVisiblePosts] = useState(4)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Create duplicated posts for infinite scroll
  const duplicatedPosts = posts.length > 0 ? [...posts, ...posts, ...posts] : []

  // Fetch posts on client side if no initial data
  useEffect(() => {
    if (initialPosts.length === 0) {
      fetchPosts()
    } else {
      // Start from the middle set of duplicated posts
      setCurrentIndex(posts.length)
    }
  }, [initialPosts.length])

  // Update visible posts based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisiblePosts(1)
      } else if (window.innerWidth < 768) {
        setVisiblePosts(2)
      } else if (window.innerWidth < 1024) {
        setVisiblePosts(3)
      } else {
        setVisiblePosts(4)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Auto-play carousel with infinite scroll
  useEffect(() => {
    if (posts.length === 0 || isPaused) return

    // Only auto-play if there are more posts than visible
    if (posts.length <= visiblePosts) return

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1)
    }, autoPlayInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [posts.length, visiblePosts, autoPlayInterval, isPaused])

  // Reset position when reaching the end of duplicated posts (infinite loop)
  useEffect(() => {
    if (posts.length === 0) return

    // If we've scrolled to the last set, instantly jump back to middle set without animation
    if (currentIndex >= posts.length * 2) {
      setIsTransitioning(false)
      setTimeout(() => {
        setCurrentIndex(posts.length)
        setTimeout(() => {
          setIsTransitioning(true)
        }, 50)
      }, 50)
    }
    
    // If we've scrolled before the first set, instantly jump to middle set without animation
    if (currentIndex < posts.length) {
      setIsTransitioning(false)
      setTimeout(() => {
        setCurrentIndex(posts.length + currentIndex)
        setTimeout(() => {
          setIsTransitioning(true)
        }, 50)
      }, 50)
    }
  }, [currentIndex, posts.length])

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  const fetchPosts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedPosts = await getAllPosts(1, 12)
      setPosts(fetchedPosts)
      // Start from the middle set after fetching
      setCurrentIndex(fetchedPosts.length)
    } catch (err) {
      setError('Failed to load blog posts')
      console.error('Error fetching posts:', err)
    } finally {
      setIsLoading(false)
    }
  }



  if (isLoading) {
    return (
      <div className="relative bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[375px] bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || posts.length === 0) {
    return null
  }

  return (
    <div className="relative bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Latest Posts</h2>
        </div>

        <div 
          className="relative overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
            style={{ transform: `translateX(-${currentIndex * (100 / visiblePosts)}%)` }}
          >
            {duplicatedPosts.map((post, index) => {
              const imageUrl = getFeaturedImageUrl(post, 'large')
              const category = getPostCategory(post)
              const title = stripHtml(post.title.rendered)
              const date = formatDate(post.date)

              return (
                <div key={`${post.id}-${index}`} className="flex-shrink-0 px-2" style={{ width: `${100 / visiblePosts}%` }}>
                  <Link href={`/${post.slug}`} className="block group">
                    <div className="relative h-[375px] w-full overflow-hidden">
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                        <div className="text-yellow-400 text-sm">{decodeHtmlEntities(category.name)}</div>
                        <h3 className="font-bold text-lg line-clamp-2">{title}</h3>
                        <div className="text-sm text-gray-300 mt-1">{date}</div>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
