"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load PostCreator with skeleton
const PostCreator = dynamic(() => import('./post-creator'), {
  loading: () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    </div>
  ),
  ssr: false // Don't render on server for faster initial load
})

interface PostCreatorProps {
  onPostCreated?: (result?: { success?: boolean; post?: any; error?: string }) => void
}

export default function LazyPostCreator({ onPostCreated }: PostCreatorProps) {
  return (
    <Suspense fallback={
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </div>
    }>
      <PostCreator onPostCreated={onPostCreated || (() => {})} />
    </Suspense>
  )
}