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
import { shareService, ShareMethod } from "@/lib/share-service"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ShareDropdownProps {
  post: any
  className?: string
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  showLabel?: boolean
  context?: "homepage" | "modal" // Add context prop
}

export default function ShareDropdown({ 
  post, 
  className, 
  variant = "ghost",
  size = "sm",
  showLabel = true,
  context = "homepage" // Default to homepage
}: ShareDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedRecently, setCopiedRecently] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('top')
  const [dropdownCoords, setDropdownCoords] = useState<{x: number, y: number} | null>(null)
  const { toast } = useToast()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    
    return undefined
  }, [isOpen])

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      // Small delay to ensure DOM is ready for accurate positioning
      const calculatePosition = () => {
        const rect = dropdownRef.current!.getBoundingClientRect()
        const spaceAbove = rect.top
        
        // Determine vertical position
        const useTop = spaceAbove > 60
        setDropdownPosition(useTop ? 'top' : 'bottom')
        
        // Always set coordinates for consistent positioning
        const dropdownWidth = 280
        const buttonCenter = rect.left + (rect.width / 2)
        
        // Separate positioning for homepage vs modal
        let x, y
        
        if (context === "modal") {
          // Modal positioning: ALWAYS move to top of share button
          x = buttonCenter - (dropdownWidth / 2)
          y = rect.top - 45  // Always 45px above the button regardless of space
          setDropdownPosition('top') // Force top position for modal
        } else {
          // Homepage positioning: more near and more left
          x = buttonCenter - (dropdownWidth / 2) -150  // More left (was -50, now -80)
          y = useTop ? rect.top + 80 : rect.bottom + 2   // Very close to button
        }
        
        // Ensure dropdown doesn't go off screen
        const maxX = window.innerWidth - dropdownWidth - 10
        const finalX = Math.max(10, Math.min(x, maxX))
        
        // Force update coordinates
        setDropdownCoords({ x: finalX, y })
      }
      
      // Calculate immediately and also after a small delay for stability
      calculatePosition()
      const timeoutId = setTimeout(calculatePosition, 10)
      
      return () => clearTimeout(timeoutId)
    } else {
      // Clear coordinates when closed
      setDropdownCoords(null)
    }
    
    return undefined
  }, [isOpen, context])

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
      color: copiedRecently ? 'text-green-600' : 'text-gray-600',
      priority: 1
    },
    
    // Most popular social media options (prioritized for mobile)
    {
      method: 'whatsapp' as ShareMethod,
      label: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      priority: 2
    },
    {
      method: 'twitter' as ShareMethod,
      label: 'Twitter',
      icon: Twitter,
      color: 'text-blue-500',
      priority: 3
    },
    {
      method: 'facebook' as ShareMethod,
      label: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      priority: 4
    },
    {
      method: 'linkedin' as ShareMethod,
      label: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      priority: 5
    },
    {
      method: 'telegram' as ShareMethod,
      label: 'Telegram',
      icon: Send,
      color: 'text-sky-500',
      priority: 6
    },
    {
      method: 'email' as ShareMethod,
      label: 'Email',
      icon: Mail,
      color: 'text-gray-600',
      priority: 7
    }
  ]

  // On mobile, show only the most important share options to prevent wrapping
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const displayedOptions = isMobile ? shareOptions.slice(0, 4) : shareOptions

  return (
    <div ref={dropdownRef} className={cn("relative inline-flex items-center", className)}>
      {/* Share Options (shown when opened) - positioned dynamically */}
      {isOpen && dropdownCoords && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-[1001] md:hidden" onClick={() => setIsOpen(false)} />
          
          {/* Fixed positioning dropdown */}
          <div 
            className="fixed flex items-center gap-1 animate-in fade-in duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap z-[99999]"
            style={{
              left: dropdownCoords.x,
              top: dropdownCoords.y,
            }}
          >
            {/* Arrow pointing to share button */}
            <div className={cn(
              "absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-l-transparent border-r-transparent",
              dropdownPosition === 'top' 
                ? "top-full border-t-[6px] border-t-gray-200 dark:border-t-gray-700" 
                : "bottom-full border-b-[6px] border-b-gray-200 dark:border-b-gray-700"
            )}></div>
            <div className={cn(
              "absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-l-transparent border-r-transparent",
              dropdownPosition === 'top' 
                ? "top-full border-t-[5px] border-t-white dark:border-t-gray-800 -mt-px" 
                : "bottom-full border-b-[5px] border-b-white dark:border-b-gray-800 -mb-px"
            )}></div>
            
            {displayedOptions.map((option) => (
              <Button
                key={option.method}
                variant="ghost"
                size="sm"
                className={cn(
                  "p-2 h-8 w-8 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 rounded-md",
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
                <option.icon className="w-4 h-4" />
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 flex-shrink-0 rounded-md"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setIsOpen(false)
              }}
              title="Close"
            >
              <span className="text-lg leading-none">×</span>
            </Button>
          </div>
        </>
      )}
      
      {/* Share Button */}
      <Button 
        variant={variant} 
        size={size} 
        className="transition-colors duration-200 relative z-[1001] flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
      >
        <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
        {showLabel && <span className="text-xs sm:text-sm">Share</span>}
      </Button>
    </div>
  )
}
