"use client"

import type React from "react"
import { useEffect } from "react"

export default function CompetitionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Hide only the advertisement banner (Jaquar ad), keep the footer
    const hideAd = () => {
      // Target the ad banner container specifically
      const adContainers = document.querySelectorAll('.container.mx-auto.px-4.py-8')
      adContainers.forEach((container) => {
        const link = container.querySelector('a[href*="jaquar"]')
        if (link) {
          (container as HTMLElement).style.display = 'none'
        }
      })
    }

    hideAd()
    // Run again after a short delay to catch any dynamically loaded content
    const timer = setTimeout(hideAd, 100)

    return () => clearTimeout(timer)
  }, [])

  return <>{children}</>
}
