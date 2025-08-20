"use client"

import React from "react"
import { ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface SocialMediaLinksProps {
  user: {
    linkedinUrl?: string
    facebookUrl?: string
    instagramUrl?: string
    twitterUrl?: string
    githubUrl?: string
    youtubeUrl?: string
    tiktokUrl?: string
    behanceUrl?: string
    dribbbleUrl?: string
    otherSocialUrl?: string
  }
}

const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({ user }) => {
  const hasSocialLinks = user.linkedinUrl || user.facebookUrl || user.instagramUrl || 
    user.twitterUrl || user.githubUrl || user.youtubeUrl || user.tiktokUrl || 
    user.behanceUrl || user.dribbbleUrl || user.otherSocialUrl

  if (!hasSocialLinks) return null

  return (
    <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-8">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-white" />
            </div>
            Professional Networks & Platforms
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect across professional and social platforms</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {user.linkedinUrl && (
            <a 
              href={user.linkedinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300"
            >
              <div className="w-11 h-11 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">LinkedIn</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Professional Network</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </a>
          )}
          
          {user.githubUrl && (
            <a 
              href={user.githubUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300"
            >
              <div className="w-11 h-11 bg-gray-900 dark:bg-gray-100 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">GitHub</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Code Repository</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </a>
          )}

          {/* Add other social media platforms here... */}
        </div>
      </CardContent>
    </Card>
  )
}

export default React.memo(SocialMediaLinks)
