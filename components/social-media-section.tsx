"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Youtube, Facebook, ExternalLink, Play } from "lucide-react"
import { SOCIAL_MEDIA, FACEBOOK_APP_ID } from "@/lib/constants"
import { HorizontalAd } from "@/components/ad-banner"


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
    
    // Add a fallback timer for Facebook loading
    const fbTimer = setTimeout(() => {
      if (!fbLoaded) {
        console.log('Facebook SDK loading timeout, attempting reload...')
        loadFacebookSDK()
      }
    }, 5000)

    return () => clearTimeout(fbTimer)
  }, [])

  const loadFacebookSDK = () => {
    // Check if Facebook App ID is configured
    if (!FACEBOOK_APP_ID || FACEBOOK_APP_ID === 'your_facebook_app_id') {
      console.warn('Facebook App ID not configured. Please add your real Facebook App ID to enable Facebook integration.')
      setFbLoaded(false)
      return
    }

    // Check if SDK is already loaded
    if (window.FB) {
      setFbLoaded(true)
      if (fbRef.current) {
        setTimeout(() => {
          window.FB.XFBML.parse(fbRef.current)
        }, 100)
      }
      return
    }

    // Remove existing script if any
    const existingScript = document.querySelector('script[src*="connect.facebook.net"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Initialize Facebook SDK
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        xfbml: true,
        version: 'v18.0'
      })
      setFbLoaded(true)
      
      // Parse existing elements
      if (fbRef.current) {
        setTimeout(() => {
          window.FB.XFBML.parse(fbRef.current)
        }, 100)
      }
    }

    // Load SDK script
    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.onload = () => {
      // Facebook SDK loaded successfully
    }
    script.onerror = () => {
      console.error('Failed to load Facebook SDK')
      setFbLoaded(false)
    }
    document.head.appendChild(script)
  }

  const reloadFacebookPlugin = () => {
    setFbLoaded(false)
    setTimeout(() => {
      loadFacebookSDK()
    }, 100)
  }

  return (
    <section className="py-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Connect With Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay updated with our latest videos, projects, and community discussions on social media.
          </p>
        </div>

        {/* Social Media Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 social-media-grid">
          {/* YouTube Section */}
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Youtube className="h-5 w-5 text-red-500 mr-2" />
                  Latest Video
                </CardTitle>
                <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                  YouTube
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {/* YouTube Embed */}
              <div className="relative aspect-video bg-gray-100 flex-1">
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
              <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 mt-auto">
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="w-full border-red-200 text-red-700 hover:bg-red-50 text-xs"
                >
                  <a 
                    href={SOCIAL_MEDIA.youtube.channelUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Visit Our YouTube Channel
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Facebook Section */}
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Facebook className="h-5 w-5 text-blue-600 mr-2" />
                  Facebook Updates
                </CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                  Facebook
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {/* Facebook Page Plugin */}
              <div ref={fbRef} className="min-h-[350px] flex-1 p-3" style={{ minHeight: '350px' }}>
                {fbLoaded ? (
                  <div
                    className="fb-page w-full h-full"
                    data-href={SOCIAL_MEDIA.facebook}
                    data-tabs="timeline"
                    data-width="100%"
                    data-height="350"
                    data-small-header="true"
                    data-adapt-container-width="true"
                    data-hide-cover="false"
                    data-show-facepile="true"
                    style={{ width: '100%', height: '100%' }}
                  >
                    <blockquote cite={SOCIAL_MEDIA.facebook} className="fb-xfbml-parse-ignore">
                      <a href={SOCIAL_MEDIA.facebook}>Archalley</a>
                    </blockquote>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 text-center h-full flex items-center justify-center">
                    <div>
                      <Facebook className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                      {(!FACEBOOK_APP_ID || FACEBOOK_APP_ID === 'your_facebook_app_id') ? (
                        <>
                          <p className="text-gray-600 mb-3 text-sm">Facebook integration not configured</p>
                          <p className="text-gray-500 text-xs mb-3">Administrator needs to add Facebook App ID</p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-600 mb-3 text-sm">Loading Facebook feed...</p>
                          <Button 
                            onClick={reloadFacebookPlugin}
                            variant="outline" 
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                          >
                            Retry Loading
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Facebook Page Link */}
              <div className="mt-auto p-3 pt-0 border-t">
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                >
                  <a 
                    href={SOCIAL_MEDIA.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Visit Our Facebook Page
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Social Media Links */}
        <div className="mt-6 text-center">
          <h3 className="text-md font-semibold mb-3">Follow Us On</h3>
          <div className="flex justify-center space-x-3 flex-wrap gap-2">
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
            <Button asChild variant="outline" size="sm">
              <a href={SOCIAL_MEDIA.twitter} target="_blank" rel="noopener noreferrer">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={SOCIAL_MEDIA.tiktok} target="_blank" rel="noopener noreferrer">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                TikTok
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={SOCIAL_MEDIA.pinterest} target="_blank" rel="noopener noreferrer">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.404-5.955 1.404-5.955s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z."/>
                </svg>
                Pinterest
              </a>
            </Button>
          </div>
        </div>

        {/* Advertisement after social media */}
        <div className="mt-8">
          <HorizontalAd className="mx-auto animate-fade-in" />
        </div>
      </div>
      
      {/* Custom CSS for Facebook widget full width */}
      <style jsx global>{`
        .fb-page, 
        .fb-page span, 
        .fb-page span iframe[style] {
          width: 100% !important;
          max-width: 100% !important;
        }
        
        .fb-page iframe {
          width: 100% !important;
          max-width: 100% !important;
        }
        
        /* Ensure both cards have equal height */
        @media (min-width: 1024px) {
          .social-media-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: stretch;
          }
        }
      `}</style>
    </section>
  )
}