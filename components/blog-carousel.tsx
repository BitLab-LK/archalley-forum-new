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
        setVisiblePosts(1.3) // Show 1 full + partials on mobile
      } else if (window.innerWidth < 768) {
        setVisiblePosts(2.3) // Show 2 full + partials on small tablets
      } else if (window.innerWidth < 1024) {
        setVisiblePosts(3.3) // Show 3 full + partials on tablets
      } else if (window.innerWidth < 1280) {
        setVisiblePosts(4.4) // Show 4 full + partials on medium screens
      } else {
        setVisiblePosts(4.5) // Show 4 full + half cards on large desktop
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
      setCurrentIndex((prevIndex) => {
        // Move by 1 full card to maintain symmetric partial view
        return prevIndex + 1
      })
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
    <div className="relative bg-white py-12">
      <div className="w-full">
        <div className="flex items-center justify-between mb-8 px-6 max-w-[1600px] mx-auto">
          <h2 className="text-3xl font-bold">Latest Posts</h2>
        </div>

        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="overflow-hidden">
            {/* 
              Symmetric partial card positioning:
              - Transform offset (+10%) centers the cards
              - Padding (5% each side) ensures equal partials
              - Each scroll moves exactly 1 card to maintain balance
            */}
            <div
              className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
              style={{ 
                transform: `translateX(calc(-${currentIndex * (100 / visiblePosts)}% + 10%))`,
                paddingLeft: '5%',
                paddingRight: '5%'
              }}
            >
              {duplicatedPosts.map((post, index) => {
                const imageUrl = getFeaturedImageUrl(post, 'large')
                const category = getPostCategory(post)
                const title = stripHtml(post.title.rendered)
                const date = formatDate(post.date)

                return (
                  <div key={`${post.id}-${index}`} className="flex-shrink-0 px-1" style={{ width: `${100 / visiblePosts}%` }}>
                    <Link href={`/${post.slug}`} className="block group">
                      <div className="relative w-full overflow-hidden border-4 border-white shadow-xl hover:shadow-2xl transition-shadow duration-300" style={{ paddingBottom: '120%' }}>
                        <Image
                          src={imageUrl || "/placeholder.svg"}
                          alt={title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          priority={index < 5}
                        />
                        {/* Dark overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
                        
                        {/* Content overlay */}
                        <div className="absolute inset-0 flex flex-col justify-end p-6">
                          {/* Category Badge */}
                          <div className="mb-3">
                            <span className="inline-block px-4 py-2 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                              {decodeHtmlEntities(category.name)}
                            </span>
                          </div>
                          
                          {/* Title */}
                          <h3 className="font-bold text-2xl leading-tight line-clamp-2 mb-3 text-white drop-shadow-lg">
                            {title}
                          </h3>
                          
                          {/* Date */}
                          <div className="flex items-center text-sm text-white/95 font-medium">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            {date.toUpperCase()}
                          </div>
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
    </div>
  )
}
