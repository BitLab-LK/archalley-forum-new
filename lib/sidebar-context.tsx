"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface SidebarContextType {
  refreshCategories: () => void
  refreshTrendingPosts: () => void
  refreshAll: () => void
  categoriesKey: number
  trendingKey: number
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [categoriesKey, setCategoriesKey] = useState(0)
  const [trendingKey, setTrendingKey] = useState(0)

  // Debounce refresh to prevent multiple rapid calls
  const refreshCategories = useCallback(() => {
    console.log('🔄 Refreshing categories...')
    setCategoriesKey(prev => prev + 1)
  }, [])

  const refreshTrendingPosts = useCallback(() => {
    console.log('🔄 Refreshing trending posts...')
    setTrendingKey(prev => prev + 1)
  }, [])

  const refreshAll = useCallback(() => {
    console.log('🔄 Refreshing all sidebar data...')
    setCategoriesKey(prev => prev + 1)
    setTrendingKey(prev => prev + 1)
  }, [])

  const value = {
    refreshCategories,
    refreshTrendingPosts,
    refreshAll,
    categoriesKey,
    trendingKey
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
