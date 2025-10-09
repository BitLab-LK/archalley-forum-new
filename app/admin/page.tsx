"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, MessageSquare, TrendingUp, Eye, EyeOff, Edit, Trash2, Save, Tag, Flag, Pin, Lock, Search, Filter, MoreHorizontal, RefreshCw, Crown, Clock, BarChart } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useSocket } from "@/lib/socket-context"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { checkSuperAdminPrivileges } from "@/lib/super-admin-utils"
import { getRolePermissions, getAvailableTabs, getDefaultTab, getRoleInfo, type UserRole } from "@/lib/role-permissions"

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
  isActive?: boolean
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
  color: string
  slug: string
  postCount: number
  actualPostCount?: number
  createdAt: string
  updatedAt: string
}

interface Post {
  id: string
  content: string
  images?: string[]
  author: {
    name: string
    email: string
    image?: string
    role: string
  }
  category: {
    name: string
    color: string
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
    isHidden: boolean
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
  
  // Post moderation states
  const [moderatingPosts, setModeratingPosts] = useState<Set<string>>(new Set())
  const [deletingPosts, setDeletingPosts] = useState<Set<string>>(new Set())
  const [editingPost, setEditingPost] = useState<any>(null)
  const [editingPostData, setEditingPostData] = useState({ content: '', primaryCategoryId: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [viewingPost, setViewingPost] = useState<any>(null)
  const [loadingFullPost, setLoadingFullPost] = useState(false)
  
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#E0F2FE',
    slug: ''
  })
  const [categorySaving, setCategorySaving] = useState(false)
  const [deletingCategories, setDeletingCategories] = useState<Set<string>>(new Set())
  const { user: authenticatedUser, isLoading: authLoading } = useAuth()
  const { socket, isConnected } = useSocket()
  const { confirm } = useConfirmDialog()
  const router = useRouter()
  
  // Role-based permissions
  const userRole = (authenticatedUser?.role || 'MEMBER') as UserRole
  const permissions = getRolePermissions(userRole)
  const roleInfo = getRoleInfo(userRole)
  const availableTabs = getAvailableTabs(userRole)
  const defaultTab = getDefaultTab(userRole)
  
  // Super admin privileges check
  const superAdminPrivileges = checkSuperAdminPrivileges(authenticatedUser)

  // Early security check - redirect immediately if not admin, super admin, or moderator
  useEffect(() => {
    if (!authLoading && (!authenticatedUser || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(authenticatedUser.role || ''))) {
      router.replace("/")
      return
    }
  }, [authenticatedUser, authLoading, router])

  // Set default tab based on role permissions
  useEffect(() => {
    if (authenticatedUser && availableTabs.length > 0 && activeTab === "statistics" && !availableTabs.includes("statistics")) {
      setActiveTab(defaultTab)
    }
  }, [authenticatedUser, availableTabs, defaultTab, activeTab])

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

        // Handle each response individually to prevent one failure from blocking others
        
        // Handle users
        if (usersResponse.ok) {
          try {
            const usersData = await usersResponse.json()
            const usersList = usersData.users || []
            setUsers(usersList)
            setFilteredUsers(usersList)
          } catch (error) {
            console.error("Error processing users data:", error)
            toast.error("Failed to load users")
          }
        } else {
          console.error("Users API failed:", usersResponse.status)
          toast.error("Failed to load users")
        }

        // Handle settings
        if (settingsResponse.ok) {
          try {
            const settingsData = await settingsResponse.json()
            setSettings(settingsData || {})
          } catch (error) {
            console.error("Error processing settings data:", error)
            toast.error("Failed to load settings")
          }
        } else {
          console.error("Settings API failed:", settingsResponse.status)
        }

        // Handle pages
        if (pagesResponse.ok) {
          try {
            const pagesData = await pagesResponse.json()
            setPages(pagesData.pages || [])
          } catch (error) {
            console.error("Error processing pages data:", error)
            toast.error("Failed to load pages")
          }
        } else {
          console.error("Pages API failed:", pagesResponse.status)
        }

        // Handle categories - ALWAYS process this regardless of other failures
        if (categoriesResponse.ok) {
          try {
            const categoriesData = await categoriesResponse.json()
            setCategories(categoriesData.categories || [])
            console.log("✅ Categories loaded:", categoriesData.categories?.length || 0)
          } catch (error) {
            console.error("Error processing categories data:", error)
            toast.error("Failed to load categories")
          }
        } else {
          console.error("Categories API failed:", categoriesResponse.status)
          toast.error("Failed to load categories")
        }
        setCategoriesLoading(false)

        // Handle posts
        if (postsResponse.ok) {
          try {
            const postsData = await postsResponse.json()
            const postsList = postsData.posts || []
            setPosts(postsList)
            setFilteredPosts(postsList)
          } catch (error) {
            console.error("Error processing posts data:", error)
            toast.error("Failed to load posts")
          }
        } else {
          console.error("Posts API failed:", postsResponse.status)
        }
        setPostsLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.error("Failed to load some dashboard components")
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch data if user is admin or super admin
    if (authenticatedUser && superAdminPrivileges.isAdmin) {
      fetchDashboardData()
    }
  }, [authenticatedUser, router, superAdminPrivileges.isAdmin])

  // Function to refresh users list from server
  const refreshUsersList = useCallback(async () => {
    try {
      console.log('🔄 Refreshing users list from server...')
      const usersResponse = await fetch("/api/admin/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const usersList = usersData.users || []
        setUsers(usersList)
        
        // Preserve search filtering if active
        if (searchTerm.trim()) {
          const filtered = usersList.filter((user: User) => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase())
          )
          setFilteredUsers(filtered)
        } else {
          setFilteredUsers(usersList)
        }
        console.log('✅ Users list refreshed successfully')
      }
    } catch (error) {
      console.warn('❌ Failed to refresh users list:', error)
    }
  }, [searchTerm])

  // Periodic refresh for Recent Users to keep active indicators updated
  useEffect(() => {
    if (!authenticatedUser || !superAdminPrivileges.isAdmin) return

    // Refresh every 30 seconds to keep active indicators up-to-date
    const interval = setInterval(refreshUsersList, 30000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [authenticatedUser, refreshUsersList])

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
        post.content?.toLowerCase().includes(postSearchTerm.toLowerCase()) ||
        post.author.name.toLowerCase().includes(postSearchTerm.toLowerCase())
      )
    }

    setFilteredPosts(filtered)
  }, [posts, postSearchTerm, postStatusFilter])

  // Manual refresh function for stats and recent users
  const refreshStats = useCallback(async () => {
    if (statsRefreshing) return
    
    setStatsRefreshing(true)
    try {
      // Fetch both stats and users data in parallel
      const [statsResponse, usersResponse] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users")
      ])
      
      if (!statsResponse.ok) {
        throw new Error(`Stats API error: ${statsResponse.status}`)
      }
      
      const statsData = await statsResponse.json()
      setStats(statsData)
      setStatsError(null)
      
      // Update users list if users API succeeded
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const usersList = usersData.users || []
        setUsers(usersList)
        setFilteredUsers(usersList)
        toast.success("Stats and Recent Users refreshed successfully")
      } else {
        // Stats updated but users failed
        toast.success("Stats refreshed successfully (Recent Users refresh failed)")
      }
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
    if (!socket || !isConnected || !authenticatedUser || !superAdminPrivileges.isAdmin) {
      return
    }

    // Join the admin stats room
    socket.emit('join-admin-stats')

    // Listen for stats updates
    const handleStatsUpdate = async (data: { stats: DashboardStats; eventType: string; timestamp: string }) => {
      console.log('📊 Received real-time stats update:', data.eventType, data.stats)
      setStats(data.stats)
      setStatsError(null)
      
      // For user-related events, also refresh the Recent Users list to update active indicators
      if (data.eventType === 'user_created' || data.eventType === 'user_deleted' || data.eventType === 'user_role_updated' || data.eventType.includes('user')) {
        try {
          const usersResponse = await fetch("/api/admin/users")
          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            const usersList = usersData.users || []
            setUsers(usersList)
            // Preserve search filtering if active
            if (searchTerm.trim()) {
              const filtered = usersList.filter((user: User) => 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.role.toLowerCase().includes(searchTerm.toLowerCase())
              )
              setFilteredUsers(filtered)
            } else {
              setFilteredUsers(usersList)
            }
          }
        } catch (error) {
          console.warn('Failed to refresh users list after real-time update:', error)
        }
      }
      
      // Show a subtle notification for the update
      const eventMessages = {
        user_created: 'New user registered',
        user_deleted: 'User account deleted',
        user_role_updated: 'User role updated',
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
  }, [socket, isConnected, authenticatedUser, superAdminPrivileges.isAdmin])

  // Debug editingPost state changes
  useEffect(() => {
    if (editingPost) {
      console.log('� Post editing started:', editingPost.id)
    }
  }, [editingPost])

  // Don't render anything if user is not admin (after all hooks are declared)
  if (authLoading || !authenticatedUser || !superAdminPrivileges.isAdmin) {
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
    console.log(`🔄 Updating role for user ${userId} to ${newRole}`)
    
    // Prevent multiple simultaneous updates
    if (loadingUsers.has(userId)) {
      console.log(`⏳ Role update already in progress for user ${userId}`)
      return
    }

    // Add to loading set
    setLoadingUsers(prev => new Set([...prev, userId]))

    try {
      console.log(`📡 Sending PATCH request to /api/admin/users`)
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole })
      })

      console.log(`📨 Response status: ${response.status}`)

      if (!response.ok) {
        const errorData = await response.text()
        console.error(`❌ API Error: ${response.status} - ${errorData}`)
        throw new Error(`Failed to update user role: ${response.status} ${errorData}`)
      }

      const responseData = await response.json()
      console.log(`✅ Role update successful:`, responseData)
      
      // Refresh the entire user list from server to ensure data consistency
      await refreshUsersList()

      console.log(`🔄 User list refreshed after role update for user ${userId}`)
      toast.success(`User role updated to ${newRole} successfully`)
    } catch (error) {
      console.error("❌ Error updating user role:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update user role")
    } finally {
      // Remove from loading set
      setLoadingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
      console.log(`🏁 Role update process completed for user ${userId}`)
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

  // Category management handlers
  const handleCategoryCreate = () => {
    setEditingCategory(null)
    setCategoryForm({
      name: '',
      color: '#E0F2FE',
      slug: ''
    })
    setCategoryFormOpen(true)
  }

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      color: category.color,
      slug: category.slug
    })
    setCategoryFormOpen(true)
  }

  const generateSlug = (name: string) => {
    if (!name.trim()) return ''
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  const handleCategorySave = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required")
      return
    }

    if (!categoryForm.slug.trim()) {
      setCategoryForm(prev => ({ ...prev, slug: generateSlug(categoryForm.name) }))
      return
    }

    setCategorySaving(true)
    try {
      const url = "/api/admin/categories"
      const method = editingCategory ? "PATCH" : "POST"
      
      let body
      if (editingCategory) {
        // When editing, check if category has posts
        const hasPostsCount = (editingCategory.actualPostCount ?? editingCategory.postCount ?? 0)
        const hasAnyPosts = hasPostsCount > 0
        
        if (hasAnyPosts) {
          // If category has posts, only send color changes
          body = { 
            categoryId: editingCategory.id, 
            color: categoryForm.color 
          }
        } else {
          // If no posts, send all fields
          body = { 
            categoryId: editingCategory.id, 
            ...categoryForm 
          }
        }
      } else {
        // When creating new category, send all fields
        body = categoryForm
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Failed to ${editingCategory ? 'update' : 'create'} category`)
      }

      await response.json()
      
      // Refresh categories list
      const categoriesResponse = await fetch("/api/admin/categories")
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.categories || [])
      }

      toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`)
      setCategoryFormOpen(false)
      setEditingCategory(null)
    } catch (error) {
      console.error("Error saving category:", error)
      toast.error(error instanceof Error ? error.message : `Failed to ${editingCategory ? 'update' : 'create'} category`)
    } finally {
      setCategorySaving(false)
    }
  }

  const handleCategoryDelete = async (category: Category) => {
    const actualPostCount = category.actualPostCount ?? category.postCount
    
    const confirmed = await confirm({
      title: "Delete Category",
      description: `Are you sure you want to delete the "${category.name}" category? ${actualPostCount > 0 ? `This category has ${actualPostCount} posts and cannot be deleted.` : 'This action cannot be undone.'}`,
      confirmText: actualPostCount > 0 ? "OK" : "Delete",
      cancelText: "Cancel",
      variant: actualPostCount > 0 ? "default" : "destructive"
    })
    
    if (!confirmed || actualPostCount > 0) {
      if (actualPostCount > 0) {
        toast.error(`Cannot delete category with ${actualPostCount} posts. Move posts to another category first.`)
      }
      return
    }

    // Prevent multiple simultaneous deletions
    if (deletingCategories.has(category.id)) {
      return
    }

    // Add to loading set
    setDeletingCategories(prev => new Set([...prev, category.id]))

    try {
      const response = await fetch(`/api/admin/categories?categoryId=${category.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to delete category")
      }

      // Update local state
      setCategories(categories.filter(cat => cat.id !== category.id))
      toast.success(`Category "${category.name}" deleted successfully`)
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete category")
    } finally {
      // Remove from loading set
      setDeletingCategories(prev => {
        const newSet = new Set(prev)
        newSet.delete(category.id)
        return newSet
      })
    }
  }

  // ===== POST MODERATION FUNCTIONS =====
  
  const handlePostModeration = async (postId: string, action: string, value?: boolean) => {
    if (moderatingPosts.has(postId)) {
      return
    }

    setModeratingPosts(prev => new Set([...prev, postId]))

    try {
      const response = await fetch('/api/admin/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action, value })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to moderate post')
      }

      const result = await response.json()
      
      // Update local state
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const updatedPost = { ...post }
          
          switch (action) {
            case 'pin':
              updatedPost.status.isPinned = value!
              break
            case 'lock':
              updatedPost.status.isLocked = value!
              break
            case 'hide':
              updatedPost.status.isHidden = value!
              break
            case 'approve':
              updatedPost.status.isFlagged = false
              updatedPost.stats.flags = 0
              updatedPost.flags = []
              break
          }
          
          return updatedPost
        }
        return post
      }))

      // Update filtered posts as well
      setFilteredPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const updatedPost = { ...post }
          
          switch (action) {
            case 'pin':
              updatedPost.status.isPinned = value!
              break
            case 'lock':
              updatedPost.status.isLocked = value!
              break
            case 'hide':
              updatedPost.status.isHidden = value!
              break
            case 'approve':
              updatedPost.status.isFlagged = false
              updatedPost.stats.flags = 0
              updatedPost.flags = []
              break
          }
          
          return updatedPost
        }
        return post
      }))

      toast.success(result.message || 'Post moderated successfully')
    } catch (error) {
      console.error('Error moderating post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to moderate post')
    } finally {
      setModeratingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handlePostDelete = async (post: any) => {
    const postPreview = post.content?.substring(0, 50) + '...' || 'this post'
    const confirmed = await confirm({
      title: "Delete Post",
      description: `Are you sure you want to delete "${postPreview}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive"
    })

    if (!confirmed || deletingPosts.has(post.id)) {
      return
    }

    setDeletingPosts(prev => new Set([...prev, post.id]))

    try {
      const response = await fetch(`/api/admin/posts?postId=${post.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete post')
      }

      // Remove post from local state
      setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id))
      setFilteredPosts(prevPosts => prevPosts.filter(p => p.id !== post.id))

      toast.success('Post deleted successfully')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete post')
    } finally {
      setDeletingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(post.id)
        return newSet
      })
    }
  }

  const refreshPosts = async (statusFilter?: string, searchTerm?: string) => {
    setPostsLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      
      const url = `/api/admin/posts${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        setFilteredPosts(data.posts || [])
      } else {
        throw new Error('Failed to fetch posts')
      }
    } catch (error) {
      console.error('Error refreshing posts:', error)
      toast.error('Failed to refresh posts')
    } finally {
      setPostsLoading(false)
    }
  }

  const handlePostEdit = async (post: any) => {
    try {
      console.log('Attempting to edit post:', post.id)
      
      // Fetch full post content for editing using admin API
      const response = await fetch(`/api/admin/posts/${post.id}`)
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`Failed to fetch full post: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Fetched post data:', data)
      const fullPost = data.post
      
      console.log('About to set editingPost to:', fullPost)
      
      const editData = {
        content: fullPost.content || '',
        primaryCategoryId: fullPost.category?.id || ''
      }
      
      console.log('About to set editingPostData to:', editData)
      
      // Set the editing state
      setEditingPost(fullPost)
      setEditingPostData(editData)
      
      // Auto-switch to Posts tab when editing a post
      setActiveTab('posts')
    } catch (error) {
      console.error('Error fetching full post for editing:', error)
      toast.error('Failed to load post for editing')
    }
  }

  const handlePostUpdate = async () => {
    if (!editingPost) return
    
    setSavingEdit(true)
    try {
      const response = await fetch(`/api/admin/posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'edit',
          data: editingPostData
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update post')
      }
      
      toast.success('Post updated successfully')
      setEditingPost(null)
      setEditingPostData({ content: '', primaryCategoryId: '' })
      await refreshPosts(postStatusFilter, postSearchTerm)
    } catch (error) {
      console.error('Error updating post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update post')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleViewFullPost = async (postId: string) => {
    setLoadingFullPost(true)
    try {
      const response = await fetch(`/api/admin/posts/${postId}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('View post error:', errorText)
        throw new Error(`Failed to fetch full post: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📄 Admin: Full post data received:', {
        id: data.post?.id,
        authorName: data.post?.author?.name,
        authorImage: data.post?.author?.image,
        hasAuthor: !!data.post?.author
      })
      setViewingPost(data.post)
    } catch (error) {
      console.error('Error fetching full post:', error)
      toast.error('Failed to load full post')
    } finally {
      setLoadingFullPost(false)
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

  // Debug render-time values (can be removed in production)
  console.log('🖼️ RENDER: editingPost exists:', !!editingPost)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Role-Based Header */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-yellow-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-yellow-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{roleInfo.icon}</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {roleInfo.name} Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {roleInfo.description}
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">Access Level:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  userRole === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                  userRole === 'MODERATOR' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {userRole.replace('_', ' ')}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, <span className="font-medium">{authenticatedUser?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {superAdminPrivileges.isSuperAdmin ? "Super Admin Dashboard" : "Admin Dashboard"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {superAdminPrivileges.isSuperAdmin 
                  ? "Full system control and user management" 
                  : "Manage your forum settings and content"
                }
              </p>
            </div>
            <div className="text-right">
              <Badge 
                variant="default"
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md ${superAdminPrivileges.isSuperAdmin ? "bg-red-500 text-white hover:bg-red-600" : "bg-yellow-500 text-white hover:bg-yellow-600"}`}
              >
                {superAdminPrivileges.isSuperAdmin && <Crown className="h-3 w-3" />}
                {superAdminPrivileges.isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
              </Badge>
              {!superAdminPrivileges.canManageUsers && (
                <p className="text-xs text-amber-600 mt-1">Limited privileges: Cannot manage users</p>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className={`grid w-full gap-1 ${availableTabs.length <= 4 ? `grid-cols-${availableTabs.length}` : `grid-cols-4 sm:grid-cols-${Math.min(availableTabs.length, 8)}`}`}>
            {availableTabs.includes('statistics') && (
              <TabsTrigger value="statistics" className="text-xs sm:text-sm">Stats</TabsTrigger>
            )}
            {availableTabs.includes('users') && (
              <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
            )}
            {availableTabs.includes('categories') && (
              <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
            )}
            {availableTabs.includes('posts') && (
              <TabsTrigger value="posts" className="text-xs sm:text-sm">Posts</TabsTrigger>
            )}
            {availableTabs.includes('settings') && (
              <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
            )}
            {availableTabs.includes('permissions') && (
              <TabsTrigger value="permissions" className="text-xs sm:text-sm">Permissions</TabsTrigger>
            )}
            {availableTabs.includes('appearance') && (
              <TabsTrigger value="appearance" className="text-xs sm:text-sm">Appearance</TabsTrigger>
            )}
            {availableTabs.includes('pages') && (
              <TabsTrigger value="pages" className="text-xs sm:text-sm">Pages</TabsTrigger>
            )}
          </TabsList>

          {/* Statistics Tab */}
          {permissions.canViewStatistics && (
            <TabsContent value="statistics" className="space-y-4 sm:space-y-6">
            {/* Stats Header with Refresh Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold">Dashboard Statistics</h2>
                <p className="text-sm text-muted-foreground">
                  Real-time forum metrics and user activity monitoring
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
                className="gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white hover:border-yellow-600 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${statsRefreshing ? 'animate-spin' : ''}`} />
                {statsRefreshing ? 'Refreshing...' : 'Refresh Stats'}
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
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
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
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
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Active Users</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
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
                      <div className="text-lg sm:text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Active in last 24 hours</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest forum registrations</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.image || "/placeholder.svg?height=40&width=40"} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          {user.isActive && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-white truncate" title={user.name}>
                              {user.name}
                            </p>
                            {user.isActive && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={user.email}>
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {user.postCount} posts, {user.commentCount} comments
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 flex-shrink-0">
                        <Badge
                          variant={
                            user.role === "SUPER_ADMIN" ? "default" : 
                            user.role === "ADMIN" ? "default" : 
                            user.role === "MODERATOR" ? "secondary" : "outline"
                          }
                          className={
                            user.role === "SUPER_ADMIN" ? "bg-red-500 text-white hover:bg-red-600" :
                            user.role === "ADMIN" ? "bg-yellow-500 text-white hover:bg-yellow-600" : ""
                          }
                        >
                          {user.role === "SUPER_ADMIN" ? "SUPER ADMIN" : user.role}
                        </Badge>
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                          <div className="mb-0.5">Joined: {user.joinDate}</div>
                          <div>Last seen: {user.lastLogin}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Settings Tab */}
          {permissions.canViewSettings && (
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
              {permissions.canChangeSettings && (
                <Button onClick={handleSettingsSave} disabled={isSaving} className="bg-yellow-500 hover:bg-yellow-600 text-white disabled:bg-yellow-300">
                  {isSaving ? "Saving..." : "Save Settings"}
                  <Save className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </TabsContent>
          )}

          {/* Users Tab */}
          {permissions.canViewUsers && (
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

                  <div className="border rounded-lg overflow-hidden">
                    <div className="hidden lg:grid grid-cols-6 gap-4 p-4 font-medium border-b bg-gray-50 dark:bg-gray-800">
                      <div className="text-center min-w-0">User</div>
                      <div className="text-center min-w-0">Email</div>
                      <div className="text-center">Role</div>
                      <div className="text-center">Join Date</div>
                      <div className="text-center">Last Login</div>
                      <div className="text-center">Actions</div>
                    </div>
                    <div className="lg:hidden grid grid-cols-3 gap-4 p-4 font-medium border-b bg-gray-50 dark:bg-gray-800">
                      <div className="text-left">User</div>
                      <div className="text-center">Role</div>
                      <div className="text-center">Actions</div>
                    </div>

                    {filteredUsers.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        {searchTerm ? `No users found matching "${searchTerm}"` : "No users found"}
                      </div>
                    ) : (
                      filteredUsers.map((user) => {
                        const isLoading = loadingUsers.has(user.id)
                        return (
                          <React.Fragment key={user.id}>
                            {/* Desktop View */}
                            <div className={`hidden lg:grid grid-cols-6 gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                              <div className="flex items-center space-x-3 min-w-0">
                                <Avatar className="w-10 h-10 flex-shrink-0">
                                  <AvatarImage src={user.image || "/placeholder.svg?height=40&width=40"} />
                                  <AvatarFallback className="bg-yellow-100 text-yellow-700">{user.name?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div 
                                    className="font-medium text-gray-900 dark:text-white truncate cursor-help" 
                                    title={user.name}
                                  >
                                    {user.name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {user.postCount} posts, {user.commentCount} comments
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-center min-w-0">
                                <span 
                                  className="text-sm text-gray-600 dark:text-gray-300 truncate cursor-help max-w-full" 
                                  title={user.email}
                                >
                                  {user.email}
                                </span>
                              </div>
                              <div className="flex items-center justify-center">
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={user.role}
                                    onChange={(e) => handleUserRoleUpdate(user.id, e.target.value)}
                                    disabled={isLoading || user.id === authenticatedUser?.id || !permissions.canChangeUserRoles}
                                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                    title={!permissions.canChangeUserRoles ? "Insufficient permissions to change roles" : ""}
                                  >
                                    <option value="MEMBER">Member</option>
                                    <option value="MODERATOR">Moderator</option>
                                    <option value="ADMIN">Admin</option>
                                    <option 
                                      value="SUPER_ADMIN" 
                                      disabled={!superAdminPrivileges.isSuperAdmin}
                                      style={!superAdminPrivileges.isSuperAdmin ? { color: '#6B7280' } : {}}
                                    >
                                      Super Admin
                                    </option>
                                  </select>
                                  {isLoading && <div className="w-4 h-4 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent"></div>}
                                </div>
                              </div>
                              <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                                {user.joinDate}
                              </div>
                              <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                                {user.lastLogin}
                              </div>
                              <div className="flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUserDelete(user.id)}
                                  disabled={isLoading || user.id === authenticatedUser?.id || !permissions.canDeleteUsers}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-md transition-colors"
                                  title={!permissions.canDeleteUsers ? "Insufficient permissions to delete users" : "Delete user"}
                                >
                                  {isLoading ? (
                                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            {/* Mobile View */}
                            <div className={`lg:hidden border-b last:border-b-0 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                              <div className="grid grid-cols-3 gap-4 items-start">
                                {/* User Info */}
                                <div className="flex items-start space-x-3">
                                  <Avatar className="w-10 h-10 flex-shrink-0">
                                    <AvatarImage src={user.image || "/placeholder.svg?height=40&width=40"} />
                                    <AvatarFallback className="bg-yellow-100 text-yellow-700">{user.name?.[0] || '?'}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div 
                                      className="font-medium text-gray-900 dark:text-white text-sm truncate cursor-help" 
                                      title={user.name}
                                    >
                                      {user.name}
                                    </div>
                                    <div 
                                      className="text-xs text-gray-600 dark:text-gray-400 truncate cursor-help" 
                                      title={user.email}
                                    >
                                      {user.email}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {user.postCount} posts, {user.commentCount} comments
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Joined: {user.joinDate} | Last: {user.lastLogin}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Role */}
                                <div className="flex items-center justify-center">
                                  <select
                                    value={user.role}
                                    onChange={(e) => handleUserRoleUpdate(user.id, e.target.value)}
                                    disabled={isLoading || user.id === authenticatedUser?.id || !permissions.canChangeUserRoles}
                                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 w-full"
                                    title={!permissions.canChangeUserRoles ? "Insufficient permissions to change roles" : ""}
                                  >
                                    <option value="MEMBER">Member</option>
                                    <option value="MODERATOR">Moderator</option>
                                    <option value="ADMIN">Admin</option>
                                    <option 
                                      value="SUPER_ADMIN" 
                                      disabled={!superAdminPrivileges.isSuperAdmin}
                                      style={!superAdminPrivileges.isSuperAdmin ? { color: '#6B7280' } : {}}
                                    >
                                      Super Admin
                                    </option>
                                  </select>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center justify-center">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUserDelete(user.id)}
                                    disabled={isLoading || user.id === authenticatedUser?.id || !permissions.canDeleteUsers}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-md transition-colors"
                                    title={!permissions.canDeleteUsers ? "Insufficient permissions to delete users" : "Delete user"}
                                  >
                                    {isLoading ? (
                                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        )
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Pages Tab */}
          {permissions.canViewPages && (
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
                    {permissions.canManagePages && (
                      <Button onClick={() => router.push("/admin/pages/new")} className="bg-yellow-500 hover:bg-yellow-600 text-white">Create New Page</Button>
                    )}
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
          )}

          {/* Categories Tab */}
          {permissions.canViewCategories && (
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
                    {permissions.canCreateCategories && (
                      <Button 
                        onClick={handleCategoryCreate}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        Create New Category
                      </Button>
                    )}
                  </div>

                  {categoriesLoading ? (
                    <div className="text-center py-8">Loading categories...</div>
                  ) : categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No categories found. Create your first category to get started.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((category) => {
                        const isDeleting = deletingCategories.has(category.id)
                        const actualPostCount = category.actualPostCount ?? category.postCount
                        
                        return (
                          <div key={category.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800" 
                                style={{ backgroundColor: category.color }}
                              />
                              <div className="space-y-1">
                                <div className="font-medium">{category.name}</div>
                                <div className="text-xs text-gray-400">Slug: /{category.slug}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Badge 
                                variant={actualPostCount > 0 ? "default" : "secondary"}
                                className={actualPostCount > 0 ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                              >
                                {actualPostCount} posts
                              </Badge>
                              <div className="text-xs text-gray-500">
                                Created: {new Date(category.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex space-x-2">
                                {permissions.canEditCategories && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleCategoryEdit(category)}
                                    disabled={isDeleting}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    title="Edit category"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                                {permissions.canDeleteCategories && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleCategoryDelete(category)}
                                    disabled={isDeleting || actualPostCount > 0}
                                    className={`${actualPostCount > 0 ? 'text-gray-400 cursor-not-allowed opacity-50' : 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                                    title={actualPostCount > 0 ? `Cannot delete category with ${actualPostCount} posts` : "Delete category"}
                                  >
                                    {isDeleting ? (
                                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Form Dialog */}
            <Dialog open={categoryFormOpen}>
              <DialogContent 
                className="sm:max-w-[450px] p-0 [&>button]:hidden"
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && !categorySaving) {
                    setCategoryFormOpen(false)
                  }
                }}
              >
                {/* Header with Close Button */}
                <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700 space-y-0">
                  <div>
                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      {editingCategory ? 'Edit Category' : 'New Category'}
                    </DialogTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {editingCategory 
                        ? 'Update category details' 
                        : 'Create a new forum category'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setCategoryFormOpen(false)}
                    disabled={categorySaving}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Close dialog"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </DialogHeader>
                
                {/* Form Content */}
                <div className="p-6 space-y-4">
                  {/* Category Name */}
                  <div className="space-y-2">
                    <Label htmlFor="category-name" className="text-sm font-medium">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="category-name"
                      value={categoryForm.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setCategoryForm(prev => ({ 
                          ...prev, 
                          name,
                          // Always generate slug from name when creating new category
                          // For editing, only update slug if category has no posts
                          slug: !editingCategory ? generateSlug(name) : 
                                ((editingCategory.actualPostCount ?? editingCategory.postCount ?? 0) > 0) ? prev.slug : 
                                generateSlug(name)
                        }))
                      }}
                      disabled={editingCategory ? ((editingCategory.actualPostCount ?? editingCategory.postCount ?? 0) > 0) : false}
                      className={`${editingCategory ? ((editingCategory.actualPostCount ?? editingCategory.postCount ?? 0) > 0) : false ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
                      placeholder="Enter category name"
                    />
                    {editingCategory && ((editingCategory.actualPostCount ?? editingCategory.postCount ?? 0) > 0) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Cannot change name for category with {editingCategory.actualPostCount ?? editingCategory.postCount ?? 0} posts
                      </p>
                    )}
                  </div>
                  
                  {/* Category Slug */}
                  <div className="space-y-2">
                    <Label htmlFor="category-slug" className="text-sm font-medium">
                      Slug <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="category-slug"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                      disabled={editingCategory ? ((editingCategory.actualPostCount ?? editingCategory.postCount ?? 0) > 0) : false}
                      className={`${editingCategory ? ((editingCategory.actualPostCount ?? editingCategory.postCount ?? 0) > 0) : false ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
                      placeholder="category-slug"
                    />
                    {editingCategory && ((editingCategory.actualPostCount ?? editingCategory.postCount ?? 0) > 0) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Cannot change slug for category with posts
                      </p>
                    )}
                  </div>
                  
                  {/* Category Color */}
                  <div className="space-y-2">
                    <Label htmlFor="category-color" className="text-sm font-medium">
                      Color
                    </Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        id="category-color"
                        type="color"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                        className="w-12 h-10 rounded border p-1"
                      />
                      <Input
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                        className="flex-1"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Preview</Label>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: categoryForm.color }}
                      />
                      <div className="font-medium text-sm">
                        {categoryForm.name || 'Category Name'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dialog Footer */}
                <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Close the dialog - user can safely cancel since form state is managed
                      setCategoryFormOpen(false)
                    }}
                    disabled={categorySaving}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCategorySave}
                    disabled={categorySaving || !categoryForm.name.trim()}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2"
                  >
                    {categorySaving ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                        {editingCategory ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingCategory ? 'Update' : 'Create'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* REMOVE THIS AFTER TESTING - Old problematic Dialog */}
            {false && (
            <Dialog open={!!editingPost} onOpenChange={(open) => {
              console.log('🔔 Dialog onOpenChange called:', open, 'editingPost:', editingPost)
              if (!open) setEditingPost(null)
            }}>
              <DialogContent className="sm:max-w-[600px] p-0 [&>button]:hidden" style={{ zIndex: 9999 }}>
                {editingPost && (
                  <div className="absolute top-0 left-0 bg-red-500 text-white text-xs p-1 z-50">
                    🐛 Dialog IS OPEN - Post ID: {editingPost.id}
                  </div>
                )}
                <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700 space-y-0">
                  <div>
                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Edit Post {editingPost?.id ? `(${editingPost.id})` : ''}
                    </DialogTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Modify post content and settings
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingPost(null)}
                    disabled={savingEdit}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Close dialog"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </DialogHeader>
                
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-content" className="text-sm font-medium">
                      Content <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="edit-content"
                      value={editingPostData.content}
                      onChange={(e) => setEditingPostData(prev => ({ ...prev, content: e.target.value }))}
                      disabled={savingEdit}
                      placeholder="Enter post content"
                      rows={8}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-category" className="text-sm font-medium">
                      Primary Category
                    </Label>
                    <select
                      id="edit-category"
                      value={editingPostData.primaryCategoryId}
                      onChange={(e) => setEditingPostData(prev => ({ ...prev, primaryCategoryId: e.target.value }))}
                      disabled={savingEdit}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingPost(null)}
                    disabled={savingEdit}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePostUpdate}
                    disabled={savingEdit || !editingPostData.content.trim()}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2"
                  >
                    {savingEdit ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            )}

          </TabsContent>
          )}

          {/* Posts Tab */}
          {permissions.canViewPosts && (
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
                        <option value="hidden">Hidden</option>
                      </select>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => refreshPosts(postStatusFilter, postSearchTerm)}
                        disabled={postsLoading}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        {postsLoading ? 'Loading...' : 'Apply Filters'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Posts ({filteredPosts.length})</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refreshPosts(postStatusFilter, postSearchTerm)}
                      disabled={postsLoading}
                    >
                      {postsLoading ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>

                  {postsLoading ? (
                    <div className="text-center py-8">Loading posts...</div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPosts.map((post) => (
                        <div key={post.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div className="flex">
                            {/* Post statistics for moderation */}
                            <div className="w-20 h-24 bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-200/60 dark:border-gray-700/60 p-2">
                              {/* Engagement Score */}
                              <div className="flex items-center gap-1 mb-2">
                                <BarChart className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                  {(post.stats.comments || 0) + (post.stats.votes || 0)}
                                </span>
                              </div>
                              
                              {/* Time Indicator */}
                              <div className="flex items-center gap-1 mb-2">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500 font-medium">
                                  {(() => {
                                    const days = Math.floor((Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                                    return days === 0 ? 'Today' : days === 1 ? '1d' : days < 7 ? `${days}d` : days < 30 ? `${Math.floor(days/7)}w` : `${Math.floor(days/30)}m`;
                                  })()} 
                                </span>
                              </div>
                              
                              {/* Flag Indicator */}
                              {post.flags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Flag className="w-3 h-3 text-red-500" />
                                  <span className="text-xs font-semibold text-red-500">
                                    {post.flags.length}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 
                                      className="font-medium text-lg cursor-pointer hover:text-blue-600 transition-colors"
                                      onClick={() => handleViewFullPost(post.id)}
                                      title="Click to view full post"
                                    >
                                      {post.content?.substring(0, 60) + '...' || 'Post Content'}
                                    </h5>
                                    {/* Image indicator */}
                                    {post.images && post.images.length > 0 && (
                                      <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {post.images.length} Image{post.images.length > 1 ? 's' : ''}
                                      </Badge>
                                    )}
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
                                    {post.status.isHidden && (
                                      <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                                        <EyeOff className="w-3 h-3 mr-1" />
                                        Hidden
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
                                    {post.content.replace(/!\[.*?\]\(.*?\)/g, '[Image]').replace(/<[^>]*>/g, '').substring(0, 150)}...
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
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  {/* Pin/Unpin Button */}
                                  {permissions.canPinPosts && (
                                    <Button 
                                      size="sm" 
                                      variant={post.status.isPinned ? "default" : "outline"}
                                      onClick={() => handlePostModeration(post.id, 'pin', !post.status.isPinned)}
                                      disabled={moderatingPosts.has(post.id)}
                                      title={post.status.isPinned ? "Unpin post" : "Pin post"}
                                    >
                                      {moderatingPosts.has(post.id) ? (
                                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                      ) : (
                                        <Pin className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                  
                                  {/* Lock/Unlock Button */}
                                  {permissions.canLockPosts && (
                                    <Button 
                                      size="sm" 
                                      variant={post.status.isLocked ? "default" : "outline"}
                                      onClick={() => handlePostModeration(post.id, 'lock', !post.status.isLocked)}
                                      disabled={moderatingPosts.has(post.id)}
                                      title={post.status.isLocked ? "Unlock post" : "Lock post"}
                                    >
                                      {moderatingPosts.has(post.id) ? (
                                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                      ) : (
                                        <Lock className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}

                                  {/* Hide/Unhide Button */}
                                  {permissions.canHidePosts && (
                                    <Button 
                                      size="sm" 
                                      variant={post.status.isHidden ? "default" : "outline"}
                                      onClick={() => handlePostModeration(post.id, 'hide', !post.status.isHidden)}
                                      disabled={moderatingPosts.has(post.id)}
                                      title={post.status.isHidden ? "Unhide post" : "Hide post"}
                                      className={post.status.isHidden ? "bg-orange-500 hover:bg-orange-600 border-orange-500" : ""}
                                    >
                                      {moderatingPosts.has(post.id) ? (
                                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                      ) : (
                                        post.status.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}

                                  {/* More Actions Dropdown */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewFullPost(post.id)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Post
                                      </DropdownMenuItem>
                                      {(authenticatedUser?.role === 'ADMIN' || authenticatedUser?.role === 'SUPER_ADMIN') && (
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            console.log('Edit button clicked for post:', post.id)
                                            handlePostEdit(post)
                                          }}
                                        >
                                          <Edit className="w-4 h-4 mr-2" />
                                          Edit Post
                                        </DropdownMenuItem>
                                      )}
                                      {post.status.isFlagged && permissions.canApproveFlags && (
                                        <DropdownMenuItem 
                                          onClick={() => handlePostModeration(post.id, 'approve')}
                                          disabled={moderatingPosts.has(post.id)}
                                        >
                                          <Flag className="w-4 h-4 mr-2" />
                                          Approve (Resolve Flags)
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      {permissions.canDeletePosts && (
                                        <DropdownMenuItem 
                                          onClick={() => handlePostDelete(post)}
                                          disabled={deletingPosts.has(post.id)}
                                          className="text-red-600 focus:text-red-600"
                                      >
                                        {deletingPosts.has(post.id) ? (
                                          <>
                                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                            Deleting...
                                          </>
                                        ) : (
                                          <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Post
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {post.flags.length > 0 && (
                            <div className="mx-4 mb-4 bg-red-50 border border-red-200 rounded p-3">
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
          )}
        </Tabs>
      </main>

      {/* Enhanced Full Post View Modal */}
      <Dialog open={!!viewingPost} onOpenChange={(open) => !open && setViewingPost(null)}>
        <DialogContent className="sm:max-w-[75vw] lg:max-w-[650px] max-h-[80vh] overflow-hidden p-0 [&>button]:hidden">
          {/* Header with Close Button */}
          <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 space-y-0">
            <div className="flex items-center gap-3">
              {/* User Profile Picture with Fallback */}
              <div className="relative w-10 h-10 flex-shrink-0">
                {viewingPost?.author?.image ? (
                  <img 
                    src={viewingPost.author.image} 
                    alt={viewingPost.author.name || 'User'} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                    onError={(e) => {
                      // Hide the image and show fallback on error
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                {/* Fallback Avatar */}
                <div 
                  className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-gray-200 dark:border-gray-600"
                  style={{ display: viewingPost?.author?.image ? 'none' : 'flex' }}
                >
                  {viewingPost?.author?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingPost?.author?.name || 'Unknown User'}
                </DialogTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {viewingPost?.createdAt && new Date(viewingPost.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            {/* Rotating Close Button */}
            <button
              onClick={() => setViewingPost(null)}
              disabled={loadingFullPost}
              className="group p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close dialog"
            >
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-all duration-300 group-hover:rotate-90" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-6">
            {loadingFullPost ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading post...</span>
              </div>
            ) : viewingPost ? (
              <div className="space-y-6">
                {/* Post Meta */}
                <div className="flex items-center gap-4 flex-wrap">
                  {viewingPost.category && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: viewingPost.category.color }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{viewingPost.category.name}</span>
                    </span>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {viewingPost.stats?.comments || 0}
                    </span>
                    
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {viewingPost.stats?.votes || 0}
                    </span>
                  </div>
                </div>
                
                {/* Post Content with Integrated Images */}
                <div className="space-y-6">
                  {/* Main Content */}
                  <div className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap text-lg">
                    {viewingPost.content}
                  </div>
                  
                  {/* Images integrated naturally */}
                  {viewingPost.images && viewingPost.images.length > 0 && (
                    <div className="flex flex-col items-center justify-center space-y-4 pb-8 pt-2">
                      {viewingPost.images.map((image: any, index: number) => (
                        <div key={index} className="flex justify-center items-center w-full">
                          <img 
                            src={image.url || image} 
                            alt={`Image ${index + 1}`}
                            className="max-w-[70%] max-h-[40vh] w-auto h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 object-contain"
                            onClick={() => window.open(image.url || image, '_blank')}
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg'
                              e.currentTarget.alt = 'Image failed to load'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Moderation Flags */}
                {viewingPost.flags && viewingPost.flags.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Reported Issues ({viewingPost.flags.length})
                    </h4>
                    <div className="space-y-3">
                      {viewingPost.flags.map((flag: any) => (
                        <div key={flag.id} className="bg-white dark:bg-gray-800 rounded p-3 border border-red-100 dark:border-red-800">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-medium text-red-800 dark:text-red-400">{flag.reason}</span>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Reported by <span className="font-medium">{flag.users?.name}</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(flag.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No post data available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Edit Dialog - Minimalistic & Smooth */}
      {editingPost && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setEditingPost(null)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Minimal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Edit Post
              </h2>
              <button
                onClick={() => setEditingPost(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-300 group"
                disabled={savingEdit}
              >
                <svg className="w-4 h-4 text-gray-500 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Clean Content */}
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                  Content
                </label>
                <textarea
                  value={editingPostData.content}
                  onChange={(e) => setEditingPostData(prev => ({ ...prev, content: e.target.value }))}
                  disabled={savingEdit}
                  placeholder="Write your content here..."
                  rows={6}
                  className="w-full px-0 py-1 border-0 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:border-yellow-500 transition-colors duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                  Category
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      const dropdown = document.getElementById('category-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                        
                        // Add click outside handler
                        const handleClickOutside = (event: Event) => {
                          const target = event.target as Element;
                          if (!dropdown.contains(target) && !target.closest('[data-category-button]')) {
                            dropdown.classList.add('hidden');
                            document.removeEventListener('click', handleClickOutside);
                          }
                        };
                        
                        if (!dropdown.classList.contains('hidden')) {
                          setTimeout(() => {
                            document.addEventListener('click', handleClickOutside);
                          }, 0);
                        }
                      }
                    }}
                    disabled={savingEdit}
                    data-category-button
                    className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500 hover:border-yellow-400 transition-colors duration-200 cursor-pointer pr-8 text-left"
                  >
                    {editingPostData.primaryCategoryId 
                      ? categories.find(cat => cat.id === editingPostData.primaryCategoryId)?.name || "Select category..."
                      : "Select category..."
                    }
                  </button>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Custom Dropdown List with Complete Yellow Border */}
                  <div 
                    id="category-dropdown"
                    className="hidden absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border-2 border-yellow-500 rounded-md shadow-lg max-h-48 overflow-auto"
                  >
                    <div
                      onClick={() => {
                        setEditingPostData(prev => ({ ...prev, primaryCategoryId: '' }));
                        document.getElementById('category-dropdown')?.classList.add('hidden');
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-b border-yellow-200 dark:border-yellow-700"
                    >
                      Select category...
                    </div>
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        onClick={() => {
                          setEditingPostData(prev => ({ ...prev, primaryCategoryId: category.id }));
                          document.getElementById('category-dropdown')?.classList.add('hidden');
                        }}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-b border-yellow-200 dark:border-yellow-700 last:border-b-0"
                      >
                        {category.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Minimal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setEditingPost(null)}
                disabled={savingEdit}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handlePostUpdate}
                disabled={savingEdit || !editingPostData.content.trim()}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
              >
                {savingEdit ? (
                  <>
                    <div className="w-3 h-3 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


