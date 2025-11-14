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
  getPostCategory,
  decodeHtmlEntities,
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
      <div className="mb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col h-full border-b border-gray-200 pb-6">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
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
      </div>
    )
  }

  if (error || articles.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center mb-6 pb-2">
        <h2 className="text-2xl font-bold mr-4 whitespace-nowrap">Articles</h2>
        <div className="flex-1 border-b-[5px] border-black"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}

function ArticleCard({ article }: { article: WordPressPost }) {
  const imageUrl = getFeaturedImageUrl(article, 'large')
  const title = cleanText(article.title.rendered)
  const excerpt = cleanText(article.excerpt.rendered)
  const date = formatDate(article.date)
  const category = getPostCategory(article)

  return (
    <div className="flex flex-col h-full border-b border-gray-200 pb-6">
      <Link href={`/${article.slug}`}>
        <div className="relative w-full overflow-hidden mb-4" style={{ aspectRatio: '7/5' }}>
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
          {/* Category Badge - Top Left */}
          <div className="absolute top-0 left-0 p-2">
            <span className="inline-block px-2 py-1 text-white text-[10px] font-semibold uppercase tracking-wide shadow-md" style={{ backgroundColor: '#FFA000' }}>
              {decodeHtmlEntities(category.name)}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex-grow">
        <Link href={`/${article.slug}`} className="block group">
          <h3 className="text-lg font-semibold group-hover:[color:#FFA000]">{title}</h3>
        </Link>
        <div className="text-sm text-gray-500 mb-2">{date}</div>
        <p className="text-gray-700 mb-3 text-justify">{excerpt.substring(0, 450)}...</p>
      </div>

      <div className="mt-auto">
        <Link
          href={`/${article.slug}`}
          className="inline-block uppercase tracking-wider text-[11px] mt-[15px] px-[18px] py-[6px] border border-[#e0e0e0] transition-all duration-300 whitespace-nowrap text-[#1f2026] no-underline mb-[5px] hover:border-[#FFA000] hover:text-[#FFA000]"
          style={{ letterSpacing: '0.05em' }}
        >
          Read More
        </Link>
      </div>
    </div>
  )
}