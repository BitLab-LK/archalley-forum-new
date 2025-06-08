"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, MessageSquare, TrendingUp, Eye, Edit, Trash2, Save, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DashboardStats {
  totalUsers: number
  totalPosts: number
  totalComments: number
  activeUsers: number
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("statistics")
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    activeUsers: 0
  })
  const [users, setUsers] = useState<User[]>([])
  const [settings, setSettings] = useState<Settings>({} as Settings)
  const [pages, setPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      router.push("/")
      return
    }

    const fetchDashboardData = async () => {
      try {
        const [statsResponse, usersResponse, settingsResponse, pagesResponse] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users"),
          fetch("/api/admin/settings"),
          fetch("/api/admin/pages")
        ])

        if (!statsResponse.ok || !usersResponse.ok || !settingsResponse.ok || !pagesResponse.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const [statsData, usersData, settingsData, pagesData] = await Promise.all([
          statsResponse.json(),
          usersResponse.json(),
          settingsResponse.json(),
          pagesResponse.json()
        ])

        setStats(statsData)
        setUsers(usersData.users)
        setSettings(settingsData)
        setPages(pagesData.pages)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, router])

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
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole })
      })

      if (!response.ok) {
        throw new Error("Failed to update user role")
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))

      toast.success("User role updated successfully")
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error("Failed to update user role")
    }
  }

  const handleUserDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      // Update local state
      setUsers(users.filter(user => user.id !== userId))
      toast.success("User deleted successfully")
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your forum settings and content</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Active forum members</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">Forum discussions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalComments}</div>
                  <p className="text-xs text-muted-foreground">User interactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">Currently online</p>
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
                    <Input placeholder="Search users..." className="max-w-sm" />
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

                    {users.map((user) => (
                      <div key={user.id} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.image || "/placeholder.svg?height=32&width=32"} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                        <div>{user.email}</div>
                        <div>
                          <select
                            value={user.role}
                            onChange={(e) => handleUserRoleUpdate(user.id, e.target.value)}
                            className="bg-transparent border rounded px-2 py-1"
                          >
                            <option value="USER">User</option>
                            <option value="MODERATOR">Moderator</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                        <div>{user.joinDate}</div>
                        <div>{user.lastLogin}</div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUserDelete(user.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
        </Tabs>
      </main>
    </div>
  )
}
