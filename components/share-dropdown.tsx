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
  Check,
  MoreHorizontal
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
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const { toast } = useToast()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowMoreOptions(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    
    return undefined
  }, [isOpen])

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

  // On mobile, show more share options in the bottom sheet (4-column grid allows for 8 items)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768 // Use same breakpoint
  const displayedOptions = isMobile ? shareOptions.slice(0, 8) : shareOptions // Show 8 main options on mobile for 4-column layout

  return (
    <div ref={dropdownRef} className={cn("relative inline-flex items-center", className)}>
      {/* Share Options - Facebook-style modal/dropdown */}
      {isOpen && (
        <>
          {/* Mobile: Full-screen overlay with bottom sheet - More compact */}
          {isMobile ? (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 z-[99998] animate-in fade-in duration-300" 
                onClick={() => setIsOpen(false)} 
              />
              
              {/* Bottom Sheet Modal - More compact */}
              <div className="fixed bottom-0 left-0 right-0 z-[99999] animate-in slide-in-from-bottom duration-300 ease-out">
                <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-700 max-h-[75vh] overflow-hidden">
                  {/* Handle bar - smaller */}
                  <div className="flex justify-center py-3">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  </div>
                  
                  {/* Header - more compact */}
                  <div className="px-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share post</h3>
                  </div>
                  
                  {/* Share options grid - more compact */}
                  <div className="p-4 pb-6">
                    <div className="grid grid-cols-4 gap-4">
                      {displayedOptions.map((option) => (
                        <button
                          key={option.method}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleShare(option.method)
                            setIsOpen(false)
                          }}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                            option.color === 'text-green-600' ? 'bg-green-500 text-white' :
                            option.color === 'text-blue-500' ? 'bg-blue-500 text-white' :
                            option.color === 'text-blue-600' ? 'bg-blue-600 text-white' :
                            option.color === 'text-blue-700' ? 'bg-blue-700 text-white' :
                            option.color === 'text-sky-500' ? 'bg-sky-500 text-white' :
                            'bg-gray-600 text-white'
                          )}>
                            <option.icon className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-gray-100 text-center leading-tight">
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Cancel button - more compact */}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-full mt-4 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Desktop: Inline expansion - direction based on context */
            context === "modal" ? (
              /* Modal: Expand to the LEFT to keep share button visible */
              <div className="inline-flex items-center mr-1 animate-in fade-in slide-in-from-right duration-200 max-w-full overflow-hidden">
                {/* Share options inline - positioned to the left */}
                <div className="flex items-center gap-0.5 overflow-x-auto max-w-full scrollbar-hide">
                  {/* Show first 4 options or all if expanded */}
                  {(showMoreOptions ? shareOptions : shareOptions.slice(0, 4)).map((option) => (
                    <button
                      key={option.method}
                      className="group flex items-center justify-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleShare(option.method)
                        setIsOpen(false)
                        setShowMoreOptions(false)
                      }}
                      title={option.label}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                        option.color === 'text-green-600' ? 'bg-green-100 dark:bg-green-900 group-hover:bg-green-500 group-hover:text-white' :
                        option.color === 'text-blue-500' ? 'bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-500 group-hover:text-white' :
                        option.color === 'text-blue-600' ? 'bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-600 group-hover:text-white' :
                        option.color === 'text-blue-700' ? 'bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-700 group-hover:text-white' :
                        option.color === 'text-sky-500' ? 'bg-sky-100 dark:bg-sky-900 group-hover:bg-sky-500 group-hover:text-white' :
                        'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-600 group-hover:text-white',
                        "group-hover:scale-105"
                      )}>
                        <option.icon className={cn(
                          "w-3.5 h-3.5 transition-colors duration-200",
                          option.color,
                          "group-hover:text-white"
                        )} />
                      </div>
                    </button>
                  ))}
                  
                  {/* More/Less toggle button - only show if there are more than 4 options */}
                  {shareOptions.length > 4 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setShowMoreOptions(!showMoreOptions)
                      }}
                      className="group flex items-center justify-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex-shrink-0"
                      title={showMoreOptions ? "Show less" : "Show more"}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 flex items-center justify-center transition-all duration-200 group-hover:scale-105">
                        {showMoreOptions ? (
                          <span className="text-xs leading-none font-semibold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">−</span>
                        ) : (
                          <MoreHorizontal className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200" />
                        )}
                      </div>
                    </button>
                  )}
                  
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowMoreOptions(false)
                    }}
                    className="group flex items-center justify-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-0.5 flex-shrink-0"
                    title="Close"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                      <span className="text-xs leading-none font-semibold">×</span>
                    </div>
                  </button>
                </div>
                
                {/* Separator line */}
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 ml-1 flex-shrink-0"></div>
              </div>
            ) : (
              /* Homepage: Expand to the RIGHT */
              <div className="inline-flex items-center ml-1 animate-in fade-in slide-in-from-left duration-200 max-w-full overflow-hidden">
                {/* Separator line */}
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mr-1 flex-shrink-0"></div>
                
                {/* Share options inline - with overflow scroll if needed */}
                <div className="flex items-center gap-0.5 overflow-x-auto max-w-full scrollbar-hide">
                  {/* Show first 4 options or all if expanded */}
                  {(showMoreOptions ? shareOptions : shareOptions.slice(0, 4)).map((option) => (
                    <button
                      key={option.method}
                      className="group flex items-center justify-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleShare(option.method)
                        setIsOpen(false)
                        setShowMoreOptions(false)
                      }}
                      title={option.label}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                        option.color === 'text-green-600' ? 'bg-green-100 dark:bg-green-900 group-hover:bg-green-500 group-hover:text-white' :
                        option.color === 'text-blue-500' ? 'bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-500 group-hover:text-white' :
                        option.color === 'text-blue-600' ? 'bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-600 group-hover:text-white' :
                        option.color === 'text-blue-700' ? 'bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-700 group-hover:text-white' :
                        option.color === 'text-sky-500' ? 'bg-sky-100 dark:bg-sky-900 group-hover:bg-sky-500 group-hover:text-white' :
                        'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-600 group-hover:text-white',
                        "group-hover:scale-105"
                      )}>
                        <option.icon className={cn(
                          "w-3.5 h-3.5 transition-colors duration-200",
                          option.color,
                          "group-hover:text-white"
                        )} />
                      </div>
                    </button>
                  ))}
                  
                  {/* More/Less toggle button - only show if there are more than 4 options */}
                  {shareOptions.length > 4 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setShowMoreOptions(!showMoreOptions)
                      }}
                      className="group flex items-center justify-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex-shrink-0"
                      title={showMoreOptions ? "Show less" : "Show more"}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 flex items-center justify-center transition-all duration-200 group-hover:scale-105">
                        {showMoreOptions ? (
                          <span className="text-xs leading-none font-semibold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">−</span>
                        ) : (
                          <MoreHorizontal className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200" />
                        )}
                      </div>
                    </button>
                  )}
                  
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowMoreOptions(false)
                    }}
                    className="group flex items-center justify-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-0.5 flex-shrink-0"
                    title="Close"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                      <span className="text-xs leading-none font-semibold">×</span>
                    </div>
                  </button>
                </div>
              </div>
            )
          )}
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
