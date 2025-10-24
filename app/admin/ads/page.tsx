"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  ExternalLink, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  RefreshCw,
  Eye,
  MousePointerClick,
  MoreHorizontal,
  ImageIcon
} from "lucide-react"
import Link from "next/link"

interface AdBanner {
  id: string
  title?: string
  description?: string
  imageUrl: string
  redirectUrl: string
  size: string
  active: boolean
  weight?: number
  priority?: 'high' | 'medium' | 'low'
  clickCount?: number
  impressions?: number
  impressionCount?: number
  source?: string
  createdAt?: string
  updatedAt?: string
}

export default function AdManagementPanel() {
  const [banners, setBanners] = useState<AdBanner[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSize, setSelectedSize] = useState<string>("all")
  const [selectedSource, setSelectedSource] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [stats, setStats] = useState({
    totalBanners: 0,
    activeBanners: 0,
    totalClicks: 0,
    totalImpressions: 0,
    avgClicksPerBanner: "0"
  })

  const loadData = async () => {
    setLoading(true)
    try {
      // Load banners and stats from our database API
      const [bannersResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/ads'),
        fetch('/api/admin/ads?action=stats')
      ])

      if (bannersResponse.ok) {
        const bannersData = await bannersResponse.json()
        setBanners(bannersData.banners || [])
        setAvailableSizes(bannersData.availableSizes || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats || stats)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggleStatus = async (bannerId: string, active: boolean) => {
    try {
      const response = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          bannerId,
          active
        })
      })

      if (response.ok) {
        setBanners(prev => 
          prev.map(banner => 
            banner.id === bannerId ? { ...banner, active } : banner
          )
        )
      }
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  const handleDeleteAd = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/ads?id=${bannerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBanners(prev => prev.filter(banner => banner.id !== bannerId))
      }
    } catch (error) {
      console.error('Error deleting ad:', error)
    }
  }

  // Filter banners
  const filteredBanners = banners.filter(banner => {
    const matchesSearch = !searchTerm || 
      banner.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSize = selectedSize === 'all' || banner.size === selectedSize
    const matchesSource = selectedSource === 'all' || banner.source === selectedSource
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && banner.active) ||
      (selectedStatus === 'inactive' && !banner.active)
    
    return matchesSearch && matchesSize && matchesSource && matchesStatus
  })

  // Alias for consistency with UI code
  const filteredAds = filteredBanners

  const getBannersBySize = (size: string) => {
    return filteredBanners.filter(banner => banner.size === size)
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'wordpress': return 'text-blue-600 bg-blue-50'
      case 'database': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading advertisements...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Advertisement Management</h1>
            <p className="text-muted-foreground">
              Manage your advertisement banners, track performance, and control visibility.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/admin/ads/create">
                <Plus className="h-4 w-4 mr-2" />
                Create New Ad
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage">Manage Ads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Banners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBanners}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeBanners} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Banner Sizes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableSizes.length}</div>
                <p className="text-xs text-muted-foreground">
                  Available dimensions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClicks}</div>
                <p className="text-xs text-muted-foreground">
                  Cumulative ad clicks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalImpressions}</div>
                <p className="text-xs text-muted-foreground">
                  Ad views recorded
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Ad Performance by Size</CardTitle>
              <CardDescription>
                Click-through rates and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableSizes.map(size => {
                  const sizeAds = getBannersBySize(size);
                  const sizeClicks = sizeAds.reduce((sum, ad) => sum + (ad.clickCount || 0), 0);
                  const sizeImpressions = sizeAds.reduce((sum, ad) => sum + (ad.impressionCount || 0), 0);
                  const ctr = sizeImpressions > 0 ? (sizeClicks / sizeImpressions * 100).toFixed(2) : '0.00';
                  
                  return (
                    <div key={size} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{size}</p>
                        <p className="text-sm text-muted-foreground">{sizeAds.length} ads</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm">CTR: {ctr}%</p>
                        <p className="text-xs text-muted-foreground">{sizeClicks} clicks / {sizeImpressions} views</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Advertisements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search ads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Size</label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="All sizes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sizes</SelectItem>
                      {availableSizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Source</label>
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="All sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="wordpress">WordPress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ads Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAds.map(banner => (
              <Card key={banner.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">
                      {banner.title || `Ad ${banner.id}`}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={banner.active ? "default" : "secondary"}>
                        {banner.active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className={getSourceBadgeColor(banner.source || 'database')}>
                        {banner.source || 'DB'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Banner Preview */}
                  <div 
                    className="relative bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
                    style={{
                      aspectRatio: banner.size === '350x350' ? '1/1' : 
                                  banner.size === '680x180' ? '680/180' : '970/180',
                      minHeight: '120px'
                    }}
                    onClick={() => window.open(banner.redirectUrl, '_blank')}
                  >
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || `Ad ${banner.id}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `https://via.placeholder.com/${banner.size}/f0f0f0/666666?text=Banner+Preview`
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <ExternalLink className="text-white opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity" />
                    </div>
                  </div>
                  
                  {/* Banner Info */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Size:</span>
                        <p className="font-mono">{banner.size}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Priority:</span>
                        <p>{banner.priority || 'MEDIUM'}</p>
                      </div>
                    </div>
                    
                    {banner.description && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Description:</span>
                        <p className="text-sm mt-1 line-clamp-2">{banner.description}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MousePointerClick className="h-4 w-4" />
                          <span>{banner.clickCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{banner.impressionCount || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Switch
                          checked={banner.active}
                          onCheckedChange={(checked) => handleToggleStatus(banner.id, checked)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/ads/edit/${banner.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => window.open(banner.redirectUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit URL
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAd(banner.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredAds.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">No advertisements found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || selectedSize !== 'all' || selectedStatus !== 'all' || selectedSource !== 'all'
                        ? 'Try adjusting your filters or search term'
                        : 'Create your first advertisement to get started'
                      }
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/admin/ads/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Ad
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}