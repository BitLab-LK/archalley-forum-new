"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink, Newspaper, Clock, MapPin } from "lucide-react"
import { 
  getPostsByCategory,
  getAllCategories,
  getFeaturedImageUrl, 
  getFeaturedImageAlt, 
  stripHtml, 
  formatDate, 
  getPostExcerpt,
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
      <section className="py-16 bg-gradient-to-br from-blue-50/50 to-indigo-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest News</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
          
          {/* Featured News Skeleton */}
          <div className="mb-12">
            <div className="animate-pulse">
              <div className="bg-gray-200 aspect-[2/1] rounded-xl mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>

          {/* Other News Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[3/2] rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || news.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50/50 to-indigo-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest News</h2>
          <p className="text-muted-foreground mb-8">
            {error || "No news available at the moment."}
          </p>
          <Button onClick={fetchNewsData} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    )
  }

  // Split news into featured (first) and other news
  const featuredNews = news[0]
  const otherNews = news.slice(1)

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50/50 to-indigo-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Latest News
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest developments, trends, and breaking news in architecture and design.
          </p>
        </div>

        {/* Featured News */}
        {featuredNews && (
          <div className="mb-12">
            <FeaturedNewsCard news={featuredNews} />
          </div>
        )}

        {/* Other News Grid */}
        {otherNews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {otherNews.map((newsItem, index) => (
              <NewsCard key={newsItem.id} news={newsItem} index={index + 1} />
            ))}
          </div>
        )}

        {/* View All News Link */}
        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/news">
              View All News
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function FeaturedNewsCard({ news }: { news: WordPressPost }) {
  const imageUrl = getFeaturedImageUrl(news, 'large')
  const imageAlt = getFeaturedImageAlt(news)
  const title = stripHtml(news.title.rendered)
  const excerpt = getPostExcerpt(news, 200)
  const formattedDate = formatDate(news.date)

  return (
    <Card 
      className="group overflow-hidden hover:shadow-xl transition-all duration-500 ease-in-out bg-white border-0"
      style={{
        animation: 'fadeInUp 0.8s ease-out forwards',
        opacity: 0,
        transform: 'translateY(30px)'
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Image */}
        <div className="relative aspect-[2/1] lg:aspect-auto overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          
          {/* Breaking News Badge */}
          <div className="absolute top-6 left-6">
            <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 px-3 py-1">
              <Newspaper className="h-3 w-3 mr-1" />
              BREAKING
            </Badge>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4 mr-2" />
            {formattedDate}
            <span className="mx-3">•</span>
            <MapPin className="h-4 w-4 mr-1" />
            Architecture News
          </div>

          <h3 className="text-2xl lg:text-3xl font-bold mb-4 line-clamp-3 group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>

          <p className="text-muted-foreground mb-6 line-clamp-4 leading-relaxed">
            {excerpt}
          </p>

          <Button 
            asChild 
            variant="default"
            size="lg"
            className="self-start"
          >
            <a 
              href={news.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              Read Full Story
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  )
}

function NewsCard({ news, index }: { news: WordPressPost; index: number }) {
  const imageUrl = getFeaturedImageUrl(news, 'medium')
  const imageAlt = getFeaturedImageAlt(news)
  const title = stripHtml(news.title.rendered)
  const excerpt = getPostExcerpt(news, 120)
  const formattedDate = formatDate(news.date)

  // Calculate time ago for recent news feel
  const publishDate = new Date(news.date)
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60))
  const timeAgo = diffHours < 24 ? `${diffHours}h ago` : formattedDate

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 bg-white/90 backdrop-blur-sm border-0"
      style={{
        animationDelay: `${index * 200}ms`,
        animation: `slideInUp 0.6s ease-out forwards ${index * 200}ms`,
        opacity: 0,
        transform: 'translateY(20px)'
      }}
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        
        {/* News Badge */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700 border-0">
            News
          </Badge>
        </div>

        {/* Time Badge */}
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="bg-white/90 text-gray-700 border-white/50">
            <Clock className="h-3 w-3 mr-1" />
            {timeAgo}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Calendar className="h-4 w-4 mr-2" />
          {formattedDate}
        </div>

        <h4 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-tight">
          {title}
        </h4>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
          {excerpt}
        </p>

        <Button 
          asChild 
          variant="ghost" 
          size="sm" 
          className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
        >
          <a 
            href={news.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center group/link"
          >
            Read More
            <ExternalLink className="ml-2 h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" />
          </a>
        </Button>
      </CardContent>

      <style jsx>{`
        @keyframes slideInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  )
}