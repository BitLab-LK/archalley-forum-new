"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle } from "lucide-react"

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect if not loading and either not authenticated or not admin/moderator
    if (!isLoading && (!isAuthenticated || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(user?.role || ''))) {
      console.warn("🚫 Unauthorized admin access attempt:", {
        isAuthenticated,
        userRole: user?.role,
        userEmail: user?.email
      })
      router.replace("/")
    }
  }, [isLoading, isAuthenticated, user, router])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized message if not authenticated
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                You must be logged in to access this area.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Please log in with your account and try again.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  // Show access denied if not admin, super admin, or moderator
  if (!['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(user?.role || '')) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access the admin panel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                This area is restricted to administrators only.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  // Render protected content for admin users
  return <>{children}</>
}