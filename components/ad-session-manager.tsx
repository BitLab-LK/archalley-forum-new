"use client"

import { useAdSession } from '@/hooks/use-ad-session'

/**
 * Advertisement session manager component
 * Handles initialization and cleanup of ad session state
 */
export function AdSessionManager() {
  useAdSession()
  return null // This component doesn't render anything
}