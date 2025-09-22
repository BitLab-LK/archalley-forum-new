"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load PostCreator with skeleton
const PostCreator = dynamic(() => import('./post-creator'), {
  loading: () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 mb-4 lg:mb-6">
      <div className="animate-pulse">
        <div className="h-4 lg:h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 lg:w-40 mb-3 lg:mb-4"></div>
        <div className="h-20 lg:h-24 bg-gray-200 dark:bg-gray-700 rounded mb-3 lg:mb-4"></div>
        <div className="flex items-center justify-between">
          <div className="h-8 lg:h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 lg:w-24"></div>
          <div className="h-8 lg:h-9 bg-gray-200 dark:bg-gray-700 rounded w-12 lg:w-16"></div>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 mb-4 lg:mb-6">
        <div className="animate-pulse">
          <div className="h-4 lg:h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 lg:w-40 mb-3 lg:mb-4"></div>
          <div className="h-20 lg:h-24 bg-gray-200 dark:bg-gray-700 rounded mb-3 lg:mb-4"></div>
          <div className="flex items-center justify-between">
            <div className="h-8 lg:h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 lg:w-24"></div>
            <div className="h-8 lg:h-9 bg-gray-200 dark:bg-gray-700 rounded w-12 lg:w-16"></div>
          </div>
        </div>
      </div>
    }>
      <PostCreator onPostCreated={onPostCreated || (() => {})} />
    </Suspense>
  )
}