import { Advertisement, AdPriority } from '@prisma/client'
import { deleteAdImageFromBlob, getAdImageInfoFromUrl } from '@/lib/blob-storage'
import { prisma } from '@/lib/prisma'

export interface CreateAdvertisementData {
  title?: string
  description?: string
  imageUrl: string
  redirectUrl: string
  size: string
  active?: boolean
  weight?: number
  priority?: AdPriority
  createdBy?: string
}

export interface UpdateAdvertisementData {
  title?: string
  description?: string
  imageUrl?: string
  redirectUrl?: string
  size?: string
  active?: boolean
  weight?: number
  priority?: AdPriority
  lastEditedBy?: string
}

export class AdvertisementService {
  
  /**
   * Get all advertisements
   */
  static async getAllAds(): Promise<Advertisement[]> {
    return await prisma.advertisement.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        editor: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { active: 'desc' },
        { priority: 'desc' },
        { weight: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  }

  /**
   * Get active advertisements only
   */
  static async getActiveAds(): Promise<Advertisement[]> {
    return await prisma.advertisement.findMany({
      where: { active: true },
      orderBy: [
        { priority: 'desc' },
        { weight: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  }

  /**
   * Get advertisements by size
   */
  static async getAdsBySize(size: string): Promise<Advertisement[]> {
    return await prisma.advertisement.findMany({
      where: { 
        size,
        active: true 
      },
      orderBy: [
        { priority: 'desc' },
        { weight: 'desc' }
      ]
    })
  }

  /**
   * Get advertisement by ID
   */
  static async getAdById(id: string): Promise<Advertisement | null> {
    return await prisma.advertisement.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        editor: {
          select: { id: true, name: true, email: true }
        }
      }
    })
  }

  /**
   * Create a new advertisement
   */
  static async createAd(data: CreateAdvertisementData): Promise<Advertisement> {
    return await prisma.advertisement.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        redirectUrl: data.redirectUrl,
        size: data.size,
        active: data.active ?? true,
        weight: data.weight ?? 1,
        priority: data.priority ?? AdPriority.LOW,
        createdBy: data.createdBy
      }
    })
  }

  /**
   * Update an advertisement
   */
  static async updateAd(id: string, data: UpdateAdvertisementData): Promise<Advertisement | null> {
    try {
      return await prisma.advertisement.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      return null
    }
  }

  /**
   * Toggle advertisement active status
   */
  static async toggleAdStatus(id: string, active: boolean, userId?: string): Promise<Advertisement | null> {
    try {
      return await prisma.advertisement.update({
        where: { id },
        data: {
          active,
          lastEditedBy: userId,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      return null
    }
  }

  /**
   * Delete an advertisement (soft delete by deactivating)
   */
  static async deleteAd(id: string, userId?: string): Promise<boolean> {
    try {
      await prisma.advertisement.update({
        where: { id },
        data: {
          active: false,
          lastEditedBy: userId,
          updatedAt: new Date()
        }
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Hard delete an advertisement (permanent)
   */
  static async hardDeleteAd(id: string): Promise<boolean> {
    try {
      await prisma.advertisement.delete({
        where: { id }
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Track click for an advertisement
   */
  static async trackClick(id: string): Promise<boolean> {
    try {
      await prisma.advertisement.update({
        where: { id },
        data: {
          clickCount: {
            increment: 1
          }
        }
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Track impression for an advertisement
   */
  static async trackImpression(id: string): Promise<boolean> {
    try {
      await prisma.advertisement.update({
        where: { id },
        data: {
          impressions: {
            increment: 1
          }
        }
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get advertisement statistics
   */
  static async getAdStats() {
    const [totalAds, activeAds, totalClicks, totalImpressions, availableSizes] = await Promise.all([
      prisma.advertisement.count(),
      prisma.advertisement.count({ where: { active: true } }),
      prisma.advertisement.aggregate({ _sum: { clickCount: true } }),
      prisma.advertisement.aggregate({ _sum: { impressions: true } }),
      prisma.advertisement.findMany({ select: { size: true }, distinct: ['size'] })
    ])

    const avgClicksPerBanner = totalAds > 0 ? ((totalClicks._sum.clickCount || 0) / totalAds).toFixed(2) : '0'

    return {
      totalBanners: totalAds,
      activeBanners: activeAds,
      totalClicks: totalClicks._sum.clickCount || 0,
      totalImpressions: totalImpressions._sum.impressions || 0,
      averageClicksPerBanner: avgClicksPerBanner,
      availableSizes: availableSizes.length
    }
  }

  /**
   * Get available advertisement sizes
   */
  static async getAvailableSizes(): Promise<string[]> {
    const result = await prisma.advertisement.findMany({
      select: { size: true },
      distinct: ['size']
    })
    return result.map(r => r.size)
  }

  /**
   * Seed initial advertisements from existing config
   */
  static async seedAds(initialAds: any[]): Promise<void> {
    for (const ad of initialAds) {
      await prisma.advertisement.upsert({
        where: { id: ad.id },
        update: {
          title: ad.title,
          description: ad.description,
          imageUrl: ad.imageUrl,
          redirectUrl: ad.redirectUrl,
          size: ad.size,
          active: ad.active,
          weight: ad.weight || 1,
          priority: ad.priority?.toUpperCase() as AdPriority || AdPriority.LOW,
          clickCount: ad.clickCount || 0
        },
        create: {
          id: ad.id,
          title: ad.title,
          description: ad.description,
          imageUrl: ad.imageUrl,
          redirectUrl: ad.redirectUrl,
          size: ad.size,
          active: ad.active,
          weight: ad.weight || 1,
          priority: ad.priority?.toUpperCase() as AdPriority || AdPriority.LOW,
          clickCount: ad.clickCount || 0
        }
      })
    }
  }

  /**
   * Delete advertisement with blob cleanup (Hard delete - permanent removal)
   */
  static async deleteAdWithCleanup(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Starting deletion process for advertisement: ${id}`)
      
      // Get the ad first to check for images
      const ad = await prisma.advertisement.findUnique({
        where: { id }
      })

      if (!ad) {
        console.warn(`Advertisement not found: ${id}`)
        return false
      }

      console.log(`📋 Found advertisement: "${ad.title}" (${ad.size})`)

      // Delete the image from blob storage if it exists and is from our blob storage
      if (ad.imageUrl) {
        const imageInfo = getAdImageInfoFromUrl(ad.imageUrl)
        if (imageInfo.isAdImage) {
          try {
            await deleteAdImageFromBlob(ad.imageUrl)
            console.log(`🗑️ Deleted advertisement image from blob: ${ad.imageUrl}`)
          } catch (error) {
            console.warn('Failed to delete advertisement image from blob:', error)
            // Don't fail the whole operation if image deletion fails
          }
        } else {
          console.log(`🔗 External image URL, skipping blob cleanup: ${ad.imageUrl}`)
        }
      }

      // Hard delete the advertisement (permanent removal)
      await prisma.advertisement.delete({
        where: { id }
      })

      console.log(`✅ Advertisement permanently deleted from database: ${id}`)
      return true
    } catch (error) {
      console.error('❌ Error deleting advertisement with cleanup:', error)
      return false
    }
  }

  /**
   * Update advertisement with image handling
   */
  static async updateAdWithImageHandling(
    id: string, 
    data: UpdateAdvertisementData & { oldImageUrl?: string }
  ): Promise<Advertisement | null> {
    try {
      const { oldImageUrl, ...updateData } = data

      // If image URL is being changed and old image exists, clean it up
      if (updateData.imageUrl && oldImageUrl && updateData.imageUrl !== oldImageUrl) {
        const oldImageInfo = getAdImageInfoFromUrl(oldImageUrl)
        if (oldImageInfo.isAdImage) {
          try {
            await deleteAdImageFromBlob(oldImageUrl)
            console.log(`🗑️ Cleaned up old advertisement image: ${oldImageUrl}`)
          } catch (error) {
            console.warn('Failed to delete old advertisement image:', error)
          }
        }
      }

      // Update the advertisement
      return await prisma.advertisement.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          editor: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    } catch (error) {
      console.error('Error updating advertisement with image handling:', error)
      return null
    }
  }

  /**
   * Cleanup orphaned advertisement images
   */
  static async cleanupOrphanedImages(): Promise<{ cleanedCount: number; errors: string[] }> {
    try {
      const ads = await prisma.advertisement.findMany({
        select: { imageUrl: true }
      })

      // Get current ad image URLs for potential future cleanup logic
      const currentImageUrls = ads.map(ad => ad.imageUrl).filter(Boolean)
      
      // This would require implementing a method to list all blob storage images
      // For now, return placeholder data with the count of current images
      console.log(`📊 Advertisement image cleanup check completed - ${currentImageUrls.length} images in use`)
      
      return {
        cleanedCount: 0,
        errors: []
      }
    } catch (error) {
      console.error('Error during advertisement image cleanup:', error)
      return {
        cleanedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}

export default AdvertisementService