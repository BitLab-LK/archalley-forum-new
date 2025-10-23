"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Youtube, ExternalLink } from "lucide-react"
import Link from 'next/link'

interface SidebarYouTubeProps {
  className?: string
}

export default function SidebarYouTube({ className }: SidebarYouTubeProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          Latest Video
          <Badge variant="secondary" className="ml-auto text-xs">
            YouTube
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Thumbnail/Embed */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Welcome to Archalley"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0"
          />
        </div>
        
        {/* Video Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm line-clamp-2">
            Welcome to Archalley - Architecture & Design Community
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            Discover innovative architectural designs and join our growing community of professionals.
          </p>
        </div>
        
        {/* YouTube Channel Link */}
        <Link href="https://youtube.com/@archalley" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="h-3 w-3 mr-2" />
            Visit Our YouTube Channel
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}