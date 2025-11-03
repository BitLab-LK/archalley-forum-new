"use client"

import { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, MessageSquare, ThumbsUp, User, MapPin, Building, CheckCircle, Loader2 } from 'lucide-react'
import { HorizontalAd } from '@/components/ad-banner'

interface SearchPost {
  id: string
  content: string
  excerpt: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    image: string | null
    headline: string | null
  }
  categories: {
    id: string
    name: string
    color: string | null
  } | null
  allCategories?: Array<{
    id: string
    name: string
    color: string | null
    slug: string
  }>
  images: string[]
  commentsCount: number
  votesCount: number
}

interface SearchMember {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  fullName: string
  image: string | null
  headline: string | null
  profession: string | null
  company: string | null
  bio: string | null
  location: string
  city: string | null
  country: string | null
  skills: string[] | null
  createdAt: string
  lastActiveAt: string | null
  isVerified: boolean
  rank: string | null
  postsCount: number
  commentsCount: number
}

interface SearchResults {
  posts: SearchPost[]
  members: SearchMember[]
  totalPosts: number
  totalMembers: number
  currentPage: number
  totalPages: number
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const debounceTimer = useRef<NodeJS.Timeout>()

  // Debounced search function
  const debouncedSearch = useCallback((query: string, type: string = 'all', page: number = 1) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    debounceTimer.current = setTimeout(() => {
      performSearch(query, type, page)
    }, 300) // 300ms delay
  }, [])

  const performSearch = async (query: string, type: string = 'all', page: number = 1) => {
    if (!query.trim()) {
      setSearchResults(null)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}&limit=20`)
      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
      } else {
        console.error('Search failed')
        setSearchResults(null)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      setSearchQuery(query)
      performSearch(query, activeTab, currentPage)
    }
  }, [searchParams, activeTab, currentPage])

  // Handle real-time search input
  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      debouncedSearch(value, activeTab, 1)
      setCurrentPage(1)
    } else {
      setSearchResults(null)
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      performSearch(searchQuery, activeTab, 1)
      setCurrentPage(1)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setCurrentPage(1)
    if (searchQuery.trim()) {
      performSearch(searchQuery, tab, 1)
    }
  }

  const getRankColor = (rank: string | null) => {
    const colors = {
      NEW_MEMBER: "bg-gray-500",
      CONVERSATION_STARTER: "bg-blue-500",
      RISING_STAR: "bg-green-500",
      VISUAL_STORYTELLER: "bg-purple-500",
      VALUED_RESPONDER: "bg-yellow-500",
      COMMUNITY_EXPERT: "bg-red-500",
      TOP_CONTRIBUTOR: "bg-orange-500",
    }
    return colors[rank as keyof typeof colors] || "bg-gray-500"
  }

  const getRankName = (rank: string | null) => {
    const names = {
      NEW_MEMBER: "New Member",
      CONVERSATION_STARTER: "Conversation Starter",
      RISING_STAR: "Rising Star",
      VISUAL_STORYTELLER: "Visual Storyteller",
      VALUED_RESPONDER: "Valued Responder",
      COMMUNITY_EXPERT: "Community Expert",
      TOP_CONTRIBUTOR: "Top Contributor",
    }
    return names[rank as keyof typeof names] || "Member"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const highlightText = (text: string | null, query: string) => {
    if (!text || !query.trim()) return text || ''
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-1">
          {part}
        </mark>
      ) : part
    )
  }

  const renderPostImages = (images: string[]) => {
    if (!images || images.length === 0) return null

    return (
      <div className="mt-3 mb-3 flex justify-center">
        {images.length === 1 ? (
          <div className="rounded-lg overflow-hidden max-w-md w-full">
            <img
              src={images[0]}
              alt="Post image"
              className="w-full h-auto object-cover"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-w-md w-full">
            {images.slice(0, 4).map((imageUrl, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
              </div>
            ))}
            {images.length > 4 && (
              <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg h-32">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  +{images.length - 4} more
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Skeleton components for loading states
  const PostSkeleton = () => (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-1"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </CardContent>
    </Card>
  )

  const MemberSkeleton = () => (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Search Results</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="search"
              placeholder="Search posts, members..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="pl-12 h-12 text-base"
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </form>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                All Results
                {searchResults && (
                  <Badge variant="secondary" className="ml-2">
                    {searchResults.totalPosts + searchResults.totalMembers}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex items-center gap-2">
                Posts
                {searchResults && (
                  <Badge variant="secondary" className="ml-2">
                    {searchResults.totalPosts}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                Members
                {searchResults && (
                  <Badge variant="secondary" className="ml-2">
                    {searchResults.totalMembers}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Loading Posts...</h2>
                  {[...Array(3)].map((_, i) => (
                    <PostSkeleton key={i} />
                  ))}
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-4">Loading Members...</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <MemberSkeleton key={i} />
                    ))}
                  </div>
                </div>
              </div>
            ) : searchResults ? (
              <>
                {/* All Results Tab */}
                <TabsContent value="all" className="space-y-6">
                  {/* Posts Section */}
                  {searchResults.posts.length > 0 && (
                    <div className="animate-in fade-in-50 duration-500">
                      <h2 className="text-xl font-semibold mb-4">Posts ({searchResults.totalPosts})</h2>
                      <div className="space-y-4 mb-8">
                        {searchResults.posts.slice(0, 5).map((post, index) => (
                          <Card 
                            key={post.id} 
                            className="hover:shadow-md transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4"
                            style={{ 
                              animationDelay: `${index * 100}ms`,
                              animationFillMode: 'both'
                            }}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={post.author.image || '/placeholder.svg'} />
                                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-muted-foreground">
                                      {post.author.name} • {formatDate(post.createdAt)}
                                    </span>
                                    {post.allCategories && post.allCategories.length > 0 ? (
                                      // Show all categories
                                      post.allCategories.map((category: any) => (
                                        <Badge key={category.id} variant="secondary" className="text-xs mr-1">
                                          {category.name}
                                        </Badge>
                                      ))
                                    ) : post.categories ? (
                                      // Fallback to single category
                                      <Badge variant="secondary" className="text-xs">
                                        {post.categories.name}
                                      </Badge>
                                    ) : null}
                                  </div>
                                  
                                  <Link href={`/${post.id}`} className="group">
                                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors mb-2">
                                      {highlightText(post.content?.substring(0, 80) + '...' || 'No content', searchQuery)}
                                    </h3>
                                  </Link>
                                  
                                  {/* Render post images */}
                                  {renderPostImages(post.images)}
                                  
                                  {post.excerpt && (
                                    <p className="text-muted-foreground mb-3">
                                      {highlightText(post.excerpt, searchQuery)}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="w-4 h-4" />
                                      {post.commentsCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <ThumbsUp className="w-4 h-4" />
                                      {post.votesCount}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {searchResults.totalPosts > 5 && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleTabChange('posts')}
                          className="w-full"
                        >
                          View All {searchResults.totalPosts} Posts
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Members Section */}
                  {searchResults.members.length > 0 && (
                    <div className="animate-in fade-in-50 duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                      <h2 className="text-xl font-semibold mb-4">Members ({searchResults.totalMembers})</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {searchResults.members.slice(0, 6).map((member, index) => (
                          <Card 
                            key={member.id} 
                            className="hover:shadow-md transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4"
                            style={{ 
                              animationDelay: `${300 + index * 80}ms`,
                              animationFillMode: 'both'
                            }}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={member.image || '/placeholder.svg'} />
                                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Link href={`/profile/${member.id}`} className="hover:text-primary">
                                      <h3 className="font-semibold truncate">
                                        {highlightText(member.fullName, searchQuery)}
                                      </h3>
                                    </Link>
                                    {member.isVerified && (
                                      <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  
                                  {member.headline && (
                                    <p className="text-sm text-muted-foreground mb-2 truncate">
                                      {highlightText(member.headline, searchQuery)}
                                    </p>
                                  )}
                                  
                                  {member.company && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                      <Building className="w-3 h-3" />
                                      <span className="truncate">
                                        {highlightText(member.company, searchQuery)}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {member.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate">{member.location}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between">
                                    <Badge className={`text-xs ${getRankColor(member.rank)}`}>
                                      {getRankName(member.rank)}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground">
                                      {member.postsCount} posts
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {searchResults.totalMembers > 6 && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleTabChange('members')}
                          className="w-full"
                        >
                          View All {searchResults.totalMembers} Members
                        </Button>
                      )}
                    </div>
                  )}

                  {/* No Results */}
                  {searchResults.posts.length === 0 && searchResults.members.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No results found</h2>
                      <p className="text-muted-foreground">
                        No posts or members found for "{searchQuery}". Try different keywords.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Posts Only Tab */}
                <TabsContent value="posts" className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <PostSkeleton key={i} />
                      ))}
                    </div>
                  ) : searchResults.posts.length > 0 ? (
                    <div className="animate-in fade-in-50 duration-500">
                      {searchResults.posts.map((post, index) => (
                        <Card 
                          key={post.id} 
                          className="hover:shadow-md transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4"
                          style={{ 
                            animationDelay: `${index * 100}ms`,
                            animationFillMode: 'both'
                          }}
                        >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={post.author.image || '/placeholder.svg'} />
                                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">
                                  {post.author.name} • {formatDate(post.createdAt)}
                                </span>
                                {post.allCategories && post.allCategories.length > 0 ? (
                                  // Show all categories
                                  post.allCategories.map((category: any) => (
                                    <Badge key={category.id} variant="secondary" className="text-xs mr-1">
                                      {category.name}
                                    </Badge>
                                  ))
                                ) : post.categories ? (
                                  // Fallback to single category
                                  <Badge variant="secondary" className="text-xs">
                                    {post.categories.name}
                                  </Badge>
                                ) : null}
                              </div>
                              
                              <Link href={`/posts/${post.id}`} className="group">
                                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors mb-2">
                                  {highlightText(post.content?.substring(0, 80) + '...' || 'No content', searchQuery)}
                                </h3>
                              </Link>
                              
                              {/* Render post images */}
                              {renderPostImages(post.images)}
                              
                              {post.excerpt && (
                                <p className="text-muted-foreground mb-3">
                                  {highlightText(post.excerpt, searchQuery)}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4" />
                                  {post.commentsCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="w-4 h-4" />
                                  {post.votesCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No posts found</h2>
                      <p className="text-muted-foreground">
                        No posts found for "{searchQuery}". Try different keywords.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Members Only Tab */}
                <TabsContent value="members" className="space-y-4">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(9)].map((_, i) => (
                        <MemberSkeleton key={i} />
                      ))}
                    </div>
                  ) : searchResults.members.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in-50 duration-500">
                      {searchResults.members.map((member, index) => (
                        <Card 
                          key={member.id} 
                          className="hover:shadow-md transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4"
                          style={{ 
                            animationDelay: `${index * 80}ms`,
                            animationFillMode: 'both'
                          }}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={member.image || '/placeholder.svg'} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Link href={`/profile/${member.id}`} className="hover:text-primary">
                                    <h3 className="font-semibold truncate">
                                      {highlightText(member.fullName, searchQuery)}
                                    </h3>
                                  </Link>
                                  {member.isVerified && (
                                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  )}
                                </div>
                                
                                {member.headline && (
                                  <p className="text-sm text-muted-foreground mb-2 truncate">
                                    {highlightText(member.headline, searchQuery)}
                                  </p>
                                )}
                                
                                {member.company && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                    <Building className="w-3 h-3" />
                                    <span className="truncate">
                                      {highlightText(member.company, searchQuery)}
                                    </span>
                                  </div>
                                )}
                                
                                {member.location && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{member.location}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <Badge className={`text-xs ${getRankColor(member.rank)}`}>
                                    {getRankName(member.rank)}
                                  </Badge>
                                  <div className="text-xs text-muted-foreground">
                                    {member.postsCount} posts
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No members found</h2>
                      <p className="text-muted-foreground">
                        No members found for "{searchQuery}". Try different keywords.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Start searching</h2>
                <p className="text-muted-foreground">
                  Enter keywords to search for posts and members.
                </p>
              </div>
            )}
          </Tabs>
        )}

        {/* Advertisement after search results */}
        {searchResults && (
          <div className="mt-12 mb-8">
            <HorizontalAd className="mx-auto animate-fade-in" />
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Search ArchAlley Forum</h2>
            <p className="text-muted-foreground">
              Find posts, members, and discussions across the community.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}