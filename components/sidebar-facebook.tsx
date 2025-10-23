"use client"

import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'

interface SidebarFacebookProps {
  className?: string
}

export default function SidebarFacebook({ className }: SidebarFacebookProps) {
  useEffect(() => {
    // Load Facebook SDK with better error handling
    const loadFacebookSDK = () => {
      if (typeof window === 'undefined') return

      // Check if SDK is already loading/loaded
      if (document.getElementById('facebook-jssdk')) {
        if ((window as any).FB) {
          setTimeout(() => {
            (window as any).FB.XFBML.parse()
          }, 100)
        }
        return
      }

      // Create and load Facebook SDK
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0&appId=YOUR_APP_ID'
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      
      script.onload = () => {
        if ((window as any).FB) {
          (window as any).FB.init({
            xfbml: true,
            version: 'v18.0'
          })
          // Parse after a short delay to ensure DOM is ready
          setTimeout(() => {
            (window as any).FB.XFBML.parse()
          }, 500)
        }
      }

      script.onerror = () => {
        console.warn('Failed to load Facebook SDK')
      }
      
      document.head.appendChild(script)
    }

    // Delay loading to improve performance
    const timer = setTimeout(loadFacebookSDK, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Card className={`${className} border-0 shadow-sm bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm`}>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-base text-gray-900 dark:text-gray-100">
          Facebook
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Live Facebook Page Plugin */}
        <div className="w-full">
          <div 
            className="fb-page" 
            data-href="https://www.facebook.com/archalley/"
            data-tabs="timeline"
            data-width=""
            data-height="300"
            data-small-header="true"
            data-adapt-container-width="true"
            data-hide-cover="true"
            data-show-facepile="false"
          >
            {/* Minimal loading state */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-6 h-72 flex items-center justify-center">
              <div className="text-center">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded mx-auto animate-pulse mb-2"></div>
                <p className="text-xs text-muted-foreground">Loading updates...</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Minimal Page Link */}
        <Link href="https://www.facebook.com/archalley/" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800">
            View Page →
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}