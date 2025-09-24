"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, MessageSquare, TrendingUp, Eye, Edit, Trash2, Save, Tag, Flag, Pin, Lock, Search, Filter, MoreHorizontal, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useSocket } from "@/lib/socket-context"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DashboardStats {
  totalUsers: number
  totalPosts: number
  totalComments: number
  activeUsers: number
  recentPosts?: number
  timestamp?: string
  success?: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  joinDate: string
  lastLogin: string
  postCount: number
  commentCount: number
  image?: string
}

interface Settings {
  siteTitle: string
  siteDescription: string
  siteKeywords: string
  smtpHost: string
  smtpPort: string
  smtpUsername: string
  smtpPassword: string
  primaryColor: string
  secondaryColor: string
  headerLinks: string
  footerCopyright: string
  enableRegistration: string
  enableComments: string
  enableFileUploads: string
  maxFileSize: string
  allowedFileTypes: string
  maintenanceMode: string
  maintenanceMessage: string
  googleAnalyticsId: string
  recaptchaSiteKey: string
  recaptchaSecretKey: string
  openaiApiKey: string
  geminiApiKey: string
}

interface Page {
  id: string
  title: string
  slug: string
  content: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  description: string
  color: string
  icon: string
  slug: string
  postCount: number
  createdAt: string
  updatedAt: string
}

