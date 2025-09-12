"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Share2,
  Copy, 
  Twitter, 
  Facebook, 
  Linkedin, 
  MessageCircle, 
  Mail, 
  Send,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  headline?: string
}

interface ShareProfileDropdownProps {
  user: User
  className?: string
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  showLabel?: boolean
}

export default function ShareProfileDropdown({ 
  user, 
  className, 
  variant = "outline",
  size = "sm",
  showLabel = true
}: ShareProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedRecently, setCopiedRecently] = useState(false)
  const { toast } = useToast()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate profile URL
  const getProfileUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/profile/${user.id}`
  }

  // Generate share data
  const getShareData = () => {
    const profileUrl = getProfileUrl()
    const title = `Check out ${user.name}'s profile on ArchAlley Forum`
    const text = user.headline 
      ? `${user.name} - ${user.headline}` 
      : `${user.name}'s profile`
    
    return { title, text, url: profileUrl }
  }

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      const profileUrl = getProfileUrl()
      await navigator.clipboard.writeText(profileUrl)
      setCopiedRecently(true)
      toast({
        title: "Link copied!",
        description: "Profile link has been copied to your clipboard.",
      })
      
      setTimeout(() => setCopiedRecently(false), 2000)
      setIsOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive"
      })
    }
  }

  // Native share
  const handleNativeShare = async () => {
    if (!navigator.share) {
      return copyToClipboard()
    }

    try {
      const shareData = getShareData()
      await navigator.share(shareData)
      setIsOpen(false)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        copyToClipboard()
      }
    }
  }

  // Social media sharing
  const shareToTwitter = () => {
    const { title, url } = getShareData()
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=550,height=420')
    setIsOpen(false)
  }

  const shareToFacebook = () => {
    const { url } = getShareData()
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(facebookUrl, '_blank', 'width=550,height=420')
    setIsOpen(false)
  }

  const shareToLinkedIn = () => {
    const { title, url } = getShareData()
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    window.open(linkedinUrl, '_blank', 'width=550,height=420')
    setIsOpen(false)
  }

  const shareToWhatsApp = () => {
    const { title, url } = getShareData()
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
    window.open(whatsappUrl, '_blank')
    setIsOpen(false)
  }

  const shareToTelegram = () => {
    const { title, url } = getShareData()
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    window.open(telegramUrl, '_blank')
    setIsOpen(false)
  }

  const shareViaEmail = () => {
    const { title, text, url } = getShareData()
    const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`
    window.open(emailUrl)
    setIsOpen(false)
  }

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        {showLabel && <span>Share Profile</span>}
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
              Share {user.name}'s Profile
            </h3>

            {/* Primary actions */}
            <div className="grid grid-cols-2 gap-2">
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNativeShare}
                  className="justify-start"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              ) : null}
              
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="justify-start"
              >
                {copiedRecently ? (
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copiedRecently ? "Copied!" : "Copy Link"}
              </Button>
            </div>

            {/* Social media options */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Share on social media</p>
              
              <div className="grid grid-cols-6 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareToTwitter}
                  className="justify-center p-2"
                  title="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareToFacebook}
                  className="justify-center p-2"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareToLinkedIn}
                  className="justify-center p-2"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareToWhatsApp}
                  className="justify-center p-2"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareToTelegram}
                  className="justify-center p-2"
                  title="Telegram"
                >
                  <Send className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareViaEmail}
                  className="justify-center p-2"
                  title="Email"
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}