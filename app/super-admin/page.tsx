"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, Trash2, Search, Shield, Settings, UserCog, Activity, AlertTriangle,
  FileText, Zap
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"


interface DashboardStats {
  totalUsers: number
  totalPosts: number
  totalComments: number
  activeUsers: number
  totalAdmins: number
  totalModerators: number
  flaggedPosts: number
  recentSignups: number
  systemHealth: string
  databaseSize: string
  timestamp?: string
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
  isVerified?: boolean
  loginAttempts?: number
  lastPasswordChange?: string
}

interface SystemLog {
  id: string
  action: string
  userId: string
  userName: string
  details: string
  timestamp: string
  severity: 'info' | 'warning' | 'error' | 'critical'
}

interface SecurityAlert {
  id: string
  type: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  isResolved: boolean
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    activeUsers: 0,
    totalAdmins: 0,  
    totalModerators: 0,
    flaggedPosts: 0,
    recentSignups: 0,
    systemHealth: "Good",
    databaseSize: "Unknown"
  })
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set())
  
  const { user, isLoading: authLoading } = useAuth()

  const { confirm } = useConfirmDialog()
  const router = useRouter()

  // Security check - only SUPER_ADMIN role allowed
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'SUPER_ADMIN')) {
      toast.error("Super Admin access required")
      router.replace("/")
      return
    }
  }, [user, authLoading, router])

  // Fetch dashboard data
  useEffect(() => {
    if (!user || user.role !== 'SUPER_ADMIN') return

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch enhanced stats for super admin
        const statsResponse = await fetch("/api/super-admin/stats")
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        // Fetch all users with enhanced details
        const usersResponse = await fetch("/api/super-admin/users")
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.users || [])
        }

        // Fetch system logs
        const logsResponse = await fetch("/api/super-admin/logs")
        if (logsResponse.ok) {
          const logsData = await logsResponse.json()
          setSystemLogs(logsData.logs || [])
        }
        setLogsLoading(false)

        // Fetch security alerts
        const alertsResponse = await fetch("/api/super-admin/security-alerts")
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json()
          setSecurityAlerts(alertsData.alerts || [])
        }
        setAlertsLoading(false)

      } catch (error) {
        console.error("Error fetching super admin data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  // Filter users based on search term and role
  useEffect(() => {
    let filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  // Handle user role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm({ 
      title: "Change User Role",
      description: "Are you sure you want to change this user's role?"
    })) return

    setLoadingUsers(prev => new Set(prev).add(userId))
    
    try {
      const response = await fetch(`/api/super-admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) {
        throw new Error('Failed to update user role')
      }

      await response.json()
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast.success(`User role updated to ${newRole}`)
      
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    } finally {
      setLoadingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  // Handle user deletion
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm({
      title: "Delete User",
      description: `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`,
      variant: "destructive"
    })) return

    setLoadingUsers(prev => new Set(prev).add(userId))
    
    try {
      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success(`User "${userName}" has been deleted`)
      
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    } finally {
      setLoadingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  // Handle security alert resolution
  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/super-admin/security-alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true })
      })

      if (!response.ok) {
        throw new Error('Failed to resolve alert')
      }

      setSecurityAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, isResolved: true } : alert
        )
      )
      toast.success('Security alert resolved')
      
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast.error('Failed to resolve alert')
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="text-gray-600">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Complete system administration and oversight</p>
          </div>
          <div className="text-right">
            <Badge 
              variant="default"
              className="bg-red-500 text-white"
            >
              SUPER ADMIN
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">Security</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs sm:text-sm">Logs</TabsTrigger>
          <TabsTrigger value="health" className="text-xs sm:text-sm">Health</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-lg sm:text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+{stats.recentSignups} new this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">System Health</CardTitle>
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.systemHealth}</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Admins/Moderators</CardTitle>
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-lg sm:text-2xl font-bold">{stats.totalAdmins + stats.totalModerators}</div>
                <p className="text-xs text-muted-foreground">{stats.totalAdmins} admins, {stats.totalModerators} moderators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Security Alerts</CardTitle>
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-lg sm:text-2xl font-bold text-orange-600">
                  {securityAlerts.filter(alert => !alert.isResolved).length}
                </div>
                <p className="text-xs text-muted-foreground">{securityAlerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical').length} high priority</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used super admin operations</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                  onClick={() => setActiveTab("users")}
                >
                  <UserCog className="h-6 w-6" />
                  <span>Manage Users</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                  onClick={() => setActiveTab("security")}
                >
                  <Shield className="h-6 w-6" />
                  <span>Security Center</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                  onClick={() => setActiveTab("logs")}
                >
                  <Activity className="h-6 w-6" />
                  <span>View Logs</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>User Management</CardTitle>
              <CardDescription>Complete user administration and role management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MODERATOR">Moderator</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Activity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.image} />
                                <AvatarFallback>
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={user.role}
                              onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                              disabled={loadingUsers.has(user.id) || user.id === user?.id}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MEMBER">Member</SelectItem>
                                <SelectItem value="MODERATOR">Moderator</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div>{user.postCount} posts</div>
                            <div>{user.commentCount} comments</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {user.isVerified && (
                                <Badge variant="outline" className="text-xs border-green-200 text-green-600">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                disabled={loadingUsers.has(user.id) || user.id === user?.id}
                                className="h-8 px-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>Security Center</CardTitle>
              <CardDescription>Monitor and manage system security</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {securityAlerts.filter(alert => !alert.isResolved).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No active security alerts</p>
                    </div>
                  ) : (
                    securityAlerts
                      .filter(alert => !alert.isResolved)
                      .map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border-l-4 ${
                            alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                            alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                            alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                            'border-blue-500 bg-blue-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  alert.severity === 'critical' ? 'destructive' :
                                  alert.severity === 'high' ? 'destructive' :
                                  alert.severity === 'medium' ? 'secondary' :
                                  'outline'
                                }>
                                  {alert.severity.toUpperCase()}
                                </Badge>
                                <span className="font-medium">{alert.type}</span>
                              </div>
                              <p className="mt-2 text-sm text-gray-700">{alert.message}</p>
                              <p className="mt-1 text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveAlert(alert.id)}
                              className="ml-4"
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="logs" className="space-y-4 sm:space-y-6">
          <Card className="border-yellow-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">System Activity Logs</CardTitle>
              <CardDescription>Recent system and admin activities</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {systemLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p>No system logs available</p>
                    </div>
                  ) : (
                    systemLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 hover:bg-yellow-25"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            log.severity === 'critical' ? 'destructive' :
                            log.severity === 'error' ? 'destructive' :
                            log.severity === 'warning' ? 'secondary' :
                            'outline'
                          } className="text-xs">
                            {log.severity}
                          </Badge>
                          <div>
                            <div className="font-medium text-sm">{log.action}</div>
                            <div className="text-xs text-gray-500">by {log.userName}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-4 sm:space-y-6">
          <Card className="border-yellow-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">System Health & Performance</CardTitle>
              <CardDescription>Monitor system resources and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Database Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Database Size</span>
                      <span className="text-sm font-medium">{stats.databaseSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Connection Status</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">Connected</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">System Resources</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">System Health</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">{stats.systemHealth}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Connections</span>
                      <span className="text-sm font-medium">{stats.activeUsers}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings" className="space-y-4 sm:space-y-6">
          <Card className="border-yellow-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">System Configuration</CardTitle>
              <CardDescription>Advanced system settings and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4" />
                <p>System settings panel coming soon</p>
                <p className="text-sm">Advanced configuration options will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}