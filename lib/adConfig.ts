// Advertisement banner configuration - CORRECTED IMPLEMENTATION
export interface AdBanner {
  id: string           // Unique identifier
  size: string         // Banner dimensions
  imageUrl: string     // Direct URL to banner image
  redirectUrl: string  // Advertiser's landing page
  active: boolean      // Enable/disable banner
  title?: string       // Optional title for admin panel
  description?: string // Optional description for admin panel
  clickCount?: number  // Optional click tracking
}

// ACTUAL Configuration Structure - Flat array with size property
export const initialAdConfigs: AdBanner[] = [
  // Position 2: Square Sidebar (350x350) - Fixed ad (always shows)
  {
    id: "exel-square",
    size: "400x400",  // Square format for sidebar
    imageUrl: "https://archalley.com/wp-content/uploads/2025/02/Exel-Banner-345-x-345-main-banner.webp",
    redirectUrl: "https://exel.com",
    active: true,
    title: "Exel Design Software",
    description: "Professional architectural design tools"
  },
  
  // Position 1: Medium Rectangle (680x180) - Between Projects & Articles
  // 5 possible ads (1 randomly selected)
  {
    id: "abrand-680",
    size: "100%x250", // Full width format (was 680x180)
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/A-Brand-Banner-680x180-1.webp",
    redirectUrl: "https://abrand.com",
    active: true,
    title: "A-Brand Architecture",
    description: "Premium architectural solutions"
  },
  {
    id: "access-680",
    size: "100%x250", // Full width format (was 680x180)
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Access-Banner-680x180-1.webp",
    redirectUrl: "https://access.com",
    active: true,
    title: "Access Solutions",
    description: "Advanced access control systems"
  },
  {
    id: "noorbhoy-680",
    size: "100%x250", // Full width format (was 680x180)
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Noorbhoy-Banner-680x180-1.webp",
    redirectUrl: "https://noorbhoy.com",
    active: true,
    title: "Noorbhoy Construction",
    description: "Quality construction services"
  },
  {
    id: "bw-680",
    size: "100%x250", // Full width format (was 680x180)
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/BW-banner-680x180-1.webp",
    redirectUrl: "https://bw.com",
    active: true,
    title: "BW Engineering",
    description: "Engineering excellence"
  },
  {
    id: "crystal-680",
    size: "100%x250", // Full width format (was 680x180)
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Crystal-banner-680x180-1.webp",
    redirectUrl: "https://crystal.com",
    active: true,
    title: "Crystal Design",
    description: "Crystal clear architectural solutions"
  },
  
  // Position 3 & 4: Large Leaderboard (970x180) - Middle & Bottom Section
  // 5 possible ads (1 randomly selected for each position)
  {
    id: "abrand-970",
    size: "100%x250", // Full width format (was 970x180)
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/A-Brand-Banner-970x180-1.webp",
    redirectUrl: "https://abrand.com",
    active: true,
    title: "A-Brand Architecture",
    description: "Premium architectural solutions"
  },
  {
    id: "access-970",
    size: "100%x250", // Full width format (was 970x180)
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Access-Banner-970x180-1.webp",
    redirectUrl: "https://access.com",
    active: true,
    title: "Access Solutions",
    description: "Advanced access control systems"
  },
  {
    id: "noorbhoy-970",
    size: "100%x250", // Full width format (was 970x180)
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Noorbhoy-Banner-970x180-1.webp",
    redirectUrl: "https://noorbhoy.com",
    active: true,
    title: "Noorbhoy Construction",
    description: "Quality construction services"
  },
  {
    id: "bw-970",
    size: "100%x250", // Full width format (was 970x180)
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/BW-banner-970x180-1.webp",
    redirectUrl: "https://bw.com",
    active: true,
    title: "BW Engineering",
    description: "Engineering excellence"
  },
  {
    id: "crystal-970",
    size: "100%x250", // Full width format (was 970x180)
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Crystal-banner-970x180-1.webp",
    redirectUrl: "https://crystal.com",
    active: true,
    title: "Crystal Design",
    description: "Crystal clear architectural solutions"
  }
]

/**
 * Get a random ad banner for a specific size
 * @param size - Banner size
 * @returns Random ad banner or null if none available
 */
export function getRandomAdBanner(size: '680x180' | '350x350' | '970x180' | '800x200' | '400x400' | '1200x240' | '1200x300' | '100%x250'): AdBanner | null {
  const banners = initialAdConfigs.filter(banner => 
    (size === '680x180' && banner.size === '100%x250') ||
    (size === '350x350' && banner.size === '400x400') ||
    (size === '970x180' && banner.size === '100%x250') ||
    (size === '800x200' && banner.size === '100%x250') ||
    (size === '1200x240' && banner.size === '100%x250') ||
    (size === '1200x300' && banner.size === '100%x250') ||
    (size === '100%x250' && banner.size === '100%x250') ||
    banner.size === size && banner.active
  )
  
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
export function getAdBanners(size: '680x180' | '350x350' | '970x180' | '800x200' | '400x400' | '1200x240' | '1200x300' | '100%x250'): AdBanner[] {
  return initialAdConfigs.filter(banner => 
    (size === '680x180' && banner.size === '100%x250') ||
    (size === '350x350' && banner.size === '400x400') ||
    (size === '970x180' && banner.size === '100%x250') ||
    (size === '800x200' && banner.size === '100%x250') ||
    (size === '1200x240' && banner.size === '100%x250') ||
    (size === '1200x300' && banner.size === '100%x250') ||
    (size === '100%x250' && banner.size === '100%x250') ||
    banner.size === size && banner.active
  )
}

/**
 * Track ad click (in a real implementation, this would save to database)
 * @param bannerId - Banner ID
 */
export function trackAdClick(bannerId: string): void {
  // In production, this would save to database/analytics
  console.log(`Ad clicked: ${bannerId}`)
  
  // Update local click count for demonstration
  const banner = initialAdConfigs.find(b => b.id === bannerId)
  if (banner) {
    banner.clickCount = (banner.clickCount || 0) + 1
  }
}

/**
 * Get all available ad sizes
 * @returns Array of available sizes
 */
export function getAvailableSizes(): string[] {
  const sizes = Array.from(new Set(initialAdConfigs.map(banner => banner.size)))
  return sizes
}

/**
 * Get all active banners
 * @returns Array of all active banners
 */
export function getAllActiveBanners(): AdBanner[] {
  return initialAdConfigs.filter(banner => banner.active)
}

/**
 * Update banner status
 * @param bannerId - Banner ID
 * @param active - New active status
 */
export function updateBannerStatus(bannerId: string, active: boolean): boolean {
  const banner = initialAdConfigs.find(b => b.id === bannerId)
  if (banner) {
    banner.active = active
    return true
  }
  return false
}