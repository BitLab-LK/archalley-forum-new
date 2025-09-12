"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Calendar, CheckCircle, ArrowLeft, Edit, MessageCircle, Phone, Mail, Building, Briefcase, GraduationCap, ExternalLink, Users, Trophy, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { shouldShowField, type PrivacyContext } from "@/lib/privacy-utils"
import PostCard from "@/components/post-card"
import ActivityFeed from "@/components/activity-feed"
import { PostBadges } from "@/components/post-badges"
import ShareProfileDropdown from "@/components/share-profile-dropdown"

interface UserBadge {
  id: string
  badges: {
    id: string
    name: string
    description: string
    icon: string
    color: string
    level: string
    type: string
  }
  earnedAt: Date
}

interface User {
  id: string
  name: string
  email?: string
  image?: string
  profession?: string
  professions?: string[]
  company?: string
  location?: string
  rank?: string
  posts: number
  upvotes: number
  joinDate: string
  isVerified: boolean
  bio?: string
  
  // Privacy settings
  emailPrivacy?: "EVERYONE" | "MEMBERS_ONLY" | "ONLY_ME"
  phonePrivacy?: "EVERYONE" | "MEMBERS_ONLY" | "ONLY_ME"
  profilePhotoPrivacy?: "EVERYONE" | "MEMBERS_ONLY" | "ONLY_ME"
  
  // Additional comprehensive fields
  firstName?: string
  lastName?: string
  phoneNumber?: string
  phone?: string
  headline?: string
  skills?: string[]
  industry?: string
  country?: string
  city?: string
  portfolioUrl?: string
  website?: string
  linkedinUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  githubUrl?: string
  youtubeUrl?: string
  tiktokUrl?: string
  behanceUrl?: string
  dribbbleUrl?: string
  otherSocialUrl?: string
  workExperience?: any[]
  education?: any[]
}

