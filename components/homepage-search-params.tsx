"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

interface SearchParamsHandlerProps {
  onPageChange: (page: number) => void
  onHighlight: (postId: string | null) => void
}

export default function SearchParamsHandler({ onPageChange, onHighlight }: SearchParamsHandlerProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1")
    const highlight = searchParams.get("highlight")
    
    if (highlight) {
      onHighlight(highlight)
      // Clear highlight after 3 seconds
      setTimeout(() => onHighlight(null), 3000)
    }
    
    // Only handle page change if it's not the first page (since we have SSR data for page 1)
    if (page !== 1) {
      onPageChange(page)
    }
  }, [searchParams, onPageChange, onHighlight])

  return null // This component doesn't render anything
}