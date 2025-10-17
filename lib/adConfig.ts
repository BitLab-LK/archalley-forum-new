// Advertisement banner configuration - CLIENT-SIDE API IMPLEMENTATION

// Note: This runs in the browser, so we use fetch API instead of direct database calls

export interface AdBanner {
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

interface AdSessionState {
  usedAds: Set<string>
  currentlyDisplayed: Set<string>
  lastRotation: number
  sessionStartTime: number
  adHistory: string[]
}

let adSession: AdSessionState = {
  usedAds: new Set(),
  currentlyDisplayed: new Set(),
  lastRotation: Date.now(),
  sessionStartTime: Date.now(),
  adHistory: []
}

export function resetAdSession() {
  adSession.usedAds.clear()
  adSession.adHistory = []
  console.log('🔄 Ad session reset - starting fresh cycle')
}

function trackRotationEvent(adId: string, type: 'rotation' | 'manual') {
  console.log(`📊 Ad rotation: ${adId} (${type})`)
  adSession.lastRotation = Date.now()
  adSession.adHistory.push(adId)
}

export async function getAvailableSizes(): Promise<string[]> {
  try {
    const response = await fetch('/api/admin/ads?action=sizes')
    if (!response.ok) {
      throw new Error(`Failed to fetch sizes: ${response.status}`)
    }
    const data = await response.json()
    return data.sizes || ['350x350', '680x180', '970x180']
  } catch (error) {
    console.error('Error fetching available sizes:', error)
    return ['350x350', '680x180', '970x180']
  }
}

export async function getAllActiveBanners(): Promise<AdBanner[]> {
  try {
    const response = await fetch('/api/admin/ads?action=active')
    if (!response.ok) {
      throw new Error(`Failed to fetch active banners: ${response.status}`)
    }
    const data = await response.json()
    return data.ads || []
  } catch (error) {
    console.error('Error fetching active banners:', error)
    return []
  }
}

export async function getEnhancedAdBanner(size: string, positionId?: string): Promise<AdBanner | null> {
  try {
    const position = positionId || 'default'
    console.log(`🎯 Requesting ${size} banner from API for position: ${position}`)
    
    // Fetch ads by size from API
    const response = await fetch(`/api/admin/ads?action=bySize&size=${encodeURIComponent(size)}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ads: ${response.status}`)
    }
    
    const data = await response.json()
    const ads = data.ads || []
    
    if (ads.length === 0) {
      console.log(`❌ No active ${size} ads found`)
      return null
    }

    const availableAds: AdBanner[] = ads.map((ad: any) => ({
      id: ad.id,
      size: ad.size,
      imageUrl: ad.imageUrl,
      redirectUrl: ad.redirectUrl,
      active: ad.active,
      title: ad.title,
      description: ad.description,
      clickCount: ad.clickCount,
      weight: ad.weight,
      priority: ad.priority as 'high' | 'medium' | 'low'
    }))

    const unusedAds = availableAds.filter(ad => !adSession.usedAds.has(ad.id))
    const adsToChooseFrom = unusedAds.length > 0 ? unusedAds : availableAds

    if (unusedAds.length === 0) {
      resetAdSession()
    }

    let selectedAd = selectWeightedAd(adsToChooseFrom)
    
    if (selectedAd) {
      adSession.usedAds.add(selectedAd.id)
      adSession.currentlyDisplayed.add(selectedAd.id)
      
      console.log(`✅ Selected ${size} ad: ${selectedAd.id} (${selectedAd.title || 'No title'}) for position: ${position}`)
      
      // Track impression via API
      await trackAdImpression(selectedAd.id)
      
      return selectedAd
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching ${size} banner:`, error)
    return null
  }
}

function selectWeightedAd(ads: AdBanner[]): AdBanner | null {
  if (ads.length === 0) return null
  if (ads.length === 1) return ads[0]

  const totalWeight = ads.reduce((sum, ad) => {
    const weight = ad.weight || 5
    const priorityMultiplier = ad.priority === 'high' ? 2 : ad.priority === 'low' ? 0.5 : 1
    return sum + (weight * priorityMultiplier)
  }, 0)

  let random = Math.random() * totalWeight
  
  for (const ad of ads) {
    const weight = ad.weight || 5
    const priorityMultiplier = ad.priority === 'high' ? 2 : ad.priority === 'low' ? 0.5 : 1
    const effectiveWeight = weight * priorityMultiplier
    
    random -= effectiveWeight
    if (random <= 0) {
      return ad
    }
  }
  
  return ads[ads.length - 1]
}

export async function getNextRotationAd(currentAdId: string, size: string, positionId?: string): Promise<AdBanner | null> {
  try {
    const position = positionId || 'default'
    console.log(`🔄 Rotating from ${currentAdId} for size ${size} at position: ${position}`)
    
    // Fetch ads by size from API
    const response = await fetch(`/api/admin/ads?action=bySize&size=${encodeURIComponent(size)}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ads: ${response.status}`)
    }
    
    const data = await response.json()
    const ads = data.ads || []
    
    if (ads.length <= 1) {
      console.log(`❌ Not enough ${size} ads for rotation`)
      return null
    }

    const availableAds: AdBanner[] = ads
      .filter((ad: any) => ad.id !== currentAdId)
      .map((ad: any) => ({
        id: ad.id,
        size: ad.size,
        imageUrl: ad.imageUrl,
        redirectUrl: ad.redirectUrl,
        active: ad.active,
        title: ad.title,
        description: ad.description,
        clickCount: ad.clickCount,
        weight: ad.weight,
        priority: ad.priority as 'high' | 'medium' | 'low'
      }))

    adSession.currentlyDisplayed.delete(currentAdId)
    
    const selectedAd = selectWeightedAd(availableAds)
    
    if (selectedAd) {
      adSession.usedAds.add(selectedAd.id)
      adSession.currentlyDisplayed.add(selectedAd.id)
      trackRotationEvent(selectedAd.id, 'rotation')
      
      // Track impression via API
      await trackAdImpression(selectedAd.id)
      
      console.log(`✅ Rotated to ${size} ad: ${selectedAd.id} at position: ${position}`)
      return selectedAd
    }
    
    return null
  } catch (error) {
    console.error(`Error rotating ${size} banner:`, error)
    return null
  }
}

export async function trackAdClickClient(adId: string): Promise<void> {
  try {
    console.log(`🖱️ Tracking click for ad: ${adId}`)
    
    const response = await fetch('/api/admin/ads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'trackClick',
        adId: adId
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to track click: ${response.status}`)
    }
    
