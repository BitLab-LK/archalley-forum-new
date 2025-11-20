"use client"

import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FACEBOOK_APP_ID } from "@/lib/constants"

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
      script.src = `https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v24.0&appId=${FACEBOOK_APP_ID}`
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
      <CardHeader className="pb-3 px-0 pt-4">
        <div className="flex items-center">
          <CardTitle className="flex items-center space-x-2 text-lg font-semibold mr-3">
            <span className="text-gray-900 dark:text-gray-100 whitespace-nowrap">Follow us on Facebook</span>
          </CardTitle>
          <div className="flex-1 border-b-[5px] border-black"></div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-4">
        {/* Live Facebook Page Plugin - Centered on Tablet */}
        <div className="w-full flex justify-center md:justify-center lg:justify-start">
          <div 
            className="fb-page" 
            data-href="https://www.facebook.com/archalley/"
            data-tabs="timeline"
            data-width="500"
            data-height="500"
            data-small-header="false"
            data-adapt-container-width="true"
            data-hide-cover="false"
            data-show-facepile="true"
          >
            <blockquote cite="https://www.facebook.com/archalley/" className="fb-xfbml-parse-ignore">
              <a href="https://www.facebook.com/archalley/">Archalley</a>
            </blockquote>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}