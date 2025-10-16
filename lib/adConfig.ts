// Advertisement banner configuration
export interface AdBanner {
  id: string
  imageUrl: string
  redirectUrl: string
  title: string
  description?: string
  size: '680x180' | '350x350' | '970x180'
  isActive: boolean
  clickCount?: number
}

export const AD_BANNERS: Record<string, AdBanner[]> = {
  "680x180": [
    {
      id: "horizontal-1",
      imageUrl: "/ads/banner-680x180-1.jpg",
      redirectUrl: "https://archalley.com/services",
      title: "Architecture Services",
      description: "Professional architectural design and consultation",
      size: "680x180",
      isActive: true,
      clickCount: 0
    },
    {
      id: "horizontal-2",
      imageUrl: "/ads/banner-680x180-2.jpg",
      redirectUrl: "https://archalley.com/portfolio",
      title: "View Our Portfolio",
      description: "Explore our latest architectural projects",
      size: "680x180",
      isActive: true,
      clickCount: 0
    },
    {
      id: "horizontal-3",
      imageUrl: "/ads/banner-680x180-3.jpg",
      redirectUrl: "https://archalley.com/contact",
      title: "Get In Touch",
      description: "Contact us for your next project",
      size: "680x180",
      isActive: true,
      clickCount: 0
    }
  ],
  "350x350": [
    {
      id: "square-1",
      imageUrl: "/ads/banner-350x350-1.jpg",
      redirectUrl: "https://archalley.com/software",
      title: "Design Software",
      description: "Latest architectural design tools",
      size: "350x350",
      isActive: true,
      clickCount: 0
    },
    {
      id: "square-2",
      imageUrl: "/ads/banner-350x350-2.jpg",
      redirectUrl: "https://archalley.com/courses",
      title: "Online Courses",
      description: "Learn architecture from experts",
      size: "350x350",
      isActive: true,
      clickCount: 0
    },
    {
      id: "square-3",
      imageUrl: "/ads/banner-350x350-3.jpg",
      redirectUrl: "https://archalley.com/materials",
      title: "Building Materials",
      description: "Premium construction materials",
      size: "350x350",
      isActive: true,
      clickCount: 0
    }
  ],
  "970x180": [
    {
      id: "leaderboard-1",
      imageUrl: "/ads/banner-970x180-1.jpg",
      redirectUrl: "https://archalley.com/conference",
      title: "Architecture Conference 2025",
      description: "Join the largest architecture conference",
      size: "970x180",
      isActive: true,
      clickCount: 0
    },
    {
      id: "leaderboard-2",
      imageUrl: "/ads/banner-970x180-2.jpg",
      redirectUrl: "https://archalley.com/magazine",
      title: "Architecture Magazine",
      description: "Subscribe to our monthly magazine",
      size: "970x180",
      isActive: true,
      clickCount: 0
    },
    {
      id: "leaderboard-3",
      imageUrl: "/ads/banner-970x180-3.jpg",
      redirectUrl: "https://archalley.com/jobs",
      title: "Architecture Jobs",
      description: "Find your dream architecture job",
      size: "970x180",
      isActive: true,
      clickCount: 0
    }
  ]
}

/**
 * Get a random ad banner for a specific size
 * @param size - Banner size
 * @returns Random ad banner or null if none available
 */
export function getRandomAdBanner(size: '680x180' | '350x350' | '970x180'): AdBanner | null {
  const banners = AD_BANNERS[size]?.filter(banner => banner.isActive) || []
  
  if (banners.length === 0) {
    return null
  }
  
  const randomIndex = Math.floor(Math.random() * banners.length)
  return banners[randomIndex]
}

/**
 * Get all active banners for a specific size
 * @param size - Banner size
 * @returns Array of active banners
 */
export function getAdBanners(size: '680x180' | '350x350' | '970x180'): AdBanner[] {
  return AD_BANNERS[size]?.filter(banner => banner.isActive) || []
}

/**
 * Track ad click (in a real implementation, this would save to database)
 * @param bannerId - Banner ID
 */
export function trackAdClick(bannerId: string): void {
  // In production, this would save to database/analytics
  console.log(`Ad clicked: ${bannerId}`)
  
  // Update local click count for demonstration
  Object.values(AD_BANNERS).forEach(sizeGroup => {
    const banner = sizeGroup.find(b => b.id === bannerId)
    if (banner) {
      banner.clickCount = (banner.clickCount || 0) + 1
    }
  })
}