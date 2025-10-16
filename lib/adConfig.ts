// Advertisement banner configuration - ENHANCED IMPLEMENTATION
export interface AdBanner {
  id: string           // Unique identifier
  size: string         // Banner dimensions
  imageUrl: string     // Direct URL to banner image
  redirectUrl: string  // Advertiser's landing page
  active: boolean      // Enable/disable banner
  title?: string       // Optional title for admin panel
  description?: string // Optional description for admin panel
  clickCount?: number  // Optional click tracking
  weight?: number      // Weight for selection probability (1-10, higher = more frequent)
  priority?: 'high' | 'medium' | 'low' // Priority level
}

// Global state for ad session management
interface AdSessionState {
  usedAds: Set<string>           // Ads shown in current session
  currentlyDisplayed: Set<string> // Ads currently visible on page
  lastRotation: number           // Timestamp of last rotation
  sessionStartTime: number       // When session started
  adHistory: string[]            // History of shown ads
}

// Initialize session state
let adSessionState: AdSessionState = {
  usedAds: new Set(),
  currentlyDisplayed: new Set(),
  lastRotation: Date.now(),
  sessionStartTime: Date.now(),
  adHistory: []
}

// ACTUAL Configuration Structure - Enhanced with weights and priorities
export const initialAdConfigs: AdBanner[] = [
  // Position 2: Square Sidebar (320x320) - Fixed ad (always shows) - REDUCED SIZE
  {
    id: "exel-square",
    size: "320x320",  // Reduced from 400x400 for better proportions
    imageUrl: "https://archalley.com/wp-content/uploads/2025/02/Exel-Banner-345-x-345-main-banner.webp",
    redirectUrl: "https://exel.com",
    active: true,
    title: "Exel Design Software",
    description: "Professional architectural design tools",
    weight: 10, // Always show (fixed)
    priority: 'high'
  },
  
  // Position 1: Medium Rectangle (680x180) - Between Projects & Articles
  // 5 possible ads (1 randomly selected) - WEIGHTED SELECTION
  {
    id: "abrand-680",
    size: "90%x180", // Reduced width and height for better proportions
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/A-Brand-Banner-680x180-1.webp",
    redirectUrl: "https://abrand.com",
    active: true,
    title: "A-Brand Architecture",
    description: "Premium architectural solutions",
    weight: 8, // High priority advertiser
    priority: 'high'
  },
  {
    id: "access-680",
    size: "90%x180", // Reduced width and height for better proportions
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Access-Banner-680x180-1.webp",
    redirectUrl: "https://access.com",
    active: true,
    title: "Access Solutions",
    description: "Advanced access control systems",
    weight: 6, // Medium priority
    priority: 'medium'
  },
  {
    id: "noorbhoy-680",
    size: "90%x180", // Reduced width and height for better proportions
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Noorbhoy-Banner-680x180-1.webp",
    redirectUrl: "https://noorbhoy.com",
    active: true,
    title: "Noorbhoy Construction",
    description: "Quality construction services",
    weight: 7, // Medium-high priority
    priority: 'medium'
  },
  {
    id: "bw-680",
    size: "90%x180", // Reduced width and height for better proportions
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/BW-banner-680x180-1.webp",
    redirectUrl: "https://bw.com",
    active: true,
    title: "BW Engineering",
    description: "Engineering excellence",
    weight: 5, // Medium priority
    priority: 'medium'
  },
  {
    id: "crystal-680",
    size: "90%x180", // Reduced width and height for better proportions
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Crystal-banner-680x180-1.webp",
    redirectUrl: "https://crystal.com",
    active: true,
    title: "Crystal Design",
    description: "Crystal clear architectural solutions",
    weight: 4, // Lower priority
    priority: 'low'
  },
  
  // Position 3 & 4: Large Leaderboard (90%x180) - Middle & Bottom Section - REDUCED SIZE
  // 5 possible ads (1 randomly selected for each position) - WEIGHTED SELECTION
  {
    id: "abrand-970",
    size: "90%x180", // Reduced width and height for better proportions
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/A-Brand-Banner-970x180-1.webp",
    redirectUrl: "https://abrand.com",
    active: true,
    title: "A-Brand Architecture",
    description: "Premium architectural solutions",
    weight: 9, // Highest priority for leaderboard
    priority: 'high'
  },
  {
    id: "access-970",
    size: "90%x180", // Reduced width and height for better proportions
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Access-Banner-970x180-1.webp",
    redirectUrl: "https://access.com",
    active: true,
    title: "Access Solutions",
    description: "Advanced access control systems",
    weight: 6, // Medium priority
    priority: 'medium'
  },
  {
    id: "noorbhoy-970",
    size: "90%x180", // Reduced width and height for better proportions
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Noorbhoy-Banner-970x180-1.webp",
    redirectUrl: "https://noorbhoy.com",
    active: true,
    title: "Noorbhoy Construction",
    description: "Quality construction services",
    weight: 7, // Medium-high priority
    priority: 'medium'
  },
  {
    id: "bw-970",
    size: "90%x180", // Reduced width and height for better proportions
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/BW-banner-970x180-1.webp",
    redirectUrl: "https://bw.com",
    active: true,
    title: "BW Engineering",
    description: "Engineering excellence",
    weight: 5, // Medium priority
    priority: 'medium'
  },
  {
    id: "crystal-970",
    size: "90%x180", // Reduced width and height for better proportions
    imageUrl: "https://archalley.com/wp-content/uploads/2025/01/Crystal-banner-970x180-1.webp",
    redirectUrl: "https://crystal.com",
    active: true,
    title: "Crystal Design",
    description: "Crystal clear architectural solutions",
    weight: 3, // Lower priority for variety
    priority: 'low'
  }
]

