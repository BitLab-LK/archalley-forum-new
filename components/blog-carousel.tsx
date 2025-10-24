"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, ExternalLink } from "lucide-react"
import { 
  getAllPosts, 
  getFeaturedImageUrl, 
  getFeaturedImageAlt, 
  getPostCategory, 
  stripHtml, 
  formatDate, 
  getPostExcerpt,
  type WordPressPost 
} from "@/lib/wordpress-api"

interface BlogCarouselProps {
  initialPosts?: WordPressPost[]
}

export default function BlogCarousel({ initialPosts = [] }: BlogCarouselProps) {
  const [posts, setPosts] = useState<WordPressPost[]>(initialPosts)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setCurrentIndex((prevIndex) => 
      prevIndex + 1 >= posts.length ? 0 : prevIndex + 1
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex - 1 < 0 ? posts.length - 1 : prevIndex - 1
    )
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Auto-play functionality
  useEffect(() => {
    if (posts.length > 1) {
      const interval = setInterval(nextSlide, 5000) // Change slide every 5 seconds
      return () => clearInterval(interval)
    }
    return undefined
  }, [posts.length])

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest Architecture Insights</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-video rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || posts.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest Architecture Insights</h2>
          <p className="text-muted-foreground mb-8">
            {error || "No blog posts available at the moment."}
          </p>
          <Button onClick={fetchPosts} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Latest Architecture Insights
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the latest trends, projects, and innovations in architecture from our expert contributors.
          </p>
        </div>

        {/* Desktop Grid View (lg+) */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6 mb-8">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {/* Tablet Grid View (md) */}
        <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-6 mb-8">
          {posts.slice(0, 2).map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {/* Mobile Carousel View (sm and below) */}
        <div className="md:hidden relative">
          <div className="overflow-hidden rounded-xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {posts.map((post) => (
                <div key={post.id} className="w-full flex-shrink-0">
                  <BlogCard post={post} />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex space-x-2">
              {posts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View All Posts Link */}
        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg">
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

function BlogCard({ post }: { post: WordPressPost }) {
  const category = getPostCategory(post)
  const imageUrl = getFeaturedImageUrl(post, 'large')
  const imageAlt = getFeaturedImageAlt(post)
  const title = stripHtml(post.title.rendered)
  const excerpt = getPostExcerpt(post, 120)
  const formattedDate = formatDate(post.date)

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/90 text-gray-900 hover:bg-white">
            {category.name}
          </Badge>
        </div>

        {/* Date */}
        <div className="absolute bottom-4 left-4 flex items-center text-white text-sm">
          <Calendar className="h-4 w-4 mr-2" />
          {formattedDate}
        </div>
      </div>

      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {excerpt}
        </p>
        <Button asChild variant="ghost" size="sm" className="p-0 h-auto text-primary">
          <a 
            href={post.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center"
          >
            Read More
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}