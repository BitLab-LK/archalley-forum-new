"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"

interface AuthContextType {
  user: any
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(status === "loading")
  }, [status])

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user: session?.user || null,
    isLoading,
    isAuthenticated: !!session?.user && status === "authenticated",
  }), [session?.user, isLoading, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
