"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink, User, Clock } from "lucide-react"
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

interface ArticlesSectionProps {
  initialArticles?: WordPressPost[]
  initialCategories?: WordPressCategory[]
}

export default function ArticlesSection({ initialArticles = [], initialCategories = [] }: ArticlesSectionProps) {
  const [articles, setArticles] = useState<WordPressPost[]>(initialArticles)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch articles on client side if no initial data
  useEffect(() => {
    if (initialArticles.length === 0 && initialCategories.length === 0) {
      fetchArticlesData()
    }
  }, [initialArticles.length, initialCategories.length])

  const fetchArticlesData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // First fetch categories to find the articles category ID
      const fetchedCategories = await getAllCategories()
      
      // Find the articles category
      const articlesCategoryId = fetchedCategories.find((cat) => cat.slug === "articles")?.id || 0
      
      if (articlesCategoryId > 0) {
        // Fetch article posts
        const fetchedArticles = await getPostsByCategory(articlesCategoryId, 1, 6)
        setArticles(fetchedArticles)
      } else {
        setError('Articles category not found')
      }
    } catch (err) {
      setError('Failed to load articles')
      console.error('Error fetching articles:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-secondary/5 to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Expert Articles</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[16/9] rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || articles.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-secondary/5 to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Expert Articles</h2>
          <p className="text-muted-foreground mb-8">
            {error || "No articles available at the moment."}
          </p>
          <Button onClick={fetchArticlesData} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-br from-secondary/5 to-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Expert Articles
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            In-depth insights, analysis, and expertise from leading professionals in architecture and design.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {articles.map((article, index) => (
            <ArticleCard key={article.id} article={article} index={index} />
          ))}
        </div>

        {/* View All Articles Link */}
        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/articles">
              View All Articles
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function ArticleCard({ article, index }: { article: WordPressPost; index: number }) {
  const imageUrl = getFeaturedImageUrl(article, 'medium')
  const imageAlt = getFeaturedImageAlt(article)
  const title = stripHtml(article.title.rendered)
  const excerpt = getPostExcerpt(article, 140)
  const formattedDate = formatDate(article.date)

  // Calculate reading time (rough estimate: 200 words per minute)
  const wordCount = stripHtml(article.content.rendered).split(' ').length
  const readingTime = Math.ceil(wordCount / 200)

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0"
      style={{
        animationDelay: `${index * 150}ms`,
        animation: `slideInLeft 0.6s ease-out forwards ${index * 150}ms`,
        opacity: 0,
        transform: 'translateX(-30px)'
      }}
    >
      <div className="flex flex-col h-full">
        {/* Article Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          
          {/* Article Badge */}
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-white/90 text-gray-900 hover:bg-white">
              Article
            </Badge>
          </div>

          {/* Reading Time */}
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="bg-white/90 text-gray-700 border-white/50">
              <Clock className="h-3 w-3 mr-1" />
              {readingTime} min read
            </Badge>
          </div>
        </div>

        {/* Article Content */}
        <CardContent className="p-6 flex-grow flex flex-col">
          {/* Date and Author */}
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <Calendar className="h-4 w-4 mr-2" />
            {formattedDate}
            <span className="mx-2">•</span>
            <User className="h-4 w-4 mr-1" />
            Expert
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-tight">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="text-muted-foreground text-sm mb-4 line-clamp-4 leading-relaxed flex-grow">
            {excerpt}
          </p>

          {/* Read More Link */}
          <div className="mt-auto">
            <Button 
              asChild 
              variant="ghost" 
              size="sm" 
              className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
            >
              <a 
                href={article.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center group/link"
              >
                Read Full Article
                <ExternalLink className="ml-2 h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" />
              </a>
            </Button>
          </div>
        </CardContent>
      </div>

      <style jsx>{`
        @keyframes slideInLeft {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </Card>
  )
}