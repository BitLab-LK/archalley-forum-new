"use client"

import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SidebarFacebookProps {
  className?: string
}

export default function SidebarFacebook({ className }: SidebarFacebookProps) {

  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSDK = () => {
      if (typeof window === 'undefined') return

      // Add fb-root div if not exists
      if (!document.getElementById('fb-root')) {
        const fbRoot = document.createElement('div')
        fbRoot.id = 'fb-root'
        document.body.appendChild(fbRoot)
      }

      // Check if SDK is already loaded
      if (document.getElementById('facebook-jssdk')) {
        if ((window as any).FB) {
          setTimeout(() => {
            (window as any).FB.XFBML.parse()
          }, 500)
        }
        return
      }

      // Insert Facebook SDK script with official configuration
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v24.0&appId=1075191320881967'
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      
      script.onload = () => {
        if ((window as any).FB) {
          setTimeout(() => {
            (window as any).FB.XFBML.parse()
          }, 500)
        }
      }
      
      const fjs = document.getElementsByTagName('script')[0]
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(script, fjs)
      } else {
        document.head.appendChild(script)
      }
    }

    const timer = setTimeout(loadFacebookSDK, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Card className={`${className} border-0 shadow-sm bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm overflow-hidden`}>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-base text-gray-900 dark:text-gray-100">
          Follow us on Facebook
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Live Facebook Page Plugin - Scrollable */}
        <div className="w-full">
          <div 
            className="fb-page" 
            data-href="https://web.facebook.com/1823509644579642"
            data-tabs="timeline"
            data-width=""
            data-height=""
            data-small-header="true"
            data-adapt-container-width="true"
            data-hide-cover="false"
            data-show-facepile="true"
          >
            <blockquote cite="https://web.facebook.com/1823509644579642" className="fb-xfbml-parse-ignore">
              <a href="https://web.facebook.com/1823509644579642">Archalley</a>
            </blockquote>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}