"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  getAllPosts,
  getFeaturedImageUrl, 
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
      <div className="mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || trendingPosts.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200">Trending</h2>

      <div className="space-y-4">
        {trendingPosts.map((post) => (
          <TrendingCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

function TrendingCard({ post }: { post: WordPressPost }) {
  const imageUrl = getFeaturedImageUrl(post, 'thumbnail')
  const title = stripHtml(post.title.rendered)
  const date = formatDate(post.date)

  return (
    <div className="flex gap-3">
      <Link href={`/post/${post.slug}`} className="flex-shrink-0">
        <div className="relative h-20 w-20 overflow-hidden rounded">
          <Image 
            src={imageUrl || "/placeholder.svg"} 
            alt={title} 
            fill 
            className="object-cover" 
          />
        </div>
      </Link>

      <div>
        <Link href={`/post/${post.slug}`} className="block group">
          <h3 className="font-medium text-sm group-hover:text-yellow-600 line-clamp-2">{title}</h3>
        </Link>
        <div className="text-xs text-gray-500 mt-1">{date}</div>
      </div>
    </div>
  )
}