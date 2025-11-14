"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  getPostsByCategory,
  getAllCategories,
  getFeaturedImageUrl, 
  cleanText,
  formatDate, 
  type WordPressPost,
  type WordPressCategory
} from "@/lib/wordpress-api"

interface NewsSectionProps {
  initialNews?: WordPressPost[]
  initialCategories?: WordPressCategory[]
}

export default function NewsSection({ initialNews = [], initialCategories = [] }: NewsSectionProps) {
  const [news, setNews] = useState<WordPressPost[]>(initialNews)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch news on client side if no initial data
  useEffect(() => {
    if (initialNews.length === 0 && initialCategories.length === 0) {
      fetchNewsData()
    }
  }, [initialNews.length, initialCategories.length])

  const fetchNewsData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // First fetch categories to find the news category ID
      const fetchedCategories = await getAllCategories()
      
      // Find the news category
      const newsCategoryId = fetchedCategories.find((cat) => cat.slug === "news")?.id || 0
      
      if (newsCategoryId > 0) {
        // Fetch news posts
        const fetchedNews = await getPostsByCategory(newsCategoryId, 1, 6)
        setNews(fetchedNews)
      } else {
        setError('News category not found')
      }
    } catch (err) {
      setError('Failed to load news')
      console.error('Error fetching news:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-24 mb-6"></div>
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-1/3 h-48 bg-gray-200 rounded"></div>
                <div className="w-2/3 space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || news.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center mb-6 pb-2">
        <h2 className="text-2xl font-bold mr-4 whitespace-nowrap">News</h2>
        <div className="flex-1 border-b-[5px] border-black"></div>
      </div>

      <div className="space-y-6">
        {news.map((newsItem) => (
          <NewsCard key={newsItem.id} news={newsItem} />
        ))}
      </div>
    </div>
  )
}

function NewsCard({ news }: { news: WordPressPost }) {
  const imageUrl = getFeaturedImageUrl(news, 'large')
  const title = cleanText(news.title.rendered)
  const excerpt = cleanText(news.excerpt.rendered)
  const date = formatDate(news.date)

  return (
    <div className="flex flex-col md:flex-row gap-4 border-b border-gray-200 pb-6">
      <div className="md:w-1/3">
        <Link href={`/${news.slug}`}>
          <div className="relative w-full overflow-hidden rounded" style={{ aspectRatio: '7/5' }}>
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        </Link>
      </div>

      <div className="md:w-2/3">
        <Link href={`/${news.slug}`} className="block group">
          <h3 className="text-xl font-semibold group-hover:[color:#FFA000]">{title}</h3>
        </Link>
        <div className="text-sm text-gray-500 mb-2">{date}</div>
        <p className="text-gray-700 mb-3">{excerpt.substring(0, 450)}...</p>
        <Link
          href={`/${news.slug}`}
          className="inline-block uppercase tracking-wider text-[11px] mt-[15px] px-[18px] py-[6px] border border-[#e0e0e0] transition-all duration-300 whitespace-nowrap text-[#1f2026] no-underline mb-[5px] hover:border-[#FFA000] hover:text-[#FFA000]"
          style={{ letterSpacing: '0.05em' }}
        >
          Read More
        </Link>
      </div>
    </div>
  )
}