"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/auth/register?tab=login")
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center animate-fade-in">
      <div className="text-center animate-scale-in animate-delay-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground animate-fade-in-up animate-delay-200">Redirecting to login...</p>
      </div>
    </div>
  )
}