"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'

interface SidebarYouTubeProps {
  className?: string
}

interface YouTubeVideo {
  videoId: string
  title: string
  channelUrl: string
}

export default function SidebarYouTube({ className }: SidebarYouTubeProps) {
  const [videoData, setVideoData] = useState<YouTubeVideo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLatestVideo = async () => {
      try {
        const response = await fetch('/api/youtube/latest')
        if (response.ok) {
          const data = await response.json()
          setVideoData(data)
        } else {
          // Fallback to default video
          setVideoData({
            videoId: 'D0A-MIeq9gw',
            title: 'Latest Video from ArchAlley',
            channelUrl: 'https://www.youtube.com/@archalleytube',
          })
        }
      } catch (error) {
        console.error('Error fetching YouTube video:', error)
        // Fallback to default video
        setVideoData({
          videoId: 'D0A-MIeq9gw',
          title: 'Latest Video from ArchAlley',
          channelUrl: 'https://www.youtube.com/@archalleytube',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLatestVideo()
  }, [])

  const videoId = videoData?.videoId || 'D0A-MIeq9gw'
  const channelUrl = videoData?.channelUrl || 'https://www.youtube.com/@archalleytube'

  return (
    <Card className={`${className} border-0 shadow-sm bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm`}>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center">
          <CardTitle className="text-base text-gray-900 dark:text-gray-100 mr-3 whitespace-nowrap">
            We're on YouTube
          </CardTitle>
          <div className="flex-1 border-b-[5px] border-black"></div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Video Thumbnail/Embed */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Latest YouTube Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
              loading="lazy"
            />
          )}
        </div>
        
        {/* Minimal Channel Link */}
        <Link href={channelUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800">
            View Channel →
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}