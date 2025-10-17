"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Calendar, ExternalLink, Search, Clock, Loader2 } from "lucide-react"
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

interface NewsPageClientProps {
  initialNews?: WordPressPost[]
  initialCategories?: WordPressCategory[]
}

export default function NewsPageClient({ initialNews = [], initialCategories = [] }: NewsPageClientProps) {
  const [news, setNews] = useState<WordPressPost[]>(initialNews)
  const [categories, setCategories] = useState<WordPressCategory[]>(initialCategories)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedNews, setSelectedNews] = useState<WordPressPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      setCategories(fetchedCategories)
      
      // Find the news category
      const newsCategoryId = fetchedCategories.find((cat) => cat.slug === "news")?.id || 0
      
      if (newsCategoryId > 0) {
        // Fetch news posts
        const fetchedNews = await getPostsByCategory(newsCategoryId, 1, 20)
        setNews(fetchedNews)
        setCurrentPage(1) // Reset to first page
        setHasMore(fetchedNews.length === 20)
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

  const loadMoreNews = async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      // Add small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const newsCategoryId = categories.find((cat) => cat.slug === "news")?.id || 0
      if (newsCategoryId > 0) {
        const nextPage = currentPage + 1
        const moreNews = await getPostsByCategory(newsCategoryId, nextPage, 10)
        
        if (moreNews.length > 0) {
          // Deduplicate posts by ID to prevent duplicate keys
          setNews(prev => {
            const existingIds = new Set(prev.map(post => post.id))
            const newPosts = moreNews.filter(post => !existingIds.has(post.id))
            return [...prev, ...newPosts]
          })
          setCurrentPage(nextPage)
          setHasMore(moreNews.length === 10)
        } else {
          setHasMore(false)
        }
      }
    } catch (err) {
      console.error('Error loading more news:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter news based on search term
  const filteredNews = news.filter(item => {
    const matchesSearch = searchTerm === "" || 
      stripHtml(item.title.rendered).toLowerCase().includes(searchTerm.toLowerCase()) ||
      stripHtml(item.excerpt.rendered).toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (isLoading && news.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">News</h1>
            </div>
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && news.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">News</h1>
          </div>
          <p className="text-muted-foreground mb-8 text-lg">{error}</p>
          <Button onClick={fetchNewsData} variant="ghost" className="rounded-full">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Minimalistic */}
        <div className="text-center mb-16" 
             style={{
               animation: 'fadeInUp 0.8s ease-out forwards',
               opacity: 0,
               transform: 'translateY(30px)'
             }}>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            News
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Latest updates in architecture and design
          </p>
        </div>

        {/* Search Bar - Minimalistic */}
        <div className="max-w-2xl mx-auto mb-16"
             style={{
               animation: 'fadeInUp 0.8s ease-out forwards 0.2s',
               opacity: 0,
               transform: 'translateY(30px)'
             }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 text-base border-0 bg-muted/30 rounded-full focus:bg-background transition-all duration-300"
            />
          </div>
        </div>

        {/* Results Count */}
        {searchTerm && (
          <div className="text-center mb-12"
               style={{
                 animation: 'fadeIn 0.5s ease-out forwards',
                 opacity: 0
               }}>
            <p className="text-sm text-muted-foreground">
              {filteredNews.length} article{filteredNews.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}

        {/* News Grid - Minimalistic Layout */}
        {filteredNews.length > 0 && (
          <div className="space-y-8">
            {filteredNews.map((item, index) => (
              <NewsCard 
                key={`news-${item.id}-${index}`} 
                news={item} 
                index={index}
                onReadMore={(newsItem) => {
                  setSelectedNews(newsItem)
                  setIsModalOpen(true)
                }}
              />
            ))}
          </div>
        )}

        {/* Loading skeleton for additional content */}
        {isLoading && news.length > 0 && (
          <div className="space-y-8 mt-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse bg-muted/30 border-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                  <div className="aspect-[16/10] md:aspect-[4/3] bg-muted/50"></div>
                  <div className="md:col-span-2 p-8">
                    <div className="h-4 bg-muted/50 rounded w-32 mb-4"></div>
                    <div className="h-8 bg-muted/50 rounded w-3/4 mb-4"></div>
                    <div className="space-y-2 mb-6">
                      <div className="h-4 bg-muted/50 rounded w-full"></div>
                      <div className="h-4 bg-muted/50 rounded w-2/3"></div>
                    </div>
                    <div className="h-4 bg-muted/50 rounded w-24"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredNews.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? `No articles found for "${searchTerm}"` : 'No news articles available'}
            </p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !searchTerm && filteredNews.length > 0 && (
          <div className="text-center mt-16">
            <Button 
              onClick={loadMoreNews} 
              variant="ghost" 
              size="lg"
              disabled={isLoading}
              className="hover:bg-muted/50 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}

        {/* Newsletter Signup - Minimalistic */}
        <div className="mt-24">
          <div className="text-center py-16 border-t border-border/50">
            <h3 className="text-2xl font-semibold mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join our community for the latest news and insights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
              <Button asChild variant="default" className="rounded-full">
                <Link href="/forum">Join Community</Link>
              </Button>
              <Button variant="outline" asChild className="rounded-full">
                <Link href="/auth/register">Subscribe</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* News Article Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 border-0 bg-white/95 backdrop-blur-sm">
          {selectedNews && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{stripHtml(selectedNews.title.rendered)}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[85vh] modal-content">
                {/* Featured Image */}
                <div className="relative aspect-[16/8] overflow-hidden">
                <Image
                  src={getFeaturedImageUrl(selectedNews, 'large')}
                  alt={getFeaturedImageAlt(selectedNews)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-6 lg:p-8">
                {/* Title */}
                <h1 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight text-foreground">
                  {stripHtml(selectedNews.title.rendered)}
                </h1>

                {/* Meta Info */}
                <div className="flex items-center mb-6 pb-4 border-b border-border/20">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{formatDate(selectedNews.date)}</span>
                </div>

                {/* Content */}
                <div 
                  className="prose prose-base max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground/85 prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-strong:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80 hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md prose-blockquote:border-primary/30 prose-blockquote:bg-muted/30 prose-blockquote:rounded-lg prose-blockquote:py-3 prose-ul:text-foreground/85 prose-ol:text-foreground/85 prose-li:mb-1"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedNews.content.rendered 
                  }}
                />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slideInUp 0.8s ease-out forwards;
          opacity: 0;
          transform: translateY(40px);
        }
        
        /* Custom scrollbar for modal content */
        .modal-content::-webkit-scrollbar {
          width: 6px;
        }
        .modal-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-content::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .modal-content::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        
        /* Enhanced prose styling for modal */
        .prose img {
          margin: 1.5rem auto;
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .prose h1, .prose h2, .prose h3 {
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .prose p {
          font-size: 1rem;
          line-height: 1.65;
        }
      `}</style>
    </div>
  )
}

function NewsCard({ 
  news, 
  index, 
  onReadMore 
}: { 
  news: WordPressPost; 
  index: number;
  onReadMore: (news: WordPressPost) => void;
}) {
  const imageUrl = getFeaturedImageUrl(news, 'large')
  const imageAlt = getFeaturedImageAlt(news)
  const title = stripHtml(news.title.rendered)
  const excerpt = getPostExcerpt(news, 150)
  const formattedDate = formatDate(news.date)

  // Calculate time ago for recent news feel
  const publishDate = new Date(news.date)
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60))
  const timeAgo = diffHours < 24 ? `${diffHours}h ago` : diffHours < 48 ? '1 day ago' : formattedDate

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-500 ease-in-out hover:-translate-y-1 bg-white/50 backdrop-blur-sm border-0 overflow-hidden animate-slide-in"
      style={{
        animationDelay: `${Math.min(index * 150, 1000)}ms`, // Cap delay at 1000ms
      } as React.CSSProperties}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Image */}
        <div className="relative aspect-[16/10] md:aspect-[4/3] overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          
          {/* Time Badge */}
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-black/70 text-white border-0 backdrop-blur-sm">
              <Clock className="h-3 w-3 mr-1" />
              {timeAgo}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-2 p-8">
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4 mr-2" />
            {formattedDate}
          </div>

          <h3 className="text-2xl font-bold mb-4 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
            {title}
          </h3>

          <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed text-base">
            {excerpt}
          </p>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onReadMore(news)}
            className="p-0 h-auto text-primary hover:text-primary/80 font-medium group/link"
          >
            <span className="inline-flex items-center">
              Read More
              <ExternalLink className="ml-2 h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" />
            </span>
          </Button>
        </div>
      </div>
    </Card>
  )
}