"use client"

import { useEffect, useState, useCallback, useRef } from "react"

interface UseInfiniteScrollProps<T> {
  fetchFunction: (page: number) => Promise<{
    data: T[]
    hasMore: boolean
    total: number
  }>
  initialPage?: number
  threshold?: number // Distance from bottom to trigger load (in pixels)
}

interface UseInfiniteScrollReturn<T> {
  data: T[]
  loading: boolean
  hasMore: boolean
  error: string | null
  loadMore: () => void
  refresh: () => void
  total: number
  sentinelRef: React.RefObject<HTMLDivElement>
}

export function useInfiniteScroll<T>({
  fetchFunction,
  initialPage = 1,
  threshold = 100
}: UseInfiniteScrollProps<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(initialPage)
  const [total, setTotal] = useState(0)
  
  const loadingRef = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return
    
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const result = await Promise.race([
        fetchFunction(page),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        )
      ])

      clearTimeout(timeoutId)
      
      if (page === 1) {
        // Initial load or refresh
        setData(result.data)
      } else {
        // Append new data
        setData(prevData => [...prevData, ...result.data])
      }
      
      setHasMore(result.hasMore)
      setTotal(result.total)
      setPage(prevPage => prevPage + 1)
    } catch (err) {
      console.error('Load more error:', err)
      
      // Handle different types of errors
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('Request timeout')) {
          setError('Loading is taking longer than expected. Please check your connection and try again.')
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('Network error. Please check your connection and try again.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to load data. Please try again.')
      }
      
      // Don't increment page on error
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [fetchFunction, page, hasMore])

  const refresh = useCallback(() => {
    setData([])
    setPage(1)
    setHasMore(true)
    setError(null)
    loadingRef.current = false
  }, [])

  // Initial load
  useEffect(() => {
    loadMore()
  }, []) // Only run on mount

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: `${threshold}px`
      }
    )

    observerRef.current.observe(sentinelRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, loadMore, threshold])

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
    total,
    sentinelRef
  }
}
