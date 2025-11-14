"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { useEffect, useState, memo } from "react"
import { cn } from "@/lib/utils"
import AdBannerComponent from "@/components/ad-banner"
import { AnimatedContentWrapper } from "@/components/animated-wrappers"
import SidebarYouTube from "@/components/sidebar-youtube"
import SidebarFacebook from "@/components/sidebar-facebook"
import Link from "next/link"
import Image from "next/image"

interface WordPressPost {
  id: number
  date: string
  title: {
    rendered: string
  }
  link: string
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
    }>
  }
}

function ArchAlleySidebar() {
  const [wordPressPosts, setWordPressPosts] = useState<WordPressPost[]>([])
  const [isWordPressLoading, setIsWordPressLoading] = useState(false)
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)


  // Format WordPress date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get featured image URL
  const getFeaturedImageUrl = (post: WordPressPost): string => {
    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]
    return featuredMedia?.source_url || '/placeholder-blog.jpg'
  }

  // Load sidebar data
  useEffect(() => {
    if (hasLoadedInitialData) return
    
    console.log('🔄 Loading sidebar data...')
    
    // Helper function for fetch with retry
    const fetchWithRetry = async (url: string, retries = 2): Promise<Response> => {
      for (let i = 0; i <= retries; i++) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json'
            },
          })
          
          if (response.ok) {
            return response
          }
          
          const delay = 300 * (i + 1)
          
          if (i < retries) {
            console.warn(`Sidebar API ${url} failed with ${response.status}, retrying in ${delay}ms`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        } catch (error) {
          if (i === retries) {
            throw error
          }
          const delay = 500 * (i + 1)
          console.warn(`Sidebar network error for ${url}, retrying in ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
      throw new Error('Max retries exceeded')
    }

    const loadSidebarData = async () => {
      setHasLoadedInitialData(true)
      
      // Load WordPress posts
      const fetchWordPressPosts = async () => {
        setIsWordPressLoading(true)
        try {
          const response = await fetchWithRetry('/api/wordpress/posts')
          
          if (response.ok) {
            const data = await response.json()
            console.log('[Sidebar] WordPress posts response:', data)
            
            if (data.posts && Array.isArray(data.posts)) {
              setWordPressPosts(data.posts)
            } else if (data.error) {
              console.error('[Sidebar] WordPress API error:', data.error)
              setWordPressPosts([])
            } else {
              console.warn('[Sidebar] Unexpected WordPress API response format:', data)
              setWordPressPosts([])
            }
          } else {
            console.error('[Sidebar] Failed to fetch WordPress posts:', response.status, response.statusText)
            setWordPressPosts([])
          }
        } catch (error) {
          console.error('Sidebar: Error fetching WordPress posts:', error)
          setWordPressPosts([])
        } finally {
          setIsWordPressLoading(false)
        }
      }

      // Execute
      fetchWordPressPosts()
    }

    loadSidebarData()
  }, [hasLoadedInitialData])

  return (
    <div className="space-y-6 sticky top-8">
      {/* 1. 1x1 Ad Banner */}
      <AnimatedContentWrapper direction="fade" delay={150}>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-1">
          <AdBannerComponent 
            size="320x320" 
            className="w-full" 
            positionId="sidebar-square"
            autoRotate={true}
            rotationInterval={30}
            showLabel={false}
          />
        </div>
      </AnimatedContentWrapper>

      {/* 2. YouTube Section */}
      <SidebarYouTube />

      {/* 3. Facebook Section */}
      <SidebarFacebook />

      {/* 4. Trending WordPress Posts */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-900/10 smooth-transition hover-lift animate-fade-in-up">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <CardTitle className="flex items-center space-x-2 text-lg font-semibold mr-3">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <TrendingUp className={cn("w-4 h-4 text-orange-600 dark:text-orange-400", isWordPressLoading && "animate-pulse")} />
              </div>
              <span className="text-gray-900 dark:text-gray-100 whitespace-nowrap">Trending</span>
            </CardTitle>
            <div className="flex-1 border-b-[5px] border-black"></div>
            {isWordPressLoading && (
              <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin ml-3" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {isWordPressLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))
          ) : wordPressPosts.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 italic animate-fade-in">
              No trending posts available right now.
            </div>
          ) : (
            wordPressPosts.map((post, index) => {
              const featuredImageUrl = getFeaturedImageUrl(post)
              const decodedTitle = post.title.rendered.replace(/&#8211;|&#8212;|&mdash;|&ndash;/g, '–').replace(/&[#\w]+;/g, '')
              
              return (
                <Link
                  key={post.id}
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 animate-slide-in-up hover-lift smooth-transition"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Image
                      src={featuredImageUrl}
                      alt={decodedTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 320px) 100vw, 320px"
                    />
                    {/* Overlay with title and date */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-3">
                      <h4 className="text-sm font-semibold text-white line-clamp-2 mb-1 group-hover:text-orange-300 transition-colors">
                        {decodedTitle}
                      </h4>
                      <p className="text-xs text-gray-300">
                        {formatDate(post.date)}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Forum Categories removed */}
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(ArchAlleySidebar)
