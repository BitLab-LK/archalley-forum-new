"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ExternalLink, BarChart3 } from "lucide-react"
import { 
  getAllActiveBanners, 
  updateBannerStatus, 
  getAvailableSizes,
  type AdBanner 
} from "@/lib/adConfig"

export default function AdManagementPanel() {
  const [banners, setBanners] = useState<AdBanner[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])

  useEffect(() => {
    // Load all banners and available sizes
    setBanners(getAllActiveBanners())
    setAvailableSizes(getAvailableSizes())
  }, [])

  const handleToggleStatus = (bannerId: string, active: boolean) => {
    const success = updateBannerStatus(bannerId, active)
    if (success) {
      setBanners(prev => 
        prev.map(banner => 
          banner.id === bannerId ? { ...banner, active } : banner
        )
      )
    }
  }

  const getBannersBySize = (size: string) => {
    return banners.filter(banner => banner.size === size)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Advertisement Management</h1>
        <p className="text-muted-foreground">
          Manage your advertisement banners, track performance, and control visibility.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Banners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banners.length}</div>
            <p className="text-xs text-muted-foreground">
              Active advertisements
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
            <div className="text-2xl font-bold">
              {banners.reduce((sum, banner) => sum + (banner.clickCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cumulative ad clicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Banners by Size */}
      {availableSizes.map(size => (
        <div key={size} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {size} Banners
            <Badge variant="secondary" className="ml-2">
              {getBannersBySize(size).length} banners
            </Badge>
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {getBannersBySize(size).map(banner => (
              <Card key={banner.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">
                      {banner.title || banner.id}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
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
                      aspectRatio: size === '350x350' ? '1/1' : 
                                  size === '680x180' ? '680/180' : '970/180',
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
                    <div>
                      <span className="text-sm font-medium">ID:</span>
                      <span className="text-sm text-muted-foreground ml-2">{banner.id}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium">Size:</span>
                      <span className="text-sm text-muted-foreground ml-2">{banner.size}</span>
                    </div>
                    
                    {banner.description && (
                      <div>
                        <span className="text-sm font-medium">Description:</span>
                        <p className="text-sm text-muted-foreground mt-1">{banner.description}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {banner.clickCount || 0} clicks
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(banner.redirectUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visit
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}