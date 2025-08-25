"use client"

export interface ShareData {
  title: string
  text: string
  url: string
  postId: string
}

export type ShareMethod = 'native' | 'copy' | 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram' | 'email'

export class ShareService {
  private static instance: ShareService
  
  static getInstance(): ShareService {
    if (!ShareService.instance) {
      ShareService.instance = new ShareService()
    }
    return ShareService.instance
  }

  // Check if native sharing is available
  isNativeShareAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator
  }

  // Generate share data for a post
  generateShareData(post: any): ShareData {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const postUrl = `${baseUrl}/post/${post.id}`
    
    return {
      title: `${post.author.name}'s post on Archalley Forum`,
      text: post.content.length > 200 
        ? `${post.content.substring(0, 200)}...` 
        : post.content,
      url: postUrl,
      postId: post.id
    }
  }

  // Native device sharing
  async nativeShare(shareData: ShareData): Promise<boolean> {
    if (!this.isNativeShareAvailable()) {
      throw new Error('Native sharing not supported')
    }

    try {
      await navigator.share({
        title: shareData.title,
        text: shareData.text,
        url: shareData.url
      })
      return true
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled, not an error
        return false
      }
      throw error
    }
  }

  // Copy to clipboard
  async copyToClipboard(shareData: ShareData): Promise<boolean> {
    try {
      const shareText = `${shareData.text}\n\n${shareData.url}`
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareText)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = shareText
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  // Social media sharing
  shareToTwitter(shareData: ShareData): void {
    const text = encodeURIComponent(`${shareData.text}`)
    const url = encodeURIComponent(shareData.url)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  shareToFacebook(shareData: ShareData): void {
    const url = encodeURIComponent(shareData.url)
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
    window.open(facebookUrl, '_blank', 'width=580,height=400')
  }

  shareToLinkedIn(shareData: ShareData): void {
    const url = encodeURIComponent(shareData.url)
    const title = encodeURIComponent(shareData.title)
    const summary = encodeURIComponent(shareData.text)
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`
    window.open(linkedinUrl, '_blank', 'width=580,height=400')
  }

  shareToWhatsApp(shareData: ShareData): void {
    const text = encodeURIComponent(`${shareData.text}\n\n${shareData.url}`)
    const whatsappUrl = `https://wa.me/?text=${text}`
    window.open(whatsappUrl, '_blank')
  }

  shareToTelegram(shareData: ShareData): void {
    const text = encodeURIComponent(shareData.text)
    const url = encodeURIComponent(shareData.url)
    const telegramUrl = `https://t.me/share/url?url=${url}&text=${text}`
    window.open(telegramUrl, '_blank')
  }

  shareViaEmail(shareData: ShareData): void {
    const subject = encodeURIComponent(shareData.title)
    const body = encodeURIComponent(`${shareData.text}\n\nRead more: ${shareData.url}`)
    const emailUrl = `mailto:?subject=${subject}&body=${body}`
    window.location.href = emailUrl
  }

  // Track sharing analytics (optional)
  async trackShare(postId: string, method: ShareMethod): Promise<void> {
    try {
      await fetch('/api/analytics/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, method, timestamp: new Date().toISOString() })
      })
    } catch (error) {
      console.error('Failed to track share:', error)
    }
  }

  // Main share method with method selection
  async share(post: any, method?: ShareMethod): Promise<boolean> {
    const shareData = this.generateShareData(post)

    try {
      let success = false

      switch (method) {
        case 'copy':
          success = await this.copyToClipboard(shareData)
          break
        case 'twitter':
          this.shareToTwitter(shareData)
          success = true
          break
        case 'facebook':
          this.shareToFacebook(shareData)
          success = true
          break
        case 'linkedin':
          this.shareToLinkedIn(shareData)
          success = true
          break
        case 'whatsapp':
          this.shareToWhatsApp(shareData)
          success = true
          break
        case 'telegram':
          this.shareToTelegram(shareData)
          success = true
          break
        case 'email':
          this.shareViaEmail(shareData)
          success = true
          break
        case 'native':
        default:
          if (this.isNativeShareAvailable()) {
            success = await this.nativeShare(shareData)
          } else {
            // Fallback to copy
            success = await this.copyToClipboard(shareData)
          }
          break
      }

      if (success && method) {
        await this.trackShare(shareData.postId, method)
      }

      return success
    } catch (error) {
      console.error('Share failed:', error)
      return false
    }
  }
}

export const shareService = ShareService.getInstance()
