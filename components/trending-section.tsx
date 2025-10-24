"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink, TrendingUp } from "lucide-react"
import { 
  getAllPosts,
  getFeaturedImageUrl, 
  getFeaturedImageAlt, 
  getPostCategory,
  stripHtml, 
  formatDate,
  type WordPressPost
} from "@/lib/wordpress-api"

interface TrendingSectionProps {
  initialPosts?: WordPressPost[]
}

export default function TrendingSection({ initialPosts = [] }: TrendingSectionProps) {
  const [trendingPosts, setTrendingPosts] = useState<WordPressPost[]>(initialPosts)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const fetchedPosts = await getAllPosts(1, 4)
      setTrendingPosts(fetchedPosts)
    } catch (err) {
      setError('Failed to load trending posts')
      console.error('Error fetching trending posts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-semibold">Trending Now</h3>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex space-x-3">
              <div className="bg-gray-200 w-16 h-16 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || trendingPosts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-semibold">Trending Now</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm mb-4">
            {error || "No trending posts available."}
          </p>
          <Button onClick={fetchTrendingPosts} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <TrendingUp className="h-5 w-5 text-primary mr-2" />
        <h3 className="text-lg font-semibold">Trending Now</h3>
      </div>
      
      <div className="space-y-4">
        {trendingPosts.map((post, index) => (
          <TrendingCard key={post.id} post={post} index={index} />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t">
        <Button 
          asChild 
          variant="ghost" 
          size="sm" 
          className="w-full text-primary hover:text-primary/80"
        >
          <a href="https://archalley.com/blog" target="_blank" rel="noopener noreferrer">
            View All Posts
            <ExternalLink className="ml-2 h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  )
}

function TrendingCard({ post, index }: { post: WordPressPost; index: number }) {
  const category = getPostCategory(post)
  const imageUrl = getFeaturedImageUrl(post, 'thumbnail')
  const imageAlt = getFeaturedImageAlt(post)
  const title = stripHtml(post.title.rendered)
  const formattedDate = formatDate(post.date)

  // Truncate title for compact display
  const truncatedTitle = title.length > 60 ? title.substring(0, 60) + '...' : title

  return (
    <a 
      href={post.link} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block group"
      style={{
        animationDelay: `${index * 100}ms`,
        animation: `slideInRight 0.4s ease-out forwards ${index * 100}ms`,
        opacity: 0,
        transform: 'translateX(20px)'
      }}
    >
      <div className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
        {/* Thumbnail */}
        <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="64px"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category Badge */}
          <div className="mb-1">
            <Badge 
              variant="outline" 
              className="text-xs px-2 py-0 h-5 text-muted-foreground border-muted-foreground/20"
            >
              {category.name}
            </Badge>
          </div>

          {/* Title */}
          <h4 className="font-medium text-sm leading-tight mb-1 group-hover:text-primary transition-colors duration-200">
            {truncatedTitle}
          </h4>

          {/* Date */}
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {formattedDate}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </a>
  )
}