"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Youtube, Facebook, ExternalLink, Play } from "lucide-react"
import { SOCIAL_MEDIA, FACEBOOK_APP_ID } from "@/lib/constants"

declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

export default function SocialMediaSection() {
  const [fbLoaded, setFbLoaded] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const fbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load Facebook SDK
    loadFacebookSDK()
    
    // Set video as loaded for YouTube embed
    setVideoLoaded(true)
  }, [])

  const loadFacebookSDK = () => {
    // Check if SDK is already loaded
    if (window.FB) {
      setFbLoaded(true)
      return
    }

    // Initialize Facebook SDK
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        xfbml: true,
        version: 'v18.0'
      })
      setFbLoaded(true)
    }

    // Load SDK script
    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    document.head.appendChild(script)
  }

  const reloadFacebookPlugin = () => {
    if (window.FB && fbRef.current) {
      window.FB.XFBML.parse(fbRef.current)
    }
  }

  return (
    <section className="py-8 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Connect With Us
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay updated with our latest videos, projects, and community discussions on social media.
          </p>
        </div>

        {/* Social Media Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* YouTube Section */}
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Youtube className="h-6 w-6 text-red-500 mr-2" />
                  Latest Video
                </CardTitle>
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  YouTube
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* YouTube Embed */}
              <div className="relative aspect-video bg-gray-100">
                {videoLoaded ? (
                  <iframe
                    src={SOCIAL_MEDIA.youtube.embedUrl}
                    title="Latest Archalley Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Loading video...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* YouTube Channel Link */}
              <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50">
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                >
                  <a 
                    href={SOCIAL_MEDIA.youtube.channelUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Visit Our YouTube Channel
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Facebook Section */}
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Facebook className="h-6 w-6 text-blue-600 mr-2" />
                  Facebook Updates
                </CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Facebook
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Facebook Page Plugin */}
              <div ref={fbRef} className="min-h-[400px]">
                {fbLoaded ? (
                  <div
                    className="fb-page"
                    data-href={SOCIAL_MEDIA.facebook}
                    data-tabs="timeline"
                    data-width="400"
                    data-height="400"
                    data-small-header="false"
                    data-adapt-container-width="true"
                    data-hide-cover="false"
                    data-show-facepile="true"
                  >
                    <blockquote cite={SOCIAL_MEDIA.facebook} className="fb-xfbml-parse-ignore">
                      <a href={SOCIAL_MEDIA.facebook}>Archalley</a>
                    </blockquote>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
                    <div>
                      <Facebook className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                      <p className="text-gray-600 mb-4">Loading Facebook feed...</p>
                      <Button 
                        onClick={reloadFacebookPlugin}
                        variant="outline" 
                        size="sm"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        Retry Loading
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Facebook Page Link */}
              <div className="mt-4 pt-4 border-t">
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <a 
                    href={SOCIAL_MEDIA.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Visit Our Facebook Page
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Social Media Links */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold mb-4">Follow Us On</h3>
          <div className="flex justify-center space-x-4 flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={SOCIAL_MEDIA.youtube.channelUrl} target="_blank" rel="noopener noreferrer">
                <Youtube className="h-4 w-4 mr-2" />
                YouTube
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={SOCIAL_MEDIA.facebook} target="_blank" rel="noopener noreferrer">
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={SOCIAL_MEDIA.instagram} target="_blank" rel="noopener noreferrer">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={SOCIAL_MEDIA.linkedin} target="_blank" rel="noopener noreferrer">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}