    const result = await response.json()
    console.log(`✅ Click tracked successfully for ad: ${adId}`, result)
  } catch (error) {
    console.error(`Error tracking click for ad ${adId}:`, error)
  }
}

// Track ad impression via API
export async function trackAdImpression(adId: string): Promise<void> {
  try {
    const response = await fetch('/api/admin/ads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'trackImpression',
        adId: adId
      })
    })
    
    if (!response.ok) {
      console.warn(`Failed to track impression for ad ${adId}: ${response.status}`)
      return
    }
    
    console.log(`👁️ Impression tracked for ad: ${adId}`)
  } catch (error) {
    console.error(`Error tracking impression for ad ${adId}:`, error)
  }
}

export async function updateBannerStatus(bannerId: string, active: boolean): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/ads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'toggle',
        id: bannerId,
        active: active
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update banner status: ${response.status}`)
    }
    
    console.log(`✅ Banner ${bannerId} status updated to: ${active}`)
    return true
  } catch (error) {
    console.error(`Error updating banner status:`, error)
    return false
  }
}

export async function getAdStatistics(): Promise<any> {
  try {
    const response = await fetch('/api/admin/ads?action=stats')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ad statistics: ${response.status}`)
    }
    
    const stats = await response.json()
    return stats
  } catch (error) {
    console.error('Error fetching ad statistics:', error)
    return null
  }
}

export function clearAdSession(): void {
  adSession.usedAds.clear()
  adSession.currentlyDisplayed.clear()
  adSession.adHistory = []
  adSession.sessionStartTime = Date.now()
  adSession.lastRotation = Date.now()
  console.log('🧹 Ad session cleared')
}

export function getSessionInfo(): AdSessionState {
  return {
    ...adSession,
    usedAds: new Set(adSession.usedAds),
    currentlyDisplayed: new Set(adSession.currentlyDisplayed)
  }
}

// Release ad position (remove from currently displayed)
export function releaseAdPosition(adId: string): void {
  adSession.currentlyDisplayed.delete(adId)
  console.log(`🔓 Released ad position: ${adId}`)
}

// Initial ad configurations for seeding
export const initialAdConfigs = [
  {
    id: 'tech-banner-1',
    title: 'Tech Solutions Pro',
    description: 'Advanced technology solutions for your business',
    imageUrl: 'https://via.placeholder.com/680x180/4F46E5/FFFFFF?text=Tech+Solutions+Pro',
    redirectUrl: 'https://techsolutions.com',
    size: '680x180',
    active: true,
    weight: 8,
    priority: 'high',
    clickCount: 0
  },
  {
    id: 'design-banner-1',
    title: 'Creative Design Studio',
    description: 'Professional design services for all your needs',
    imageUrl: 'https://via.placeholder.com/350x350/10B981/FFFFFF?text=Creative+Design',
    redirectUrl: 'https://creativedesign.com',
    size: '350x350',
    active: true,
    weight: 7,
    priority: 'medium',
    clickCount: 0
  },
  {
    id: 'marketing-banner-1',
    title: 'Digital Marketing Agency',
    description: 'Boost your online presence with our marketing expertise',
    imageUrl: 'https://via.placeholder.com/970x180/F59E0B/FFFFFF?text=Digital+Marketing',
    redirectUrl: 'https://digitalmarketing.com',
    size: '970x180',
    active: true,
    weight: 6,
    priority: 'medium',
    clickCount: 0
  },
  {
    id: 'consulting-banner-1',
    title: 'Business Consulting',
    description: 'Expert business advice to grow your company',
    imageUrl: 'https://via.placeholder.com/680x180/DC2626/FFFFFF?text=Business+Consulting',
    redirectUrl: 'https://businessconsulting.com',
    size: '680x180',
    active: true,
    weight: 5,
    priority: 'low',
    clickCount: 0
  },
  {
    id: 'software-banner-1',
    title: 'Software Development',
    description: 'Custom software solutions for modern businesses',
    imageUrl: 'https://via.placeholder.com/350x350/7C3AED/FFFFFF?text=Software+Dev',
    redirectUrl: 'https://softwaredev.com',
    size: '350x350',
    active: true,
    weight: 8,
    priority: 'high',
    clickCount: 0
  }
]