interface Post {
  id: string
  title: string
  content: string
  author: {
    name: string
    email: string
    image?: string
    role: string
  }
  category: {
    name: string
    color: string
    icon: string
  } | null
  stats: {
    comments: number
    votes: number
    flags: number
  }
  flags: Array<{
    id: string
    reason: string
    status: string
    createdAt: string
    users: {
      name: string
      email: string
    }
  }>
  status: {
    isAnonymous: boolean
    isPinned: boolean
    isLocked: boolean
    isFlagged: boolean
  }
  createdAt: string
  updatedAt: string
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("statistics")
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    activeUsers: 0
  })
  const [statsError, setStatsError] = useState<string | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [settings, setSettings] = useState<Settings>({} as Settings)
  const [pages, setPages] = useState<Page[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [postSearchTerm, setPostSearchTerm] = useState("")
  const [postStatusFilter, setPostStatusFilter] = useState("all")
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set())
  const [statsRefreshing, setStatsRefreshing] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
  const { socket, isConnected } = useSocket()
  const { confirm } = useConfirmDialog()
  const router = useRouter()

  // Early security check - redirect immediately if not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.replace("/")
      return
    }
  }, [user, authLoading, router])

  // Fetch dashboard data effect - must be declared before any early returns
  useEffect(() => {

    const fetchDashboardData = async () => {
      try {
        // Fetch stats separately for better error handling
        const fetchStats = async () => {
          try {
            setStatsLoading(true)
            const response = await fetch("/api/admin/stats")
            if (!response.ok) {
              throw new Error(`Stats API error: ${response.status}`)
            }
            const data = await response.json()
            setStats(data)
            setStatsError(null)
          } catch (error) {
            console.error("Error fetching stats:", error)
            setStatsError(error instanceof Error ? error.message : "Failed to load statistics")
            toast.error("Failed to load statistics")
          } finally {
            setStatsLoading(false)
          }
        }

        // Fetch other data in parallel
        const [usersResponse, settingsResponse, pagesResponse, categoriesResponse, postsResponse] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/settings"),
          fetch("/api/admin/pages"),
          fetch("/api/admin/categories"),
          fetch("/api/admin/posts"),
          fetchStats() // Run stats fetch in parallel
        ])

        // Handle other responses
        if (!usersResponse.ok || !settingsResponse.ok || !pagesResponse.ok) {
          throw new Error("Failed to fetch some dashboard data")
        }

        const [usersData, settingsData, pagesData] = await Promise.all([
          usersResponse.json(),
          settingsResponse.json(),
          pagesResponse.json()
        ])

        const usersList = usersData.users || []
        setUsers(usersList)
        setFilteredUsers(usersList)
        setSettings(settingsData || {})
        setPages(pagesData.pages || [])

        // Handle categories and posts separately to avoid blocking main UI
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.categories || [])
        }
        setCategoriesLoading(false)

        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          const postsList = postsData.posts || []
          setPosts(postsList)
          setFilteredPosts(postsList)
        }
        setPostsLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.error("Failed to load some dashboard components")
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch data if user is admin
    if (user && user.role === "ADMIN") {
      fetchDashboardData()
    }
  }, [user, router])

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [users, searchTerm])

  // Filter posts based on search term and status
  useEffect(() => {
    let filtered = posts

    // Apply status filter
    if (postStatusFilter !== 'all') {
      filtered = filtered.filter(post => {
        switch (postStatusFilter) {
          case 'flagged':
            return post.status.isFlagged
          case 'pinned':
            return post.status.isPinned
          case 'locked':
            return post.status.isLocked
          default:
            return true
        }
      })
    }

    // Apply search filter
    if (postSearchTerm.trim()) {
      filtered = filtered.filter(post => 
        post.title?.toLowerCase().includes(postSearchTerm.toLowerCase()) ||
        post.content?.toLowerCase().includes(postSearchTerm.toLowerCase()) ||
        post.author.name.toLowerCase().includes(postSearchTerm.toLowerCase())
      )
    }

    setFilteredPosts(filtered)
  }, [posts, postSearchTerm, postStatusFilter])

  // Manual refresh function for stats
  const refreshStats = useCallback(async () => {
    if (statsRefreshing) return
    
    setStatsRefreshing(true)
    try {
      const response = await fetch("/api/admin/stats")
      if (!response.ok) {
        throw new Error(`Stats API error: ${response.status}`)
      }
      const data = await response.json()
      setStats(data)
      setStatsError(null)
      toast.success("Stats refreshed successfully")
    } catch (error) {
      console.error("Error refreshing stats:", error)
      setStatsError(error instanceof Error ? error.message : "Failed to refresh statistics")
      toast.error("Failed to refresh stats")
    } finally {
      setStatsRefreshing(false)
    }
  }, [statsRefreshing])

  // Socket.IO real-time stats updates
  useEffect(() => {
    if (!socket || !isConnected || !user || user.role !== "ADMIN") {
      return
    }

    // Join the admin stats room
    socket.emit('join-admin-stats')

    // Listen for stats updates
    const handleStatsUpdate = (data: { stats: DashboardStats; eventType: string; timestamp: string }) => {
      console.log('📊 Received real-time stats update:', data.eventType, data.stats)
      setStats(data.stats)
      setStatsError(null)
      
      // Show a subtle notification for the update
      const eventMessages = {
        user_created: 'New user registered',
        user_deleted: 'User account deleted',
        post_created: 'New post published',
        post_deleted: 'Post deleted',
        comment_created: 'New comment added',
        comment_deleted: 'Comment deleted'
      }
      
      const message = eventMessages[data.eventType as keyof typeof eventMessages] || 'Stats updated'
      toast.success(`${message} - Stats refreshed`, {
        duration: 3000,
        position: 'bottom-right'
      })
    }

    socket.on('stats-update', handleStatsUpdate)

    // Handle socket errors
    const handleSocketError = (error: any) => {
      console.warn('Socket.IO error in admin stats:', error)
    }

    socket.on('error', handleSocketError)

    // Cleanup
    return () => {
      socket.off('stats-update', handleStatsUpdate)
      socket.off('error', handleSocketError)
      socket.emit('leave-admin-stats')
    }
  }, [socket, isConnected, user])

  // Don't render anything if user is not admin (after all hooks are declared)
  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const handleSettingsSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      toast.success("Settings saved successfully")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUserRoleUpdate = async (userId: string, newRole: string) => {
    // Prevent multiple simultaneous updates
    if (loadingUsers.has(userId)) {
      return
    }

    // Add to loading set
    setLoadingUsers(prev => new Set([...prev, userId]))

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to update user role: ${response.status} ${errorData}`)
      }

      await response.json() // Consume response
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))

      toast.success(`User role updated to ${newRole} successfully`)
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update user role")
      
      // Revert the role change in UI if it failed
      // Force a re-render to show the original role
      setUsers([...users])
    } finally {
      // Remove from loading set
      setLoadingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleUserDelete = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId)
    
    const confirmed = await confirm({
      title: "Delete User",
      description: `Are you sure you want to delete ${userToDelete?.name || 'this user'}? This will permanently delete their account, posts, and comments. This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    })
    
    if (!confirmed) {
      return
    }

    // Prevent multiple simultaneous deletions
    if (loadingUsers.has(userId)) {
      return
    }

    // Add to loading set
    setLoadingUsers(prev => new Set([...prev, userId]))

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to delete user: ${response.status} ${errorData}`)
      }

      // Update local state
      setUsers(users.filter(user => user.id !== userId))
      toast.success(`User ${userToDelete?.name || 'account'} deleted successfully`)
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete user")
    } finally {
      // Remove from loading set
      setLoadingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your forum settings and content</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 gap-1">
            <TabsTrigger value="statistics" className="text-xs sm:text-sm">Stats</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
            <TabsTrigger value="posts" className="text-xs sm:text-sm">Posts</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs sm:text-sm">Permissions</TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs sm:text-sm">Appearance</TabsTrigger>
            <TabsTrigger value="pages" className="text-xs sm:text-sm">Pages</TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4 sm:space-y-6">
            {/* Stats Header with Refresh Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold">Dashboard Statistics</h2>
                <p className="text-sm text-muted-foreground">
                  Real-time forum metrics {isConnected ? '(Live Updates Active)' : '(Live Updates Disconnected)'}
                </p>
                {stats.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {new Date(stats.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
              <Button 
                onClick={refreshStats} 
                disabled={statsRefreshing || statsLoading}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${statsRefreshing ? 'animate-spin' : ''}`} />
                {statsRefreshing ? 'Refreshing...' : 'Refresh Stats'}
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  {statsLoading ? (
                    <div className="space-y-2">
                      <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    </div>
                  ) : statsError ? (
                    <div className="space-y-1">
                      <div className="text-lg sm:text-2xl font-bold text-red-500">--</div>
                      <p className="text-xs text-red-500">Error loading</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-lg sm:text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Active forum members</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Posts</CardTitle>
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  {statsLoading ? (
                    <div className="space-y-2">
                      <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    </div>
                  ) : statsError ? (
                    <div className="space-y-1">
                      <div className="text-lg sm:text-2xl font-bold text-red-500">--</div>
                      <p className="text-xs text-red-500">Error loading</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-lg sm:text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Forum discussions</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Comments</CardTitle>
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  {statsLoading ? (
                    <div className="space-y-2">
                      <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    </div>
                  ) : statsError ? (
                    <div className="space-y-1">
                      <div className="text-lg sm:text-2xl font-bold text-red-500">--</div>
                      <p className="text-xs text-red-500">Error loading</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-lg sm:text-2xl font-bold">{stats.totalComments.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">User interactions</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-2">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    </div>
                  ) : statsError ? (
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-red-500">--</div>
                      <p className="text-xs text-red-500">Error loading</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Active in last 24 hours</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest forum registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.image || "/placeholder.svg?height=32&width=32"} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            user.role === "ADMIN" ? "default" : user.role === "MODERATOR" ? "secondary" : "outline"
                          }
                        >
                          {user.role}
                        </Badge>
                        <span className="text-sm text-gray-500">{user.joinDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                  <CardDescription>Configure search engine optimization settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="site-title">Site Title</Label>
                    <Input
                      id="site-title"
                      value={settings.siteTitle || ""}
                      onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-description">Site Description</Label>
                    <Textarea
                      id="site-description"
                      value={settings.siteDescription || ""}
                      onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input
                      id="keywords"
                      value={settings.siteKeywords || ""}
                      onChange={(e) => setSettings({ ...settings, siteKeywords: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SMTP Settings</CardTitle>
                  <CardDescription>Configure email server settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
                      value={settings.smtpHost || ""}
                      onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input
                      id="smtp-port"
                      value={settings.smtpPort || ""}
                      onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">Username</Label>
                    <Input
                      id="smtp-username"
                      value={settings.smtpUsername || ""}
                      onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Password</Label>
                    <Input
                      id="smtp-password"
                      type="password"
                      value={settings.smtpPassword || ""}
                      onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                      placeholder="Your app password"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Configure AI service API keys</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      value={settings.openaiApiKey || ""}
                      onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                      placeholder="sk-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                    <Input
                      id="gemini-key"
                      type="password"
                      value={settings.geminiApiKey || ""}
                      onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                      placeholder="AIza..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Forum Settings</CardTitle>
                  <CardDescription>Configure general forum settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-registration">Enable Registration</Label>
                    <Switch
                      id="enable-registration"
                      checked={settings.enableRegistration === "true"}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, enableRegistration: checked.toString() })
                      }
                    />
                  </div>
                    <div className="flex items-center justify-between">
                    <Label htmlFor="enable-comments">Enable Comments</Label>
                    <Switch
                      id="enable-comments"
                      checked={settings.enableComments === "true"}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, enableComments: checked.toString() })
                      }
                    />
                  </div>
                    <div className="flex items-center justify-between">
                    <Label htmlFor="enable-file-uploads">Enable File Uploads</Label>
                    <Switch
                      id="enable-file-uploads"
                      checked={settings.enableFileUploads === "true"}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, enableFileUploads: checked.toString() })
                      }
                    />
                  </div>
                    <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <Switch
                      id="maintenance-mode"
                      checked={settings.maintenanceMode === "true"}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, maintenanceMode: checked.toString() })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSettingsSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Settings"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage forum users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Input 
                      placeholder="Search users by name, email, or role..." 
                      className="max-w-sm" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <div className="text-sm text-gray-500">
                        {filteredUsers.length} of {users.length} users
                      </div>
                    )}
                  </div>

                  <div className="border rounded-lg">
                    <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b">
                      <div>User</div>
                      <div>Email</div>
                      <div>Role</div>
                      <div>Join Date</div>
                      <div>Last Login</div>
                      <div>Actions</div>
                    </div>

                    {filteredUsers.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        {searchTerm ? `No users found matching "${searchTerm}"` : "No users found"}
                      </div>
                    ) : (
                      filteredUsers.map((user) => {
                        const isLoading = loadingUsers.has(user.id)
                        return (
                          <div key={user.id} className={`grid grid-cols-6 gap-4 p-4 border-b last:border-b-0 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={user.image || "/placeholder.svg?height=32&width=32"} />
                                <AvatarFallback>{user.name?.[0] || '?'}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-xs text-gray-500">{user.postCount} posts, {user.commentCount} comments</span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center">
                              <select
                                value={user.role}
                                onChange={(e) => handleUserRoleUpdate(user.id, e.target.value)}
                                disabled={isLoading || user.id === user?.id} // Prevent admin from changing their own role
                                className="bg-transparent border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="MEMBER">Member</option>
                                <option value="MODERATOR">Moderator</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                              {isLoading && <div className="ml-2 w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">{user.joinDate}</div>
                            <div className="flex items-center text-sm text-gray-600">{user.lastLogin}</div>
                            <div className="flex space-x-2 items-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUserDelete(user.id)}
                                disabled={isLoading || user.id === user?.id} // Prevent admin from deleting themselves
                                className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isLoading ? (
                                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Management</CardTitle>
                <CardDescription>Create and manage forum pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Existing Pages</h4>
                    <Button onClick={() => router.push("/admin/pages/new")}>Create New Page</Button>
                  </div>

                  <div className="space-y-2">
                    {pages.map((page) => (
                      <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{page.title}</div>
                          <div className="text-sm text-gray-500">/{page.slug}</div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant={page.isPublished ? "default" : "secondary"}>
                            {page.isPublished ? "Published" : "Draft"}
                          </Badge>
                        <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/admin/pages/${page.id}/edit`)}
                            >
                            <Edit className="w-4 h-4" />
                          </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/${page.slug}`)}
                            >
                            <Eye className="w-4 h-4" />
                          </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Category Management
                </CardTitle>
                <CardDescription>Create and manage forum categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Categories ({categories.length})</h4>
                    <Button>Create New Category</Button>
                  </div>

                  {categoriesLoading ? (
                    <div className="text-center py-8">Loading categories...</div>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: category.color }}
                            />
                            <div className="space-y-1">
                              <div className="font-medium">{category.name}</div>
                              <div className="text-sm text-gray-500">{category.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge variant="secondary">
                              {category.postCount} posts
                            </Badge>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Post Moderation
                </CardTitle>
                <CardDescription>Moderate and manage forum posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search posts..."
                          value={postSearchTerm}
                          onChange={(e) => setPostSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={postStatusFilter}
                        onChange={(e) => setPostStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="all">All Posts</option>
                        <option value="flagged">Flagged</option>
                        <option value="pinned">Pinned</option>
                        <option value="locked">Locked</option>
                      </select>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Posts ({filteredPosts.length})</h4>
                  </div>

                  {postsLoading ? (
                    <div className="text-center py-8">Loading posts...</div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPosts.map((post) => (
                        <div key={post.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium text-lg">{post.title}</h5>
                                {post.status.isPinned && (
                                  <Badge variant="default" className="text-xs">
                                    <Pin className="w-3 h-3 mr-1" />
                                    Pinned
                                  </Badge>
                                )}
                                {post.status.isLocked && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Locked
                                  </Badge>
                                )}
                                {post.status.isFlagged && (
                                  <Badge variant="destructive" className="text-xs">
                                    <Flag className="w-3 h-3 mr-1" />
                                    Flagged ({post.stats.flags})
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 line-clamp-2">
                                {post.content}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>By {post.author.name}</span>
                                {post.category && (
                                  <span className="flex items-center gap-1">
                                    <div 
                                      className="w-2 h-2 rounded" 
                                      style={{ backgroundColor: post.category.color }}
                                    />
                                    {post.category.name}
                                  </span>
                                )}
                                <span>{post.stats.comments} comments</span>
                                <span>{post.stats.votes} votes</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {post.flags.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                              <h6 className="font-medium text-red-800 text-sm mb-2">Flags ({post.flags.length})</h6>
                              <div className="space-y-1">
                                {post.flags.map((flag) => (
                                  <div key={flag.id} className="text-xs text-red-700">
                                    <span className="font-medium">{flag.reason}</span> by {flag.users.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
