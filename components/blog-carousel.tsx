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
  
  // Mouse drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

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

  // Update visible posts based on screen size - showing 1/4 partials on both sides
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisiblePosts(1) // Show 1 full slide on mobile
        setIsMobile(true)
      } else {
        setIsMobile(false)
        if (window.innerWidth < 768) {
          setVisiblePosts(2.3) // Show 2 full + partials on small tablets
        } else if (window.innerWidth < 1024) {
          setVisiblePosts(3.5) // Show 3 full + partials on tablets
        } else {
          setVisiblePosts(4.8) // Show 4-5 full + partials on all larger screens
        }
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Auto-play carousel with infinite scroll - always move by 1 post
  useEffect(() => {
    if (posts.length === 0) return

    // Always auto-play, moving by 1 post at a time
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prevIndex) => {
          // Move by 1 full card to maintain symmetric partial view
          return prevIndex + 1
        })
      }
    }, autoPlayInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [posts.length, autoPlayInterval, isPaused])

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

  // Mouse drag handlers
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const diff = e.clientX - dragStart
      setDragOffset(diff)
    }

    const handleGlobalMouseUp = () => {
      if (!isDragging) return
      
      setIsDragging(false)
      setIsTransitioning(true)
      
      // Calculate how many posts to move based on drag distance
      if (carouselRef.current) {
        const cardWidth = carouselRef.current.offsetWidth / visiblePosts
        const threshold = cardWidth * 0.3 // 30% of card width to trigger slide
        
        if (Math.abs(dragOffset) > threshold) {
          if (dragOffset > 0) {
            // Dragged right, go to previous
            setCurrentIndex((prev) => Math.max(0, prev - 1))
          } else {
            // Dragged left, go to next
            setCurrentIndex((prev) => prev + 1)
          }
        }
      }
      
      setDragOffset(0)
      setIsPaused(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, dragStart, dragOffset, visiblePosts])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart(e.clientX)
    setDragOffset(0)
    setIsTransitioning(false)
    setIsPaused(true)
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

  // Calculate transform with partials and drag offset
  const getTransform = () => {
    if (!carouselRef.current) return 'translateX(0)'
    
    const containerWidth = carouselRef.current.offsetWidth
    
    // On mobile, show only full slide with no offset
    if (isMobile) {
      const dragTransform = dragOffset ? (dragOffset / containerWidth) * 100 : 0
      return `translateX(calc(-${currentIndex * 100}% + ${dragTransform}%))`
    }
    
    // Desktop: show partials with centering
    const cardWidthPercent = 100 / visiblePosts
    const baseTransform = -(currentIndex * cardWidthPercent)
    const centerOffset = (100 - cardWidthPercent) / 2
    const dragTransform = dragOffset ? (dragOffset / containerWidth) * 100 : 0
    
    return `translateX(calc(${baseTransform}% + ${centerOffset}% + ${dragTransform}%))`
  }

  return (
    <div className="relative bg-white py-12 overflow-x-hidden">
      <div className="container mx-auto px-4">
        <div 
          className="relative flex justify-center"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            ref={carouselRef}
            className="overflow-hidden w-full max-w-full cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
          >
            {/* 
              Slide by 1 full post at a time with partials visible:
              - Padding shows partials from first and last slides
              - Transform calculation centers the visible posts
              - Drag offset allows smooth dragging
            */}
            <div
              className={`flex ${isTransitioning && !isDragging ? 'transition-transform duration-500 ease-in-out' : ''}`}
              style={{ 
                transform: getTransform(),
                paddingLeft: isMobile ? '0' : `${100 / (visiblePosts * 4)}%`,
                paddingRight: isMobile ? '0' : `${100 / (visiblePosts * 4)}%`,
                gap: isMobile ? '0' : '5px'
              }}
            >
              {duplicatedPosts.map((post, index) => {
                const imageUrl = getFeaturedImageUrl(post, 'large')
                const category = getPostCategory(post)
                const title = stripHtml(post.title.rendered)
                const date = formatDate(post.date)

                return (
                  <div key={`${post.id}-${index}`} className="flex-shrink-0" style={{ width: `${100 / visiblePosts}%` }}>
                    <Link 
                      href={`/${post.slug}`} 
                      className="block group"
                      onClick={(e) => {
                        if (isDragging || Math.abs(dragOffset) > 10) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <div className="relative w-full overflow-hidden border-4 border-white shadow-xl hover:shadow-2xl transition-shadow duration-300" style={{ aspectRatio: isMobile ? '325/450' : '9/12' }}>
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
                          <div className="mb-2">
                            <span className="inline-block px-2 py-1 text-white text-[10px] font-semibold uppercase tracking-wide shadow-md" style={{ backgroundColor: '#FFA000' }}>
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
