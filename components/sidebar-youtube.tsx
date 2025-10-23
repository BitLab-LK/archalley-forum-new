"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'

interface SidebarYouTubeProps {
  className?: string
}

export default function SidebarYouTube({ className }: SidebarYouTubeProps) {
  return (
    <Card className={`${className} border-0 shadow-sm bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm`}>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-base text-gray-900 dark:text-gray-100">
          YouTube
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Video Thumbnail/Embed */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/D0A-MIeq9gw"
            title="Latest YouTube Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0"
            loading="lazy"
          />
        </div>
        
        {/* Minimal Channel Link */}
        <Link href="https://www.youtube.com/@archalleytube" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800">
            View Channel →
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}