/**
 * ENHANCED AD SELECTION SYSTEM
 * Features: Duplicate Prevention, Weighted Selection, Session Management
 */

/**
 * Reset session state (call when user navigates or starts new session)
 */
export function resetAdSession(): void {
  adSessionState = {
    usedAds: new Set(),
    currentlyDisplayed: new Set(),
    lastRotation: Date.now(),
    sessionStartTime: Date.now(),
    adHistory: []
  }
}

/**
 * Weighted random selection - ads with higher weights appear more frequently
 */
function getWeightedRandomAd(ads: AdBanner[]): AdBanner | null {
  if (ads.length === 0) return null

  // Calculate total weight
  const totalWeight = ads.reduce((sum, ad) => sum + (ad.weight || 1), 0)
  
  // Generate random number between 0 and totalWeight
  let randomWeight = Math.random() * totalWeight
  
  // Find the ad that corresponds to this weight
  for (const ad of ads) {
    randomWeight -= (ad.weight || 1)
    if (randomWeight <= 0) {
      return ad
    }
  }
  
  // Fallback to last ad
  return ads[ads.length - 1]
}

/**
 * Get available ads excluding currently displayed ones (prevents duplicates)
 */
function getAvailableAds(size: string): AdBanner[] {
  const sizeMap: Record<string, string> = {
    '680x180': '100%x250',
    '350x350': '400x400', 
    '970x180': '100%x250',
    '800x200': '100%x250',
    '1200x240': '100%x250',
    '1200x300': '100%x250',
    '100%x250': '100%x250'
  }

  const targetSize = sizeMap[size] || size
  
  return initialAdConfigs.filter(banner => 
    banner.size === targetSize && 
    banner.active &&
    !adSessionState.currentlyDisplayed.has(banner.id)
  )
}

/**
 * Session-aware ad selection with variety enhancement
 */
function getSessionAwareAd(availableAds: AdBanner[]): AdBanner | null {
  if (availableAds.length === 0) return null

  // Prefer ads that haven't been shown in this session
  const newAds = availableAds.filter(ad => !adSessionState.usedAds.has(ad.id))
  
  if (newAds.length > 0) {
    return getWeightedRandomAd(newAds)
  }
  
  // If all ads have been shown, reset and start over with lower frequency ads first
  const lowerWeightAds = availableAds.filter(ad => (ad.weight || 1) <= 5)
  if (lowerWeightAds.length > 0) {
    return getWeightedRandomAd(lowerWeightAds)
  }
  
  // Fallback to any available ad
  return getWeightedRandomAd(availableAds)
}

/**
 * Enhanced ad banner selection with all features
 * @param size - Banner size
 * @param positionId - Unique identifier for ad position (prevents duplicates)
 * @returns Selected ad banner or null if none available
 */
