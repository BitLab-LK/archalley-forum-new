"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SignInRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams?.toString())
    const target = new URL("/auth/register", window.location.origin)
    target.searchParams.set("tab", "login")

    // Preserve callbackUrl and any other existing params
    currentParams.forEach((value, key) => {
      if (key !== "tab") {
        target.searchParams.set(key, value)
      }
    })

    router.replace(target.pathname + "?" + target.searchParams.toString())
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center animate-fade-in">
      <div className="text-center animate-scale-in animate-delay-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground animate-fade-in-up animate-delay-200">Redirecting to login...</p>
      </div>
    </div>
  )
}

