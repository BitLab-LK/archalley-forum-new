"use client"

import { useState } from "react"
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
import { shareService, ShareMethod } from "@/lib/share-service"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ShareDropdownProps {
  post: any
  className?: string
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  showLabel?: boolean
}

export default function ShareDropdown({ 
  post, 
  className, 
  variant = "ghost",
  size = "sm",
  showLabel = true
}: ShareDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedRecently, setCopiedRecently] = useState(false)
  const { toast } = useToast()

  const handleShare = async (method: ShareMethod) => {
    try {
      const success = await shareService.share(post, method)
      
      if (success) {
        switch (method) {
          case 'copy':
            setCopiedRecently(true)
            setTimeout(() => setCopiedRecently(false), 2000)
            toast({
              title: "Link copied!",
              description: "Post link copied to clipboard",
              duration: 2000,
            })
            break
          case 'native':
            // No toast needed for native sharing
            break
          default:
            toast({
              title: "Shared successfully!",
              description: `Post shared via ${method}`,
              duration: 2000,
            })
        }
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share post. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const shareOptions = [
    // Always available options
    {
      method: 'copy' as ShareMethod,
      label: copiedRecently ? 'Copied!' : 'Copy link',
      icon: copiedRecently ? Check : Copy,
      color: copiedRecently ? 'text-green-600' : 'text-gray-600'
    },
    
    // Social media options
    {
      method: 'whatsapp' as ShareMethod,
      label: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600'
    },
    {
      method: 'twitter' as ShareMethod,
      label: 'Twitter',
      icon: Twitter,
      color: 'text-blue-500'
    },
    {
      method: 'facebook' as ShareMethod,
      label: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600'
    },
    {
      method: 'linkedin' as ShareMethod,
      label: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700'
    },
    {
      method: 'telegram' as ShareMethod,
      label: 'Telegram',
      icon: Send,
      color: 'text-sky-500'
    },
    {
      method: 'email' as ShareMethod,
      label: 'Email',
      icon: Mail,
      color: 'text-gray-600'
    }
  ]

  return (
    <div className={cn("relative inline-flex items-center gap-1", className)}>
      {/* Share Button */}
      {!isOpen && (
        <Button 
          variant={variant} 
          size={size} 
          className="transition-colors duration-200 relative z-[1001]"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setIsOpen(true)
          }}
        >
          <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          {showLabel && <span className="text-xs sm:text-sm">Share</span>}
        </Button>
      )}
      
      {/* Share Options (shown when opened) */}
      {isOpen && (
        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
          {shareOptions.map((option) => (
            <Button
              key={option.method}
              variant="ghost"
              size={size}
              className={cn(
                "p-1.5 h-auto transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700",
                option.color
              )}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleShare(option.method)
                setIsOpen(false)
              }}
              title={option.label}
            >
              <option.icon className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          ))}
          {/* Close button */}
          <Button
            variant="ghost"
            size={size}
            className="p-1.5 h-auto transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setIsOpen(false)
            }}
            title="Close"
          >
            ×
          </Button>
        </div>
      )}
    </div>
  )
}