export function getEnhancedAdBanner(
  size: '680x180' | '350x350' | '970x180' | '800x200' | '400x400' | '320x320' | '1200x240' | '1200x300' | '100%x250' | '90%x180',
  positionId?: string
): AdBanner | null {
  const availableAds = getAvailableAds(size)
  const selectedAd = getSessionAwareAd(availableAds)
  
  if (selectedAd) {
    // Track the selection
    adSessionState.currentlyDisplayed.add(selectedAd.id)
    adSessionState.usedAds.add(selectedAd.id)
    adSessionState.adHistory.push(selectedAd.id)
    
    // Limit history size to prevent memory issues
    if (adSessionState.adHistory.length > 50) {
      adSessionState.adHistory = adSessionState.adHistory.slice(-30)
    }
    
    console.log(`🎯 Ad Selected: ${selectedAd.title} (Weight: ${selectedAd.weight}, Position: ${positionId})`)
  }
  
  return selectedAd
}

/**
 * Release ad position (call when ad is unmounted)
 */
export function releaseAdPosition(adId: string): void {
  adSessionState.currentlyDisplayed.delete(adId)
}

/**
 * Get next ad for rotation (used by auto-rotation)
 */
export function getNextRotationAd(
  currentAdId: string,
  size: '680x180' | '350x350' | '970x180' | '800x200' | '400x400' | '320x320' | '1200x240' | '1200x300' | '100%x250' | '90%x180',
  positionId?: string
): AdBanner | null {
  // Release current ad position
  releaseAdPosition(currentAdId)
  
  // Get new ad
  return getEnhancedAdBanner(size, positionId)
}

/**
 * Legacy function for backwards compatibility (now uses enhanced system)
 */
export function getRandomAdBanner(size: '680x180' | '350x350' | '970x180' | '800x200' | '400x400' | '320x320' | '1200x240' | '1200x300' | '100%x250' | '90%x180'): AdBanner | null {
  return getEnhancedAdBanner(size, `legacy-${Date.now()}`)
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

/**
 * Get all active banners for a specific size (enhanced)
 * @param size - Banner size
 * @returns Array of active banners
 */
export function getAdBanners(size: '680x180' | '350x350' | '970x180' | '800x200' | '400x400' | '320x320' | '1200x240' | '1200x300' | '100%x250' | '90%x180'): AdBanner[] {
  const sizeMap: Record<string, string> = {
    '680x180': '90%x180',    // Updated mapping
    '350x350': '320x320',    // Updated mapping
    '970x180': '90%x180',    // Updated mapping
    '800x200': '90%x180',    // Updated mapping
    '1200x240': '90%x180',   // Updated mapping
    '1200x300': '90%x180',   // Updated mapping
    '100%x250': '90%x180',   // Updated mapping
    '400x400': '320x320',    // Updated mapping
    '320x320': '320x320',    // Direct mapping
    '90%x180': '90%x180'     // Direct mapping
  }

  const targetSize = sizeMap[size] || size
  
  return initialAdConfigs.filter(banner => 
    banner.size === targetSize && banner.active
  )
}

/**
 * Track ad click (enhanced with session tracking)
 * @param bannerId - Banner ID
 */
export function trackAdClick(bannerId: string): void {
  // In production, this would save to database/analytics
  console.log(`🎯 Ad clicked: ${bannerId}`)
  
  // Update local click count for demonstration
  const banner = initialAdConfigs.find(b => b.id === bannerId)
  if (banner) {
    banner.clickCount = (banner.clickCount || 0) + 1
  }

  // Track in session for analytics
  adSessionState.adHistory.push(`click:${bannerId}`)
}

/**
 * Get advertisement statistics for debugging/monitoring
 */
export function getAdStats() {
  return {
    sessionStartTime: adSessionState.sessionStartTime,
    totalAdsShown: adSessionState.usedAds.size,
    currentlyDisplayed: Array.from(adSessionState.currentlyDisplayed),
    adHistory: adSessionState.adHistory.slice(-10), // Last 10 events
    availableAds: initialAdConfigs.filter(ad => ad.active).length,
    sessionDuration: Date.now() - adSessionState.sessionStartTime
  }
}