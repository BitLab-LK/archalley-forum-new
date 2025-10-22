"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ExternalLink, 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2, 
  Upload,
  Search,
  Filter,
  RefreshCw
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
  source?: string
  createdAt?: string
  updatedAt?: string
}

export default function EnhancedAdManagement() {
  const [banners, setBanners] = useState<AdBanner[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSize, setSelectedSize] = useState<string>("all")
  const [selectedSource, setSelectedSource] = useState<string>("all")
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
      // Load banners and stats
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
    
    return matchesSearch && matchesSize && matchesSource
  })

  const getBannersBySize = (size: string) => {
    return filteredBanners.filter(banner => banner.size === size)
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'database': return 'default'
      case 'wordpress': return 'secondary'
      case 'sample': return 'outline'
      default: return 'outline'
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
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                  Avg: {stats.avgClicksPerBanner} per banner
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalImpressions}</div>
                <p className="text-xs text-muted-foreground">
                  Total ad views
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Ad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Add a new advertisement banner to your rotation.
                </p>
                <Button asChild className="w-full">
                  <Link href="/admin/ads/create">Create Advertisement</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Bulk Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload multiple advertisements at once.
                </p>
                <Button variant="outline" className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View detailed performance metrics.
                </p>
                <Button variant="outline" className="w-full">
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search ads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    {availableSizes.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="wordpress">WordPress</SelectItem>
                    <SelectItem value="sample">Sample</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Banners by Size */}
          {availableSizes.map(size => {
            const sizeAds = getBannersBySize(size)
            if (sizeAds.length === 0) return null
            
            return (
              <div key={size}>
                <h2 className="text-xl font-semibold mb-4">
                  {size} Banners
                  <Badge variant="secondary" className="ml-2">
                    {sizeAds.length} ads
                  </Badge>
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sizeAds.map(banner => (
                    <Card key={banner.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg truncate">
                            {banner.title || banner.id}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getSourceBadgeColor(banner.source || 'unknown')}>
                              {banner.source}
                            </Badge>
                            <Badge variant={banner.active ? "default" : "secondary"}>
                              {banner.active ? "Active" : "Inactive"}
                            </Badge>
                            <Switch
                              checked={banner.active}
                              onCheckedChange={(checked) => handleToggleStatus(banner.id, checked)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Banner Preview */}
                        <div 
                          className="relative bg-gray-100 rounded-lg overflow-hidden"
                          style={{
                            aspectRatio: banner.size === '350x350' || banner.size === '320x320' ? '1/1' : 
                                        banner.size === '680x180' ? '680/180' : '970/180',
                            minHeight: '120px'
                          }}
                        >
                          <img
                            src={banner.imageUrl}
                            alt={banner.title || banner.id}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = `https://via.placeholder.com/${banner.size}/f0f0f0/666666?text=Banner+Preview`
                            }}
                          />
                        </div>
                        
                        {/* Banner Info */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Size:</span>
                              <span className="ml-1 text-muted-foreground">{banner.size}</span>
                            </div>
                            <div>
                              <span className="font-medium">Priority:</span>
                              <span className="ml-1 text-muted-foreground">{banner.priority || 'medium'}</span>
                            </div>
                          </div>
                          
                          {banner.description && (
                            <div>
                              <span className="text-sm font-medium">Description:</span>
                              <p className="text-sm text-muted-foreground mt-1">{banner.description}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {banner.clickCount || 0} clicks
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-muted-foreground">
                                  {banner.impressions || 0} views
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex space-x-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(banner.redirectUrl, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                              
                              {banner.source === 'database' && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    asChild
                                  >
                                    <Link href={`/admin/ads/${banner.id}/edit`}>
                                      <Edit className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDeleteAd(banner.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed analytics dashboard coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}