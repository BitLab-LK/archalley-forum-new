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
  Check,
  Smartphone
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    
    setIsOpen(false)
  }

  const shareOptions = [
    // Native sharing (if available)
    ...(shareService.isNativeShareAvailable() ? [{
      method: 'native' as ShareMethod,
      label: 'Share via device',
      icon: Smartphone,
      description: 'Use device sharing options'
    }] : []),
    
    // Always available options
    {
      method: 'copy' as ShareMethod,
      label: copiedRecently ? 'Copied!' : 'Copy link',
      icon: copiedRecently ? Check : Copy,
      description: 'Copy link to clipboard',
      highlight: true
    },
    
    // Social media options
    {
      method: 'whatsapp' as ShareMethod,
      label: 'WhatsApp',
      icon: MessageCircle,
      description: 'Share on WhatsApp',
      color: 'text-green-600'
    },
    {
      method: 'twitter' as ShareMethod,
      label: 'Twitter',
      icon: Twitter,
      description: 'Share on Twitter',
      color: 'text-blue-500'
    },
    {
      method: 'facebook' as ShareMethod,
      label: 'Facebook',
      icon: Facebook,
      description: 'Share on Facebook',
      color: 'text-blue-600'
    },
    {
      method: 'linkedin' as ShareMethod,
      label: 'LinkedIn',
      icon: Linkedin,
      description: 'Share on LinkedIn',
      color: 'text-blue-700'
    },
    {
      method: 'telegram' as ShareMethod,
      label: 'Telegram',
      icon: Send,
      description: 'Share on Telegram',
      color: 'text-sky-500'
    },
    {
      method: 'email' as ShareMethod,
      label: 'Email',
      icon: Mail,
      description: 'Share via email',
      color: 'text-gray-600'
    }
  ]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={cn(
            "transition-colors duration-200",
            className
          )}
        >
          <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          {showLabel && <span className="text-xs sm:text-sm">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-56 p-1"
        sideOffset={5}
      >
        <div className="px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          Share this post
        </div>
        <DropdownMenuSeparator />
        
        {shareOptions.map((option, index) => (
          <div key={option.method}>
            <DropdownMenuItem
              onClick={() => handleShare(option.method)}
              className={cn(
                "flex items-center gap-3 py-2.5 px-2 cursor-pointer transition-colors",
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                option.highlight && "bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md my-1",
                copiedRecently && option.method === 'copy' && "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
              )}
            >
              <option.icon 
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  option.color || "text-gray-600 dark:text-gray-400",
                  copiedRecently && option.method === 'copy' && "text-green-600 dark:text-green-400"
                )} 
              />
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {option.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {option.description}
                </span>
              </div>
            </DropdownMenuItem>
            
            {/* Separator after native/copy options */}
            {((option.method === 'native' && shareService.isNativeShareAvailable()) || 
              (option.method === 'copy' && !shareService.isNativeShareAvailable())) && 
              index < shareOptions.length - 1 && (
              <DropdownMenuSeparator />
            )}
          </div>
        ))}
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
          Share analytics are tracked
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
