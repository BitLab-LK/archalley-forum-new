"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BarChart3, ExternalLink, MoreHorizontal, Plus, Edit, Trash2, Eye, RefreshCw, TrendingUp, Activity, DollarSign } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import type { RolePermissions } from "@/lib/role-permissions"

interface AdBanner {
  id: string
  size: string
  imageUrl: string
  redirectUrl: string
  active: boolean
  title?: string
  description?: string
  clickCount?: number
  weight?: number
  priority?: 'high' | 'medium' | 'low'
}

interface AdStats {
  totalBanners: number
  activeBanners: number
  totalClicks: number
  averageClicksPerBanner: string
  availableSizes: number
}

interface AdsManagementSectionProps {
  userPermissions: RolePermissions
}

export default function AdsManagementSection({ userPermissions }: AdsManagementSectionProps) {
  const router = useRouter()
  const [banners, setBanners] = useState<AdBanner[]>([])
  const [stats, setStats] = useState<AdStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<AdBanner | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'title' | 'clicks' | 'priority'>('title')

  // Navigate to create ad page
  const handleCreateAd = () => {
    router.push('/admin/ads/create')
  }

  // Fetch ads data
  const fetchAdsData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    else setLoading(true)
    
    try {
      const [bannersResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/ads'),
        fetch('/api/admin/ads?action=stats')
      ])

      if (!bannersResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch ads data')
      }

      const bannersData = await bannersResponse.json()
      const statsData = await statsResponse.json()

      if (bannersData.success) {
        setBanners(bannersData.banners || [])
      }

      if (statsData.success) {
        setStats(statsData.stats)
      }

    } catch (error) {
      console.error('Error fetching ads data:', error)
      toast.error('Failed to load advertisements data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Toggle banner status
  const toggleBannerStatus = async (bannerId: string, currentStatus: boolean) => {
    if (!userPermissions.canToggleAds) {
      toast.error('You do not have permission to toggle ads')
      return
    }

    try {
      const response = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle',
          bannerId,
          active: !currentStatus
        })
      })

      const data = await response.json()

      if (data.success) {
        setBanners(prev => 
          prev.map(banner => 
            banner.id === bannerId 
              ? { ...banner, active: !currentStatus }
              : banner
          )
        )
        toast.success(`Advertisement ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        
        // Refresh stats
        fetchAdsData(true)
      } else {
        toast.error(data.error || 'Failed to toggle advertisement')
      }
    } catch (error) {
      console.error('Error toggling banner:', error)
      toast.error('Failed to toggle advertisement')
    }
  }

  // Filter and sort banners
  const filteredBanners = banners
    .filter(banner => {
      const matchesSearch = searchTerm === "" || 
        banner.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banner.id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && banner.active) ||
        (filterStatus === 'inactive' && !banner.active)

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'clicks':
          return (b.clickCount || 0) - (a.clickCount || 0)
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority || 'low'] - priorityOrder[a.priority || 'low']
        case 'title':
        default:
          return (a.title || a.id).localeCompare(b.title || b.id)
      }
    })

  // Load data on mount
  useEffect(() => {
    fetchAdsData()
  }, [])

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getBannersBySize = (size: string) => {
    return filteredBanners.filter(banner => banner.size === size)
  }

  const availableSizes = Array.from(new Set(banners.map(banner => banner.size)))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advertisement Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage advertisement banners, track performance, and control visibility
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => fetchAdsData(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {userPermissions.canCreateAds && (
            <Button 
              onClick={handleCreateAd}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Total Banners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBanners}</div>
              <p className="text-xs text-muted-foreground">
                All advertisement banners
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Active Banners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeBanners}</div>
              <p className="text-xs text-muted-foreground">
                Currently displaying
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Total Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalClicks}</div>
              <p className="text-xs text-muted-foreground">
                Cumulative ad clicks
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Avg. Clicks/Banner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.averageClicksPerBanner}</div>
              <p className="text-xs text-muted-foreground">
                Performance metric
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search advertisements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="title">Sort by Title</option>
                <option value="clicks">Sort by Clicks</option>
                <option value="priority">Sort by Priority</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banners by Size */}
      {availableSizes.map(size => {
        const sizeBanners = getBannersBySize(size)
        if (sizeBanners.length === 0) return null

        return (
          <div key={size}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              {size} Banners
              <Badge variant="secondary" className="ml-2">
                {sizeBanners.length} banner{sizeBanners.length !== 1 ? 's' : ''}
              </Badge>
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {sizeBanners.map(banner => (
                <Card key={banner.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${getPriorityColor(banner.priority)}`}
                        />
                        {banner.title || banner.id}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={banner.active ? "default" : "secondary"}>
                          {banner.active ? "Active" : "Inactive"}
                        </Badge>
                        {userPermissions.canToggleAds && (
                          <Switch
                            checked={banner.active}
                            onCheckedChange={() => toggleBannerStatus(banner.id, banner.active)}
                          />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedBanner(banner)
                              setIsModalOpen(true)
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {userPermissions.canEditAds && (
                              <DropdownMenuItem
                                onClick={() => {
                                  // Navigate to edit page with banner ID
                                  window.location.href = `/admin/ads/create?edit=${banner.id}`
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Banner
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => window.open(banner.redirectUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit URL
                            </DropdownMenuItem>
                            {userPermissions.canDeleteAds && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Banner Preview */}
                    <div 
                      className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                      style={{
                        aspectRatio: size === '320x320' ? '1/1' : '90/18',
                        minHeight: '120px'
                      }}
                      onClick={() => {
                        setSelectedBanner(banner)
                        setIsModalOpen(true)
                      }}
                    >
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title || banner.id}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `https://via.placeholder.com/${banner.size}/f0f0f0/666666?text=Banner+Preview`
                        }}
                      />
                    </div>
                    
                    {/* Banner Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">ID:</span>
                        <span className="text-muted-foreground font-mono text-xs">{banner.id}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Size:</span>
                        <span className="text-muted-foreground">{banner.size}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Priority:</span>
                        <Badge variant="outline" className="text-xs">
                          {banner.priority || 'low'}
                        </Badge>
                      </div>
                      
                      {userPermissions.canViewAdStats && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Clicks:</span>
                          <span className="text-blue-600 font-semibold">
                            {banner.clickCount || 0}
                          </span>
                        </div>
                      )}
                      
                      {banner.description && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Description:</span>
                          <p className="mt-1">{banner.description}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {/* Empty State */}
      {filteredBanners.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No advertisements found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first advertisement banner to get started'
              }
            </p>
            {userPermissions.canCreateAds && (
              <Button 
                onClick={handleCreateAd}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Advertisement
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Banner Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Advertisement Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedBanner && (
            <div className="space-y-4">
              {/* Banner Preview */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Preview</h4>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto">
                  <Image
                    src={selectedBanner.imageUrl}
                    alt={selectedBanner.title || selectedBanner.id}
                    width={600}
                    height={150}
                    className="object-contain w-full max-h-32"
                    style={{
                      aspectRatio: selectedBanner.size === '320x320' ? '1/1' : '90/18'
                    }}
                  />
                </div>
              </div>

              {/* Banner Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Basic Information</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Title:</span>
                      <span className="text-right">{selectedBanner.title || 'No title'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">ID:</span>
                      <span className="font-mono text-xs">{selectedBanner.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Size:</span>
                      <span>{selectedBanner.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant={selectedBanner.active ? "default" : "secondary"} className="text-xs">
                        {selectedBanner.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Priority:</span>
                      <Badge variant="outline" className="text-xs">{selectedBanner.priority || 'low'}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Performance</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Clicks:</span>
                      <span className="text-blue-600 font-semibold">
                        {selectedBanner.clickCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Weight:</span>
                      <span>{selectedBanner.weight || 1}/10</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* URLs */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">URLs</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <Label className="text-xs font-medium">Image URL:</Label>
                    <Input
                      value={selectedBanner.imageUrl}
                      readOnly
                      className="mt-1 bg-gray-50 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Redirect URL:</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={selectedBanner.redirectUrl}
                        readOnly
                        className="bg-gray-50 text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedBanner.redirectUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedBanner.description && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Description</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedBanner.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}