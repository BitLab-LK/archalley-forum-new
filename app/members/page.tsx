
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { shouldShowField, type PrivacyContext } from "@/lib/privacy-utils"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Calendar, CheckCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import MinimalBadgeDisplay from "@/components/minimal-badge-display"

interface Member {
  id: string
  name: string
  profession: string | null
  professions: string[] | null
  company: string | null
  location: string | null
  badges: Array<{
    id: string
    name: string
    description: string
    icon: string
    color: string
    level: string
    type: string
  }>
  badgeCount: number
  posts: number
  upvotes: number
  joinDate: string
  isVerified: boolean
  avatar: string | null
  profilePhotoPrivacy?: string | null
}

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [professionFilter, setProfessionFilter] = useState("all")
  const [sortBy, setSortBy] = useState("none")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  
  const ITEMS_PER_PAGE = 12

  // Helper function to get profile image source based on privacy
  const getProfileImageSource = (member: Member) => {
    if (!member.avatar) return "/placeholder-user.jpg"
    
    const privacyContext: PrivacyContext = {
      isOwnProfile: user?.id === member.id,
      viewerIsAuthenticated: !!user,
      viewerIsMember: true
    }
    
    // Check if profile photo should be visible
    const showProfilePhoto = shouldShowField(
      member.profilePhotoPrivacy as "EVERYONE" | "MEMBERS_ONLY" | "ONLY_ME" || "EVERYONE",
      privacyContext
    )
    
    return showProfilePhoto ? member.avatar : "/placeholder-user.jpg"
  }

  const handleViewProfile = (memberId: string) => {
    router.push(`/profile/${memberId}`)
  }

  // Fetch members from API with retry logic
  useEffect(() => {
    async function fetchMembers(retryCount = 0, maxRetries = 3) {
      try {
        setIsLoading(true)
        
        // Try the API endpoint
        const apiUrl = process.env.NODE_ENV === 'production' 
          ? `${window.location.origin}/api/users`
          : '/api/users'
        
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
        
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Failed to fetch members:', response.status, errorText)
          
          // Check if it's a retryable error (503, 500, network issues)
          const isRetryableError = response.status >= 500 || response.status === 503
          
          if (isRetryableError && retryCount < maxRetries) {
            const retryDelay = Math.pow(2, retryCount) * 1000 // Exponential backoff
            setTimeout(() => fetchMembers(retryCount + 1, maxRetries), retryDelay)
            return
          }
          
          throw new Error(`Failed to fetch members: ${response.status} - ${errorText.substring(0, 100)}`)
        }
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text()
          console.error('❌ Expected JSON but got:', contentType, responseText.substring(0, 200))
          throw new Error('Server returned invalid response format. Expected JSON but got: ' + contentType)
        }
        
        const data = await response.json()
        setMembers(data.users || [])
        setError(null) // Clear any previous errors
      } catch (err) {
        console.error('❌ Error fetching members:', err)
        
        // Check if it's a network error and we haven't exceeded retries
        const isNetworkError = err instanceof Error && (
          err.name === 'AbortError' ||
          err.message.includes('fetch') ||
          err.message.includes('network') ||
          err.message.includes('connection')
        )
        
        if (isNetworkError && retryCount < maxRetries) {
          const retryDelay = Math.pow(2, retryCount) * 1000 // Exponential backoff
          setTimeout(() => fetchMembers(retryCount + 1, maxRetries), retryDelay)
          return
        }
        
        // Enhanced error messages
        let errorMessage = 'Failed to load members'
        if (err instanceof Error) {
          if (err.message.includes('Database connection')) {
            errorMessage = 'Database temporarily unavailable. Please try again in a moment.'
          } else if (err.message.includes('timeout') || err.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.'
          } else {
            errorMessage = err.message
          }
        }
        
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [])

  // Filter and sort members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.company && member.company.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesProfession = professionFilter === "all" || 
                             (member.profession && member.profession.toLowerCase().replace(' ', '-') === professionFilter) ||
                             (member.professions && member.professions.some(prof => 
                               prof.toLowerCase().replace(' ', '-') === professionFilter
                             ))
    
    return matchesSearch && matchesProfession
  })

  // Ensure logged-in user is first, others random
  let sortedMembers = filteredMembers;
  if (user) {
    const loggedUser = sortedMembers.find(m => m.id === user.id);
    const otherMembers = sortedMembers.filter(m => m.id !== user.id);
    // Shuffle other members
    for (let i = otherMembers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherMembers[i], otherMembers[j]] = [otherMembers[j], otherMembers[i]];
    }
    sortedMembers = loggedUser ? [loggedUser, ...otherMembers] : otherMembers;
  }

  // Paginated members for display
  const paginatedMembers = sortedMembers.slice(0, page * ITEMS_PER_PAGE)

  // Load more function
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return
    
    setIsLoadingMore(true)
    
    // Simulate loading delay (remove this in production if not needed)
    setTimeout(() => {
      const nextPage = page + 1
      const totalAvailable = sortedMembers.length
      const itemsToShow = nextPage * ITEMS_PER_PAGE
      
      setPage(nextPage)
      setHasMore(itemsToShow < totalAvailable)
      setIsLoadingMore(false)
    }, 500)
  }, [page, sortedMembers.length, isLoadingMore, hasMore])

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1)
    setHasMore(sortedMembers.length > ITEMS_PER_PAGE)
  }, [searchTerm, professionFilter, sortBy, sortedMembers.length])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore, hasMore, isLoadingMore])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in">
      <main className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 members-page-container">
        <div className="mb-4 sm:mb-8 animate-fade-in-up animate-delay-100">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Community Members</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Connect with architects, designers, and construction professionals
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-4 sm:mb-8 smooth-transition hover-lift animate-scale-in animate-delay-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search members by name or company..." 
                  className="pl-10 smooth-transition focus:scale-105"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Select value={professionFilter} onValueChange={setProfessionFilter}>
                  <SelectTrigger className="w-full sm:w-48 smooth-transition hover:scale-105">
                    <SelectValue placeholder="Filter by profession" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Professions</SelectItem>
                    <SelectItem value="architect">Architect</SelectItem>
                    <SelectItem value="interior-designer">Interior Designer</SelectItem>
                    <SelectItem value="construction-manager">Construction Manager</SelectItem>
                    <SelectItem value="urban-planner">Urban Planner</SelectItem>
                    <SelectItem value="civil-engineer">Civil Engineer</SelectItem>
                    <SelectItem value="landscape-architect">Landscape Architect</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48 smooth-transition hover:scale-105">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="posts">Most Posts</SelectItem>
                    <SelectItem value="upvotes">Most Upvotes</SelectItem>
                    <SelectItem value="recent">Recently Joined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-8 sm:py-12 animate-fade-in animate-delay-300">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading members...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-4 sm:mb-8 animate-fade-in-up animate-delay-300">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center text-red-600 dark:text-red-400">
                <h3 className="text-base sm:text-lg font-semibold mb-2">Unable to Load Members</h3>
                <p className="mb-4 text-sm sm:text-base">{error}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="w-full sm:w-auto"
                  >
                    Reload Page
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={async () => {
                      try {
                        setError(null)
                        setIsLoading(true)
                        const healthResponse = await fetch('/api/health')
                        const healthData = await healthResponse.json()
                        console.log('Health check:', healthData)
                        if (healthData.status === 'ok') {
                          window.location.reload()
                        } else {
                          setError('API is not responding correctly')
                        }
                      } catch (err) {
                        setError('Unable to connect to server')
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                  >
                    Test Connection
                  </Button>
                </div>
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                    {JSON.stringify({
                      url: window.location.href,
                      userAgent: navigator.userAgent,
                      timestamp: new Date().toISOString()
                    }, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members Grid */}
        {!isLoading && !error && (
          <>
            {sortedMembers.length === 0 ? (
              <Card className="animate-fade-in-up animate-delay-400">
                <CardContent className="p-4 sm:p-8 text-center">
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {searchTerm || professionFilter !== "all" 
                      ? "No members found matching your criteria." 
                      : "No members found."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 animate-fade-in-up animate-delay-400">
                  {paginatedMembers.map((member, index) => (
                  <Card 
                    key={member.id} 
                    className={`hover:shadow-lg transition-shadow smooth-transition hover-lift animate-slide-in-up animate-delay-${Math.min(500 + (index * 50), 1000)}`}
                  >
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <Avatar className="w-12 h-12 sm:w-16 sm:h-16 smooth-transition hover:scale-110">
                          <AvatarImage src={getProfileImageSource(member)} />
                          <AvatarFallback>
                            {member.name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-base sm:text-lg truncate">{member.name}</h3>
                            {member.isVerified && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 animate-pulse-glow" />}
                          </div>
                          <div className="mb-1 sm:mb-2">
                            {member.professions && member.professions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {member.professions.slice(0, 2).map((profession, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 smooth-transition hover:scale-105"
                                  >
                                    {profession}
                                  </Badge>
                                ))}
                                {member.professions.length > 2 && (
                                  <Badge 
                                    variant="outline" 
                                    className="px-2 py-0.5 text-xs text-gray-500"
                                  >
                                    +{member.professions.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              member.profession && (
                                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                                  {member.profession}
                                </p>
                              )
                            )}
                          </div>
                          {member.company && (
                            <p className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3">
                              {member.company}
                            </p>
                          )}

                          {member.location && (
                            <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="truncate">{member.location}</span>
                            </div>
                          )}

                          {/* Achievement Badges */}
                          {member.badges && member.badges.length > 0 && (
                            <div className="mb-2">
                              <MinimalBadgeDisplay
                                badges={member.badges.map(badge => ({
                                  id: badge.id,
                                  badges: badge,
                                  earnedAt: new Date()
                                }))}
                                maxDisplay={3}
                                size="sm"
                                showTooltip={true}
                                showNames={false}
                              />
                            </div>
                          )}

                          <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-4">
                            <span>{member.posts} posts</span>
                            <span>{member.upvotes} upvotes</span>
                          </div>

                          <div className="flex items-center text-xs text-gray-500 mb-3 sm:mb-4">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>Joined {member.joinDate}</span>
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full text-xs sm:text-sm smooth-transition hover-lift"
                            onClick={() => handleViewProfile(member.id)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>

                {/* Infinite Scroll Trigger */}
                {hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-6 sm:py-8 animate-fade-in">
                    {isLoadingMore ? (
                      <div className="flex items-center space-x-2 animate-pulse-glow">
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-blue-600" />
                        <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading more members...</span>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-xs sm:text-sm animate-fade-in">Scroll down to load more</div>
                    )}
                  </div>
                )}

                {/* End of results message */}
                {!hasMore && paginatedMembers.length > ITEMS_PER_PAGE && (
                  <div className="text-center py-6 sm:py-8 animate-fade-in-up">
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                      You've seen all {paginatedMembers.length} members
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
