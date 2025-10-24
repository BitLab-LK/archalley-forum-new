"use client"

import { useEffect } from "react"
import { signOut } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        // Clear manual session data
        await fetch('/api/auth/manual-logout', {
          method: 'POST',
          credentials: 'include',
        })

        // Clear NextAuth session
        await signOut({ 
          callbackUrl: "/",
          redirect: false 
        })

        // Clear browser storage
        localStorage.clear()
        sessionStorage.clear()

        // Force redirect after a short delay
        setTimeout(() => {
          window.location.href = "/"
        }, 1000)
      } catch (error) {
        console.error("Logout process error:", error)
        // Force redirect even if there's an error
        window.location.href = "/"
      }
    }

    performLogout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold mb-2">Logging you out...</h2>
            <p className="text-gray-600">Please wait while we securely log you out.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