interface Post {
  id: string
  author: {
    id: string
    name: string
    avatar: string
    isVerified: boolean
    rank: string
    rankIcon: string
  }
  content: string
  category: string
  isAnonymous: boolean
  isPinned: boolean
  upvotes: number
  downvotes: number
  comments: number
  timeAgo: string
  images?: string[]
  topComment?: {
    author: {
      name: string
      image?: string
    }
    content: string
    upvotes: number
    downvotes: number
    isBestAnswer: boolean
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const userId = params.id as string
  const { user: currentUser } = useAuth() // Get current logged-in user
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if the current user is viewing their own profile
  const isOwnProfile = currentUser?.id === userId

  // Privacy context for checking field visibility
  const privacyContext: PrivacyContext = {
    isOwnProfile,
    viewerIsAuthenticated: !!currentUser,
    viewerIsMember: true
  }

  // Helper function to get profile image source based on privacy
  const getProfileImageSource = () => {
    if (!user?.image) return "/placeholder-user.jpg"
    
    // Check if profile photo should be visible
    const showProfilePhoto = shouldShowField(
      user.profilePhotoPrivacy || "EVERYONE",
      privacyContext
    )
    
    return showProfilePhoto ? user.image : "/placeholder-user.jpg"
  }

  // Check if we're coming from an edit (to force refresh)
  const wasUpdated = searchParams.get('updated')

  // Memoized badge transformation to prevent unnecessary re-renders
  const transformedBadges = useMemo(() => 
    userBadges.map(ub => ({
      id: ub.badges.id,
      name: ub.badges.name,
      description: ub.badges.description,
      icon: ub.badges.icon,
      color: ub.badges.color,
      level: ub.badges.level,
      type: ub.badges.type
    })), [userBadges]
  )

  // Memoized calculations to prevent unnecessary re-renders
  const totalComments = useMemo(() => posts.reduce((sum, post) => sum + post.comments, 0), [posts])
  const totalUpvotes = useMemo(() => posts.reduce((sum, post) => sum + post.upvotes, 0), [posts])
  const totalDownvotes = useMemo(() => posts.reduce((sum, post) => sum + post.downvotes, 0), [posts])

  // Optimized handlers with useCallback
  const handleDeletePost = useCallback(async (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId))
  }, [])

  // Handle comment count changes - this will trigger recalculation of totals
  const handleCommentCountChange = useCallback((postId: string, newCount: number) => {
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId 
        ? { ...post, comments: newCount }
        : post
    ))
  }, [])

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setIsLoading(true)
        // Add cache busting when coming from edit
        const cacheBuster = wasUpdated ? `?t=${Date.now()}` : ''
        const response = await fetch(`/api/users/${userId}${cacheBuster}`)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to fetch user profile:', response.status, errorText)
          throw new Error(`User not found: ${response.status}`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text()
          console.error('Expected JSON but got:', contentType, responseText.substring(0, 200))
          throw new Error('Server returned invalid response format')
        }

        const userData = await response.json()
        // console.log('📸 User data fetched:', { id: userData.user?.id, image: userData.user?.image }) // Removed for performance
        setUser(userData.user) // Extract user from the response object

        // Fetch user's posts and badges in parallel for better performance
        const [postsPromise, badgesPromise] = await Promise.all([
          fetch(`/api/posts?authorId=${userId}${cacheBuster}`),
          fetch(`/api/badges/user/${userId}${cacheBuster}`)
        ])
        
        try {
          const postsResponse = postsPromise
          if (postsResponse.ok) {
            const postsContentType = postsResponse.headers.get('content-type')
            if (postsContentType && postsContentType.includes('application/json')) {
              const postsData = await postsResponse.json()
              // Use the posts data directly as it comes from the API with proper formatting
              setPosts(postsData.posts || [])
            } else {
              console.warn('Posts API returned non-JSON response')
              setPosts([])
            }
          } else {
            console.warn('Failed to fetch posts:', postsResponse.status)
            setPosts([])
          }
        } catch (postsError) {
          console.warn('Error fetching posts:', postsError)
          setPosts([])
        }

        // Handle badges response
        try {
          const badgesResponse = badgesPromise
          if (badgesResponse.ok) {
            const badgesData = await badgesResponse.json()
            setUserBadges(badgesData || [])
          } else {
            console.warn('Failed to fetch badges:', badgesResponse.status)
            setUserBadges([])
          }
        } catch (badgesError) {
          console.warn('Error fetching badges:', badgesError)
          setUserBadges([])
        }
      } catch (err) {
        console.error('Error fetching user profile:', err)
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchUserProfile()
    }
  }, [userId, wasUpdated]) // Add wasUpdated as dependency

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center animate-fade-in">
        <div className="text-center animate-scale-in animate-delay-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 animate-fade-in-up animate-delay-200">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center animate-fade-in">
        <div className="text-center animate-scale-in animate-delay-100">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 animate-fade-in-up animate-delay-200">Profile Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 animate-fade-in-up animate-delay-300">{error || 'This user profile does not exist.'}</p>
          <Link href="/members">
            <Button className="smooth-transition hover-lift animate-fade-in-up animate-delay-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Members
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in">
      <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6 animate-fade-in-up animate-delay-100">
          <Link href="/members">
            <Button variant="ghost" className="mb-2 sm:mb-4 smooth-transition hover-lift">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Members
            </Button>
          </Link>
          {isOwnProfile && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              This is your profile. You can edit your information and manage your settings.
            </p>
          )}
        </div>

        {/* Profile Header */}
        <Card className="mb-4 sm:mb-8 smooth-transition hover-lift animate-fade-in-up animate-delay-200">
          <CardContent className="p-3 sm:p-8">
            {/* Mobile Layout - Stacked */}
            <div className="block sm:hidden space-y-3">
              {/* Header with Edit Button */}
              <div className="flex items-start justify-between">
                {/* Avatar + Name Section */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Avatar className="w-12 h-12 flex-shrink-0 smooth-transition hover:scale-110">
                    <AvatarImage src={getProfileImageSource()} alt={user.name} />
                    <AvatarFallback className="text-sm">
                      {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1 mb-1">
                      <h1 className="text-base font-bold truncate">{user.name}</h1>
                      {user.isVerified && (
                        <CheckCircle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    {user.headline && (
                      <p className="text-xs text-gray-600 truncate">{user.headline}</p>
                    )}
                  </div>
                </div>
                
                {/* Edit and Share Buttons */}
                {isOwnProfile && (
                  <div className="flex flex-col gap-1">
                    <Link href={`/profile/edit`}>
                      <Button variant="outline" size="sm" className="ml-2 px-2 py-1 text-xs smooth-transition hover-lift">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <div className="ml-2">
                      <ShareProfileDropdown 
                        user={user}
                        variant="outline"
                        size="sm"
                        showLabel={false}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
                {!isOwnProfile && (currentUser?.role === 'ADMIN' || currentUser?.isAdmin) && (
                  <Badge variant="outline" className="ml-2 text-xs smooth-transition hover:scale-105">
                    Public
                  </Badge>
                )}
              </div>

              {/* Badges Row */}
              {userBadges.length > 0 && (
                <div className="flex justify-start">
                  <PostBadges 
                    badges={transformedBadges}
                    maxDisplay={2}
                    size="sm"
                  />
                </div>
              )}

              {/* Join Date */}
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                <span>Joined {user.joinDate}</span>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between text-xs">
                <div className="text-center">
                  <div className="font-bold text-sm">{posts.length}</div>
                  <div className="text-gray-500">Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm">{totalUpvotes}</div>
                  <div className="text-gray-500">Upvotes</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm">{totalDownvotes}</div>
                  <div className="text-gray-500">Downvotes</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm">{totalComments}</div>
                  <div className="text-gray-500">Comments</div>
                </div>
              </div>
            </div>

            {/* Desktop Layout - Original */}
            <div className="hidden sm:flex sm:flex-col md:flex-row sm:items-start md:items-center sm:gap-6">
              <Avatar className="w-24 h-24 smooth-transition hover:scale-110">
                <AvatarImage src={getProfileImageSource()} alt={user.name} />
                <AvatarFallback className="text-2xl">
                  {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                    {user.isVerified && (
                      <CheckCircle className="w-6 h-6 text-yellow-500" />
                    )}
                  </div>
                  
                  {isOwnProfile && (
                    <div className="flex gap-2">
                      <Link href={`/profile/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </Link>
                      <ShareProfileDropdown 
                        user={user}
                        variant="outline"
                        size="sm"
                        showLabel={true}
                      />
                    </div>
                  )}
                  {!isOwnProfile && (currentUser?.role === 'ADMIN' || currentUser?.isAdmin) && (
                    <Badge variant="outline">
                      Public Profile
                    </Badge>
                  )}
                </div>

                {/* User Badges - Prominently displayed after name */}
                {userBadges.length > 0 && (
                  <div className="mb-3">
                    <PostBadges 
                      badges={transformedBadges}
                      maxDisplay={5}
                      size="md"
                    />
                  </div>
                )}

                {user.headline && (
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3">
                    <Briefcase className="w-4 h-4 mr-1" />
                    <span>{user.headline}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Joined {user.joinDate}</span>
                  </div>
                </div>

                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{posts.length}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">posts</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{totalUpvotes}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">upvotes</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{totalDownvotes}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">downvotes</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{totalComments}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">comments</span>
                  </div>
                </div>

                {/* Basic Information in Header */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{user.joinDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="overview" className="w-full animate-fade-in-up animate-delay-300">
          <div className="overflow-x-auto">
            <TabsList className={`grid w-full grid-cols-3 min-w-max sm:min-w-0 smooth-transition hover-lift`}>
              <TabsTrigger value="overview" className="text-xs sm:text-sm smooth-transition">Overview</TabsTrigger>
              <TabsTrigger value="posts" className="text-xs sm:text-sm smooth-transition">Posts ({posts.length})</TabsTrigger>
              {/* Settings Tab - Temporarily Removed */}
              {/* {isOwnProfile && <TabsTrigger value="settings" className="text-xs sm:text-sm smooth-transition">Settings</TabsTrigger>} */}
              <TabsTrigger value="activity" className="text-xs sm:text-sm smooth-transition">Activity</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Professional Information */}
            <Card className="hover:border-l-4 hover:border-l-slate-500 transition-all duration-200 smooth-transition hover-lift animate-scale-in animate-delay-400">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                  Professional Information
                </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Profession(s)</label>
                        {user.professions && user.professions.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {user.professions.map((profession, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-200"
                              >
                                {profession}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-900 dark:text-white font-medium mt-1">
                            {user.profession || 'Not specified'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {user.company && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <Building className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</label>
                          <p className="text-gray-900 dark:text-white font-medium">{user.company}</p>
                        </div>
                      </div>
                    )}
                    
                    {user.industry && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <Building className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Industry</label>
                          <p className="text-gray-900 dark:text-white font-medium">{user.industry}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</label>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {user.city && user.country 
                            ? `${user.city}, ${user.country}`
                            : user.location || user.city || user.country || 'Not specified'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            {/* Skills Section */}
            {user.skills && user.skills.length > 0 && (
              <Card className="hover:border-l-4 hover:border-l-slate-500 transition-all duration-200 smooth-transition hover-lift animate-scale-in animate-delay-500">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-slate-600" />
                    Skills & Expertise
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {user.skills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-200 smooth-transition hover:scale-105"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* About/Bio Section */}
            {user.bio && (
              <Card className="hover:border-l-4 hover:border-l-slate-500 transition-all duration-200 smooth-transition hover-lift animate-scale-in animate-delay-600">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-600" />
                    About
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="hover:border-l-4 hover:border-l-slate-500 transition-all duration-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-slate-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.email && shouldShowField(user.emailPrivacy || "EVERYONE", privacyContext) && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Mail className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Email
                          {isOwnProfile && user.emailPrivacy && user.emailPrivacy !== "EVERYONE" && (
                            <span className="ml-1 text-xs text-gray-400">
                              ({user.emailPrivacy === "MEMBERS_ONLY" ? "Members Only" : "Private"})
                            </span>
                          )}
                        </label>
                        <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {(user.phoneNumber || user.phone) && shouldShowField(user.phonePrivacy || "MEMBERS_ONLY", privacyContext) && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Phone className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Phone
                          {isOwnProfile && user.phonePrivacy && user.phonePrivacy !== "EVERYONE" && (
                            <span className="ml-1 text-xs text-gray-400">
                              ({user.phonePrivacy === "MEMBERS_ONLY" ? "Members Only" : "Private"})
                            </span>
                          )}
                        </label>
                        <p className="text-gray-900 dark:text-white font-medium">{user.phoneNumber || user.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Links & Portfolio */}
            {(user.portfolioUrl || user.website) && (
              <Card className="hover:border-l-4 hover:border-l-slate-500 transition-all duration-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-slate-600" />
                    Links & Portfolio
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <ExternalLink className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Website/Portfolio</label>
                        <a 
                          href={user.portfolioUrl || user.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                        >
                          {user.portfolioUrl || user.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Social Media Links */}
            {(user.linkedinUrl || user.facebookUrl || user.instagramUrl || user.twitterUrl || user.githubUrl || user.youtubeUrl || user.tiktokUrl || user.behanceUrl || user.dribbbleUrl || user.otherSocialUrl) && (
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-8">
                  <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                      Professional Networks & Platforms
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect across professional and social platforms</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {user.linkedinUrl && (
                      <a 
                        href={user.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300"
                      >
                        <div className="w-11 h-11 bg-slate-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">LinkedIn</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Professional Network</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </a>
                    )}
                    
                    {user.githubUrl && (
                      <a 
                        href={user.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300"
                      >
                        <div className="w-11 h-11 bg-gray-900 dark:bg-gray-100 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">GitHub</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Code Repository</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </a>
                    )}

                    {user.behanceUrl && (
                      <a 
                        href={user.behanceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300"
                      >
                        <div className="w-11 h-11 bg-slate-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.34.5-.8.9-1.385 1.19.906.26 1.576.72 2.022 1.37.448.66.673 1.45.673 2.38 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-1.16 1.35-.48.348-1.05.6-1.67.76-.62.16-1.25.24-1.92.24h-4.5v-14.728h4.16zm-1.003 6.928h1.234c.473 0 .865-.12 1.172-.36.31-.24.46-.613.46-1.12 0-.583-.17-.96-.51-1.12-.34-.17-.813-.25-1.41-.25h-.946v2.85zm0 2.853v3.448h1.333c.43 0 .795-.086 1.095-.26.3-.174.45-.5.45-1.05 0-.384-.07-.666-.21-.85-.14-.18-.33-.31-.58-.39-.25-.08-.54-.12-.88-.12-.22 0-.43-.005-.63-.018-.2-.01-.38-.04-.54-.06v-.7h-.035zm8.538-9.781v14.728h-2.95v-14.728h2.95zm7.322 1.055c-.914-.607-1.98-.91-3.2-.91-1.22 0-2.286.303-3.2.91-.914.607-1.37 1.573-1.37 2.898 0 1.325.456 2.29 1.37 2.898.914.607 1.98.91 3.2.91 1.22 0 2.286-.303 3.2-.91.914-.607 1.37-1.573 1.37-2.898 0-1.325-.456-2.29-1.37-2.898zm-3.2 6.17c-.914 0-1.664-.304-2.25-.91-.586-.607-.88-1.39-.88-2.35 0-.96.294-1.743.88-2.35.586-.606 1.336-.91 2.25-.91.914 0 1.664.304 2.25.91.586.607.88 1.39.88 2.35 0 .96-.294 1.743-.88 2.35-.586.606-1.336.91-2.25.91z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Behance</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Creative Portfolio</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </a>
                    )}

                    {user.dribbbleUrl && (
                      <a 
                        href={user.dribbbleUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300"
                      >
                        <div className="w-11 h-11 bg-slate-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.816zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.72C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Dribbble</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Design Showcase</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </a>
                    )}

                    {user.twitterUrl && (
                      <a 
                        href={user.twitterUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300"
                      >
                        <div className="w-11 h-11 bg-slate-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Twitter / X</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Social Network</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </a>
                    )}

                    {user.facebookUrl && (
                      <a 
                        href={user.facebookUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300"
                      >
                        <div className="w-11 h-11 bg-slate-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Facebook</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Social Network</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </a>
                    )}

                    {user.instagramUrl && (
                      <a 
                        href={user.instagramUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-300"
                      >
                        <div className="w-11 h-11 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Instagram</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Visual Content</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </a>
                    )}

                    {user.youtubeUrl && (
                      <a 
                        href={user.youtubeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300"
                      >
                        <div className="w-11 h-11 bg-slate-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">YouTube</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Video Content</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </a>
                    )}

                    {user.tiktokUrl && (
                      <a 
                        href={user.tiktokUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300"
                      >
                        <div className="w-11 h-11 bg-black dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">TikTok</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Short Videos</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </a>
                    )}

                    {user.otherSocialUrl && (
                      <a 
                        href={user.otherSocialUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300"
                      >
                        <div className="w-11 h-11 bg-gray-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">Other Platform</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Custom Link</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Work Experience */}
            {user.workExperience && user.workExperience.length > 0 && (
              <Card className="hover:border-l-4 hover:border-l-blue-500 transition-all duration-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Work Experience
                  </h3>
                  <div className="space-y-6">
                    {user.workExperience.map((work, index) => (
                      <div key={index} className="relative pl-8 pb-6 border-l-2 border-orange-200 dark:border-orange-800 last:border-l-0 last:pb-0">
                        <div className="absolute -left-3 top-0 w-6 h-6 bg-orange-500 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center">
                          <Briefcase className="w-3 h-3 text-white" />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                          <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{work.jobTitle}</h4>
                          <p className="text-orange-600 dark:text-orange-400 font-medium mb-2 flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {work.company}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {work.startDate} - {work.endDate || 'Present'}
                          </p>
                          {work.description && (
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{work.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {user.education && user.education.length > 0 && (
              <Card className="hover:border-l-4 hover:border-l-green-500 transition-all duration-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                    Education
                  </h3>
                  <div className="space-y-6">
                    {user.education.map((edu, index) => (
                      <div key={index} className="relative pl-8 pb-6 border-l-2 border-green-200 dark:border-green-800 last:border-l-0 last:pb-0">
                        <div className="absolute -left-3 top-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center">
                          <GraduationCap className="w-3 h-3 text-white" />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                          <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{edu.degree}</h4>
                          <p className="text-green-600 dark:text-green-400 font-medium mb-2 flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {edu.institution}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {edu.startDate} - {edu.endDate || 'Present'}
                          </p>
                          {edu.description && (
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{edu.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post}
                    onDelete={() => handleDeletePost(post.id)}
                    onCommentCountChange={handleCommentCountChange}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {isOwnProfile ? "You haven't posted anything yet" : `${user?.name} hasn't posted anything yet`}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {isOwnProfile ? "Share your thoughts and connect with the community!" : "Check back later for updates."}
                      </p>
                    </div>
                    {isOwnProfile && (
                      <Button className="mt-2">
                        Create Your First Post
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab Content - Temporarily Removed */}
          {/* {isOwnProfile && (
            <TabsContent value="settings" className="space-y-6">
              ... settings content removed ...
            </TabsContent>
          )} */}

          <TabsContent value="activity" className="space-y-4">
            <ActivityFeed 
              userId={userId as string} 
              userName={user?.name || ""}
              isOwnProfile={currentUser?.id === userId}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
