"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Facebook, ExternalLink, ThumbsUp, MessageCircle } from "lucide-react"
import Link from 'next/link'

interface SidebarFacebookProps {
  className?: string
}

export default function SidebarFacebook({ className }: SidebarFacebookProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          Latest Updates
          <Badge variant="secondary" className="ml-auto text-xs">
            Facebook
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Facebook Page Like Plugin Alternative */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
              <Facebook className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">Archalley Official</h4>
              <p className="text-xs text-muted-foreground">Architecture Community</p>
            </div>
          </div>
          
          {/* Sample Post */}
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-xs text-muted-foreground">2 hours ago</p>
            <p className="text-sm">
              🏗️ New architectural project showcase: Modern sustainable design meets traditional craftsmanship. 
              What do you think about this innovative approach?
            </p>
            
            {/* Post Stats */}
            <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                <span>24</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>8 comments</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Facebook Page Link */}
        <div className="space-y-2">
          <Link href="https://facebook.com/archalley" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-3 w-3 mr-2" />
              Follow Our Facebook Page
            </Button>
          </Link>
          <Link href="https://facebook.com/archalley" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
              <Facebook className="h-3 w-3 mr-2" />
              Like Our Page
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}