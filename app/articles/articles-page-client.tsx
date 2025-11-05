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
  cleanText,
  formatDate, 
  getPostExcerpt,
  type WordPressPost,
  type WordPressCategory
} from "@/lib/wordpress-api"
import AdBannerComponent from "@/components/ad-banner"
import SidebarYouTube from "@/components/sidebar-youtube"
import SidebarFacebook from "@/components/sidebar-facebook"

interface ArticlesPageClientProps {
  initialArticles?: WordPressPost[]
  initialCategories?: WordPressCategory[]
}

export default function ArticlesPageClient({ initialArticles = [], initialCategories = [] }: ArticlesPageClientProps) {
  const [articles, setArticles] = useState<WordPressPost[]>(initialArticles)
  const [categories, setCategories] = useState<WordPressCategory[]>(initialCategories)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialArticles.length >= 20) // Set based on initial data
  const [selectedArticle, setSelectedArticle] = useState<WordPressPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showAnimations, setShowAnimations] = useState(false)

  // Trigger animations when component mounts or data loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimations(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Reset animations when search changes
  useEffect(() => {
    if (searchTerm) {
      setShowAnimations(false)
      const timer = setTimeout(() => {
        setShowAnimations(true)
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setShowAnimations(true)
      return () => {} // Return empty cleanup function
    }
  }, [searchTerm])

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
      setCategories(fetchedCategories)
      
      // Find the articles category
      const articlesCategory = fetchedCategories.find((cat) => 
        cat.slug.toLowerCase().includes('article') || 
        cat.name.toLowerCase().includes('article')
      )
      
      if (articlesCategory) {
        // Fetch articles posts
        const fetchedArticles = await getPostsByCategory(articlesCategory.id, 1, 20)
        setArticles(fetchedArticles)
        setCurrentPage(1) // Reset to first page
        setHasMore(fetchedArticles.length === 20)
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

  const loadMoreArticles = async () => {
    console.log('Load more clicked - Current page:', currentPage, 'Has more:', hasMore, 'Categories:', categories.length)
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      // Add small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Find the articles category - if not found in current categories, fetch them again
      let articlesCategory = categories.find((cat) => 
        cat.slug.toLowerCase().includes('article') || 
        cat.name.toLowerCase().includes('article')
      )
      
      // If categories is empty or no articles category found, fetch categories again
      if (!articlesCategory || categories.length === 0) {
        console.log('Fetching categories because not found or empty')
        const fetchedCategories = await getAllCategories()
        setCategories(fetchedCategories)
        articlesCategory = fetchedCategories.find((cat) => 
          cat.slug.toLowerCase().includes('article') || 
          cat.name.toLowerCase().includes('article')
        )
      }
      
      if (articlesCategory) {
        const nextPage = currentPage + 1
        console.log('Fetching page:', nextPage, 'for category:', articlesCategory.name)
        const moreArticles = await getPostsByCategory(articlesCategory.id, nextPage, 10)
        
        if (moreArticles.length > 0) {
          console.log('Loaded', moreArticles.length, 'more articles')
          // Deduplicate posts by ID to prevent duplicate keys
          setArticles(prev => {
            const existingIds = new Set(prev.map(post => post.id))
            const newPosts = moreArticles.filter(post => !existingIds.has(post.id))
            return [...prev, ...newPosts]
          })
          setCurrentPage(nextPage)
          setHasMore(moreArticles.length === 10)
        } else {
          console.log('No more articles found')
          setHasMore(false)
        }
      } else {
        console.error('Articles category not found')
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more articles:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter articles based on search term
  const filteredArticles = articles.filter(item => {
    const matchesSearch = searchTerm === "" || 
      cleanText(item.title.rendered).toLowerCase().includes(searchTerm.toLowerCase()) ||
      cleanText(item.excerpt.rendered).toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (isLoading && articles.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Articles</h1>
            </div>
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && articles.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Articles</h1>
          </div>
          <p className="text-muted-foreground mb-8 text-lg">{error}</p>
          <Button onClick={fetchArticlesData} variant="ghost" className="rounded-full">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Minimalistic */}
        <div className={`text-center mb-16 ${showAnimations ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-center">
            Articles
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-center">
            Discover in-depth articles, research papers, and expert insights on architecture and design
          </p>
        </div>

        {/* Search Bar - Minimalistic */}
        <div className={`max-w-2xl mx-auto mb-16 text-center ${showAnimations ? 'animate-fade-in-up-delay' : 'opacity-0'}`}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 text-base border-0 bg-muted/30 rounded-full focus:bg-background transition-all duration-300"
                />
              </div>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            {searchTerm && (
              <div className={`text-center mb-12 ${showAnimations ? 'animate-fade-in' : 'opacity-0'}`}>
                <p className="text-sm text-muted-foreground">
                  {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
                </p>
              </div>
            )}

        {/* Articles Grid - Minimalistic Layout */}
        {filteredArticles.length > 0 && (
          <div className="space-y-8">
            {filteredArticles.map((item, index) => (
              <ArticleCard 
                key={`article-${item.id}-${index}`} 
                article={item} 
                index={index}
                onReadMore={(articleItem) => {
                  setSelectedArticle(articleItem)
                  setIsModalOpen(true)
                }}
              />
            ))}
          </div>
        )}

        {/* Loading skeleton for additional content */}
        {isLoading && articles.length > 0 && (
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
        {filteredArticles.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? `No articles found for "${searchTerm}"` : 'No articles available'}
            </p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !searchTerm && filteredArticles.length > 0 && (
          <div className="text-center mt-16">
            <Button 
              onClick={loadMoreArticles} 
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
              Join our community for the latest insights and expert articles
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

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              {/* Square Ad in Sidebar */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-1">
                <AdBannerComponent 
                  size="320x320" 
                  className="w-full" 
                  positionId="sidebar-square-articles"
                  autoRotate={true}
                  rotationInterval={30}
                  showLabel={false}
                />
              </div>

              {/* YouTube Section */}
              <SidebarYouTube />

              {/* Facebook Section */}
              <SidebarFacebook />
            </div>
          </div>
        </div>
      </div>

      {/* Article Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 border-0 bg-white/95 backdrop-blur-sm">
          {selectedArticle && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{cleanText(selectedArticle.title.rendered)}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[85vh] modal-content">
                {/* Featured Image */}
                <div className="relative aspect-[16/8] overflow-hidden">
                <Image
                  src={getFeaturedImageUrl(selectedArticle, 'large')}
                  alt={getFeaturedImageAlt(selectedArticle)}
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
                  {cleanText(selectedArticle.title.rendered)}
                </h1>

                {/* Meta Info */}
                <div className="flex items-center mb-6 pb-4 border-b border-border/20">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{formatDate(selectedArticle.date)}</span>
                </div>

                {/* Content */}
                <div 
                  className="prose prose-base max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground/85 prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-strong:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80 hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md prose-blockquote:border-primary/30 prose-blockquote:bg-muted/30 prose-blockquote:rounded-lg prose-blockquote:py-3 prose-ul:text-foreground/85 prose-ol:text-foreground/85 prose-li:mb-1"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedArticle.content.rendered 
                  }}
                />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
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
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-fade-in-up-delay {
          animation: fadeInUp 0.8s ease-out forwards 0.2s;
          opacity: 0;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
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

function ArticleCard({ 
  article, 
  index, 
  onReadMore 
}: { 
  article: WordPressPost; 
  index: number;
  onReadMore: (article: WordPressPost) => void;
}) {
  const imageUrl = getFeaturedImageUrl(article, 'large')
  const imageAlt = getFeaturedImageAlt(article)
  const title = cleanText(article.title.rendered)
  const excerpt = getPostExcerpt(article, 150)
  const formattedDate = formatDate(article.date)

  // Calculate time ago for recent articles feel
  const publishDate = new Date(article.date)
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
            onClick={() => onReadMore(article)}
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