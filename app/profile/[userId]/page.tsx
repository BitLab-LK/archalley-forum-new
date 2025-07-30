"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Calendar, CheckCircle, ArrowLeft, Edit, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import PostCard from "@/components/post-card"

interface User {
  id: string
  name: string
  email?: string // Made optional since it's only shown for own profile
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
    isBestAnswer: boolean
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.userId as string
  const { user: currentUser } = useAuth() // Get current logged-in user
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if the current user is viewing their own profile
  const isOwnProfile = currentUser?.id === userId

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
  const handleVoteChange = (postId: string, newUpvotes: number, newDownvotes: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, upvotes: newUpvotes, downvotes: newDownvotes }
        : post
    ))
  }

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${userId}`)
        
        if (!response.ok) {
          throw new Error('User not found')
        }

        const userData = await response.json()
        setUser(userData.user) // Extract user from the response object

        // Fetch user's posts
        const postsResponse = await fetch(`/api/posts?authorId=${userId}`)
        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          // Use the posts data directly as it comes from the API with proper formatting
          setPosts(postsData.posts || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchUserProfile()
    }
  }, [userId])

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
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                  {!isOwnProfile && (
                    <Badge variant="outline">
                      Public Profile
                    </Badge>
                  )}
                </div>

                {user.profession && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                    {user.profession}{user.company && ` at ${user.company}`}
                  </p>
                )}

                {user.location && (
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{user.location}</span>
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
              </div>
            </div>

            {user.bio && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300">{user.bio}</p>
              </div>
            )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    {user.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                        <p className="text-blue-600 dark:text-blue-400">{user.email}</p>
                      </div>
                    )}
                    {user.location && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</label>
                        <p className="text-gray-900 dark:text-white">{user.location}</p>
                      </div>
                    )}
                    {!user.email && !user.location && (
                      <p className="text-gray-500 dark:text-gray-400">No contact information available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
                  <div className="space-y-3">
                    {user.profession && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Profession</label>
                        <p className="text-gray-900 dark:text-white">{user.profession}</p>
                      </div>
                    )}
                    {user.company && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</label>
                        <p className="text-gray-900 dark:text-white">{user.company}</p>
                      </div>
                    )}
                    {user.rank && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Rank</label>
                        <p className="text-gray-900 dark:text-white">{user.rank}</p>
                      </div>
                    )}
                    {!user.profession && !user.company && (
                      <p className="text-gray-500 dark:text-gray-400">No professional information available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bio Section */}
            {user.bio && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">About</h3>
                  <p className="text-gray-700 dark:text-gray-300">{user.bio}</p>
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
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Activity feed coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
