"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Info, 
  Monitor, 
  Smartphone, 
  MapPin, 
  Eye, 
  Users, 
  Target,
  HelpCircle,
  Layout,
  Square,
  RectangleHorizontal
} from 'lucide-react'

interface AdSizeInfo {
  size: string
  label: string
  displayName: string
  locations: {
    page: string
    position: string
    device: 'desktop' | 'mobile' | 'both'
    visibility: 'high' | 'medium' | 'low'
    description: string
  }[]
  recommendations: {
    bestFor: string[]
    considerations: string[]
  }
  icon: React.ReactNode
}

const AD_PLACEMENT_DATA: AdSizeInfo[] = [
  {
    size: '320x320',
    label: '320×320 (Small Square)',
    displayName: 'Small Square',
    icon: <Square className="h-4 w-4" />,
    locations: [
      {
        page: 'Homepage',
        position: 'Between content sections (mobile)',
        device: 'mobile',
        visibility: 'high',
        description: 'Appears between different content sections on mobile devices for optimal engagement'
      },
      {
        page: 'Forum Pages',
        position: 'Sidebar (mobile)',
        device: 'mobile',
        visibility: 'medium',
        description: 'Displayed in mobile sidebar areas when space permits'
      }
    ],
    recommendations: {
      bestFor: ['Mobile-first campaigns', 'Social media promotions', 'App downloads', 'Quick actions'],
      considerations: ['Hidden on desktop (≥1024px)', 'Best engagement on mobile', 'Square format works well for logos/icons']
    }
  },
  {
    size: '350x350',
    label: '350×350 (Square)',
    displayName: 'Square',
    icon: <Square className="h-4 w-4" />,
    locations: [
      {
        page: 'Homepage',
        position: 'Content sections (mobile)',
        device: 'mobile',
        visibility: 'high',
        description: 'Primary mobile advertisement format between homepage content'
      },
      {
        page: 'Articles',
        position: 'Inline content (mobile)',
        device: 'mobile',
        visibility: 'high',
        description: 'Embedded within article content for mobile readers'
      }
    ],
    recommendations: {
      bestFor: ['Brand awareness', 'Product showcases', 'Visual campaigns', 'Mobile marketing'],
      considerations: ['Mobile-only display', 'Square format ideal for balanced designs', 'Good for image-heavy content']
    }
  },
  {
    size: '680x180',
    label: '680×180 (Banner)',
    displayName: 'Banner',
    icon: <RectangleHorizontal className="h-4 w-4" />,
    locations: [
      {
        page: 'Homepage',
        position: 'Header area (desktop)',
        device: 'desktop',
        visibility: 'high',
        description: 'Prominent banner placement at the top of homepage on desktop'
      },
      {
        page: 'All Pages',
        position: 'Content header (desktop)',
        device: 'desktop',
        visibility: 'high',
        description: 'Displayed at the top of content areas across various pages'
      }
    ],
    recommendations: {
      bestFor: ['Website promotions', 'Service announcements', 'Event marketing', 'Call-to-actions'],
      considerations: ['Desktop-focused', 'High visibility placement', 'Horizontal format for text + image']
    }
  },
  {
    size: '800x200',
    label: '800×200 (Wide Banner)',
    displayName: 'Wide Banner',
    icon: <RectangleHorizontal className="h-4 w-4" />,
    locations: [
      {
        page: 'Homepage',
        position: 'Featured section (desktop)',
        device: 'desktop',
        visibility: 'high',
        description: 'Large format banner in featured content areas'
      },
      {
        page: 'Category Pages',
        position: 'Top banner (desktop)',
        device: 'desktop',
        visibility: 'high',
        description: 'Header banners for category and listing pages'
      }
    ],
    recommendations: {
      bestFor: ['Major campaigns', 'Brand showcases', 'Product launches', 'High-impact messaging'],
      considerations: ['Premium placement', 'Desktop-only', 'Wide format for detailed content']
    }
  },
  {
    size: '970x180',
    label: '970×180 (Leaderboard)',
    displayName: 'Leaderboard',
    icon: <RectangleHorizontal className="h-4 w-4" />,
    locations: [
      {
        page: 'All Pages',
        position: 'Page header (desktop)',
        device: 'desktop',
        visibility: 'high',
        description: 'Standard leaderboard position at page tops on desktop'
      },
      {
        page: 'Forum',
        position: 'Above content (desktop)',
        device: 'desktop',
        visibility: 'high',
        description: 'Prominent placement above forum content and discussions'
      }
    ],
    recommendations: {
      bestFor: ['Brand awareness', 'Website partnerships', 'Network campaigns', 'High-traffic promotions'],
      considerations: ['Industry standard size', 'Maximum desktop visibility', 'Perfect for brand messaging']
    }
  },
  {
    size: '1200x240',
    label: '1200×240 (Large Banner)',
    displayName: 'Large Banner',
    icon: <RectangleHorizontal className="h-4 w-4" />,
    locations: [
      {
        page: 'Homepage',
        position: 'Hero section (desktop)',
        device: 'desktop',
        visibility: 'high',
        description: 'Premium hero section placement on homepage'
      },
      {
        page: 'Landing Pages',
        position: 'Featured area (desktop)',
        device: 'desktop',
        visibility: 'high',
        description: 'Large format display on special landing pages'
      }
    ],
    recommendations: {
      bestFor: ['Premium campaigns', 'Major announcements', 'Sponsorship displays', 'High-value promotions'],
      considerations: ['Premium pricing tier', 'Maximum impact', 'Best for important campaigns']
    }
  },
  {
    size: '1200x300',
    label: '1200×300 (Mega Banner)',
    displayName: 'Mega Banner',
    icon: <RectangleHorizontal className="h-4 w-4" />,
    locations: [
      {
        page: 'Homepage',
        position: 'Primary hero (desktop)',
        device: 'desktop',
        visibility: 'high',
        description: 'Largest format for maximum impact on homepage'
      },
      {
        page: 'Special Events',
        position: 'Featured placement (desktop)',
        device: 'desktop',
        visibility: 'high',
        description: 'Reserved for special events and major campaigns'
      }
    ],
    recommendations: {
      bestFor: ['Major brand campaigns', 'Event sponsorships', 'Product launches', 'Premium partnerships'],
      considerations: ['Highest impact placement', 'Premium investment', 'Best ROI for major campaigns']
    }
  }
]

