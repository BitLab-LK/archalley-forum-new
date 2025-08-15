"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Calendar, CheckCircle, ArrowLeft, Edit, MessageCircle, Phone, Mail, Building, Briefcase, GraduationCap, ExternalLink, Users, Trophy } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import PostCard from "@/components/post-card"
import ActivityFeed from "@/components/activity-feed"

interface User {
  id: string
  name: string
  email?: string
  image?: string
  profession?: string
  company?: string
  location?: string
  rank?: string
  posts: number
  upvotes: number
  joinDate: string
  isVerified: boolean
  bio?: string
  
  // Additional comprehensive fields
  firstName?: string
  lastName?: string
  phoneNumber?: string
  headline?: string
  skills?: string[]
  industry?: string
  country?: string
  city?: string
  portfolioUrl?: string
  linkedinUrl?: string
  facebookUrl?: string
  instagramUrl?: string
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
    author: string
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if the current user is viewing their own profile
  const isOwnProfile = currentUser?.id === userId

  // Check if we're coming from an edit (to force refresh)
  const wasUpdated = searchParams.get('updated')

  // Calculate total comments and votes for user's posts
  const totalComments = posts.reduce((sum, post) => sum + post.comments, 0)
  const totalUpvotes = posts.reduce((sum, post) => sum + post.upvotes, 0)
  const totalDownvotes = posts.reduce((sum, post) => sum + post.downvotes, 0)

  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId))
  }

  // Handle comment count changes - this will trigger recalculation of totals
  const handleCommentCountChange = (postId: string, newCount: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, comments: newCount }
        : post
    ))
  }

  // Handle vote changes - this will trigger recalculation of totals
  const handleVoteChange = (postId: string, newUpvotes: number, newDownvotes: number, newUserVote: "up" | "down" | null) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote }
        : post
    ))
  }

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
        console.log('📸 User data fetched:', { id: userData.user?.id, image: userData.user?.image })
        setUser(userData.user) // Extract user from the response object

        // Fetch user's posts
        try {
          const postsResponse = await fetch(`/api/posts?authorId=${userId}${cacheBuster}`)
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This user profile does not exist.'}</p>
          <Link href="/members">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Members
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/members">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Members
            </Button>
          </Link>
          {isOwnProfile && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This is your profile. You can edit your information and manage your settings.
            </p>
          )}
        </div>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.image || "/placeholder-user.jpg"} alt={user.name} />
                <AvatarFallback className="text-2xl">
                  {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                    {user.isVerified && (
                      <CheckCircle className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                  
                  {isOwnProfile && (
                    <Link href={`/profile/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                  )}
                  {!isOwnProfile && (
                    <Badge variant="outline">
                      Public Profile
                    </Badge>
                  )}
                </div>

                {(user.city || user.country || user.location) && (
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>
                      {user.city && user.country 
                        ? `${user.city}, ${user.country}`
                        : user.location || user.city || user.country
                      }
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-4">
                  {user.rank && (
                    <Badge variant="secondary">{user.rank}</Badge>
                  )}
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
                    {user.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                        <span className="text-gray-900 dark:text-white font-medium">{user.phoneNumber}</span>
                      </div>
                    )}
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
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="settings">Settings</TabsTrigger>}
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Professional Information */}
            <Card className="hover:border-l-4 hover:border-l-blue-500 transition-all duration-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Professional Information
                </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Profession</label>
                        <p className="text-gray-900 dark:text-white font-medium">{user.profession || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    {user.company && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                          <Building className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</label>
                          <p className="text-gray-900 dark:text-white font-medium">{user.company}</p>
                        </div>
                      </div>
                    )}
                    
                    {user.industry && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                          <Building className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Industry</label>
                          <p className="text-gray-900 dark:text-white font-medium">{user.industry}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <MapPin className="w-4 h-4 text-orange-600" />
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
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <Trophy className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Rank</label>
                        <p className="text-gray-900 dark:text-white font-medium">{user.rank || 'New Member'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            {/* Skills Section */}
            {user.skills && user.skills.length > 0 && (
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-600" />
                    Skills & Expertise
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {user.skills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 dark:from-orange-900 dark:to-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700 hover:shadow-md transition-all duration-200"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bio Section */}
            {user.bio && (
              <Card className="hover:border-l-4 hover:border-l-green-500 transition-all duration-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    About
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
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

            {/* Social Links & Portfolio */}
            {(user.email || user.portfolioUrl || user.linkedinUrl || user.facebookUrl || user.instagramUrl) && (
              <Card className="hover:border-l-4 hover:border-l-purple-500 transition-all duration-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-purple-600" />
                    Links & Portfolio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.email && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg hover:shadow-md transition-all duration-200">
                        <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                          <a 
                            href={`mailto:${user.email}`}
                            className="block text-blue-600 dark:text-blue-400 hover:underline font-medium truncate max-w-48"
                          >
                            {user.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {user.portfolioUrl && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg hover:shadow-md transition-all duration-200">
                        <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-lg">
                          <ExternalLink className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Portfolio</label>
                          <a 
                            href={user.portfolioUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block text-purple-600 dark:text-purple-400 hover:underline font-medium truncate max-w-48"
                          >
                            {user.portfolioUrl.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    )}
                    {user.linkedinUrl && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg hover:shadow-md transition-all duration-200">
                        <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">LinkedIn</label>
                          <a 
                            href={user.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block text-blue-600 dark:text-blue-400 hover:underline font-medium truncate max-w-48"
                          >
                            {user.linkedinUrl.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    )}
                    {user.facebookUrl && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg hover:shadow-md transition-all duration-200">
                        <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Facebook</label>
                          <a 
                            href={user.facebookUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block text-blue-600 dark:text-blue-400 hover:underline font-medium truncate max-w-48"
                          >
                            {user.facebookUrl.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    )}
                    {user.instagramUrl && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 rounded-lg hover:shadow-md transition-all duration-200">
                        <div className="p-2 bg-pink-200 dark:bg-pink-800 rounded-lg">
                          <ExternalLink className="w-4 h-4 text-pink-600" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Instagram</label>
                          <a 
                            href={user.instagramUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block text-pink-600 dark:text-pink-400 hover:underline font-medium truncate max-w-48"
                          >
                            {user.instagramUrl.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    )}
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
                    onVoteChange={handleVoteChange}
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

          {isOwnProfile && (
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <Button variant="outline" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile Information
                      </Button>
                    </div>
                    <div>
                      <Button variant="outline" className="w-full">
                        Change Profile Picture
                      </Button>
                    </div>
                    <div>
                      <Button variant="outline" className="w-full">
                        Privacy Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

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
