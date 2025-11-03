"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { 
  getAllPosts, 
  getFeaturedImageUrl, 
  getPostCategory, 
  stripHtml, 
  formatDate, 
  type WordPressPost 
} from "@/lib/wordpress-api"

interface BlogCarouselProps {
  initialPosts?: WordPressPost[]
}

export default function BlogCarousel({ initialPosts = [] }: BlogCarouselProps) {
  const [posts, setPosts] = useState<WordPressPost[]>(initialPosts)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visiblePosts, setVisiblePosts] = useState(4)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch posts on client side if no initial data
  useEffect(() => {
    if (initialPosts.length === 0) {
      fetchPosts()
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

  const fetchPosts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedPosts = await getAllPosts(1, 4)
      setPosts(fetchedPosts)
    } catch (err) {
      setError('Failed to load blog posts')
      console.error('Error fetching posts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + visiblePosts >= posts.length ? 0 : prevIndex + visiblePosts))
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - visiblePosts < 0 ? Math.max(0, posts.length - visiblePosts) : prevIndex - visiblePosts,
    )
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
          <div className="flex space-x-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-black text-white hover:bg-gray-800"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-black text-white hover:bg-gray-800"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / visiblePosts)}%)` }}
          >
            {posts.map((post) => {
              const imageUrl = getFeaturedImageUrl(post, 'large')
              const category = getPostCategory(post)
              const title = stripHtml(post.title.rendered)
              const date = formatDate(post.date)

              return (
                <div key={post.id} className="flex-shrink-0 px-2" style={{ width: `${100 / visiblePosts}%` }}>
                  <Link href={`/${post.slug}`} className="block group">
                    <div className="relative h-[375px] w-full overflow-hidden">
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                        <div className="text-yellow-400 text-sm">{category.name}</div>
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