interface AdPlacementGuideProps {
  compact?: boolean
}

export default function AdPlacementGuide({ compact = false }: AdPlacementGuideProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  if (compact) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Ad Placement Guide
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Advertisement Placement Guide
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <AdPlacementGuideContent 
              data={AD_PLACEMENT_DATA}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Advertisement Placement Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AdPlacementGuideContent 
          data={AD_PLACEMENT_DATA}
          selectedSize={selectedSize}
          onSelectSize={setSelectedSize}
        />
      </CardContent>
    </Card>
  )
}

interface AdPlacementGuideContentProps {
  data: AdSizeInfo[]
  selectedSize: string | null
  onSelectSize: (size: string | null) => void
}

function AdPlacementGuideContent({ data, selectedSize, onSelectSize }: AdPlacementGuideContentProps) {
  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Quick Overview
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Mobile sizes (320x320, 350x350):</strong> Display on mobile devices only</li>
              <li>• <strong>Desktop banners (680x180+):</strong> Display on desktop and tablets (≥1024px)</li>
              <li>• <strong>Larger sizes:</strong> Premium placements with higher visibility</li>
              <li>• <strong>Square formats:</strong> Best for logos, products, and balanced designs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Ad Sizes Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((adSize) => (
          <Card 
            key={adSize.size} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSize === adSize.size ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectSize(selectedSize === adSize.size ? null : adSize.size)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {adSize.icon}
                  {adSize.displayName}
                </div>
                <Badge variant="outline">{adSize.size}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Locations */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Display Locations
                  </h4>
                  <div className="space-y-2">
                    {adSize.locations.map((location, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {location.device === 'mobile' ? (
                            <Smartphone className="h-3 w-3 text-green-600" />
                          ) : (
                            <Monitor className="h-3 w-3 text-blue-600" />
                          )}
                          <span>{location.page}</span>
                        </div>
                        <Badge 
                          variant={location.visibility === 'high' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {location.visibility} visibility
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedSize === adSize.size && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      {/* Detailed Locations */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Layout className="h-3 w-3" />
                          Placement Details
                        </h4>
                        <div className="space-y-2">
                          {adSize.locations.map((location, idx) => (
                            <div key={idx} className="bg-muted p-3 rounded text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{location.page} - {location.position}</span>
                                <div className="flex items-center gap-1">
                                  {location.device === 'mobile' ? (
                                    <Smartphone className="h-3 w-3" />
                                  ) : (
                                    <Monitor className="h-3 w-3" />
                                  )}
                                  <span className="text-xs">{location.device}</span>
                                </div>
                              </div>
                              <p className="text-muted-foreground">{location.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Target className="h-3 w-3" />
                          Best For
                        </h4>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {adSize.recommendations.bestFor.map((item, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                        
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Eye className="h-3 w-3" />
                          Considerations
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {adSize.recommendations.considerations.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Tips */}
      <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Pro Tips for Admins
            </h3>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>• <strong>Mobile-first:</strong> 70%+ of traffic is mobile, prioritize 320x320 and 350x350 sizes</li>
              <li>• <strong>Rotation:</strong> Enable auto-rotation for better performance and fairness</li>
              <li>• <strong>Testing:</strong> Preview ads on different devices before publishing</li>
              <li>• <strong>Performance:</strong> Monitor click-through rates to optimize placements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Quick Reference Component for Ad Form
export function AdSizeQuickReference({ selectedSize }: { selectedSize: string }) {
  const sizeData = AD_PLACEMENT_DATA.find(item => item.size === selectedSize)
  
  if (!sizeData) return null

  return (
    <div className="bg-muted p-3 rounded-lg text-sm">
      <h4 className="font-medium mb-2 flex items-center gap-2">
        {sizeData.icon}
        {sizeData.displayName} Placement Info
      </h4>
      <div className="space-y-2">
        <div>
          <span className="font-medium">Displays on:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {sizeData.locations.map((location, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {location.page} ({location.device})
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <span className="font-medium">Best for:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {sizeData.recommendations.bestFor.slice(0, 3).map((item, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}