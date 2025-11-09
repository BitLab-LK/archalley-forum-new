"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react"

const SESSION_STORAGE_KEY = 'archalley-last-url'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string>("")
  const [verificationCode, setVerificationCode] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [mode, setMode] = useState<"link" | "code">("link")

  useEffect(() => {
    // Check if token is in URL (from email link)
    const urlToken = searchParams.get('token')
    const verified = searchParams.get('verified')
    const error = searchParams.get('error')
    
    if (error) {
      setError(decodeURIComponent(error))
      setMode("code")
      return
    }
    
    if (urlToken) {
      setToken(urlToken)
      setMode("link")
      
      // If already verified (from GET redirect with cookies set), just show success and redirect
      if (verified === 'true') {
        setSuccess(true)
        setIsLoading(false)
        const lastUrl = sessionStorage.getItem(SESSION_STORAGE_KEY) || '/'
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
        setTimeout(() => {
          window.location.href = lastUrl
        }, 1500)
        return
      }
      
      // Token is in URL but not yet verified - the GET endpoint should have verified it
      // If we're here, the verification might have failed or the page was refreshed
      // Show the verification UI and let user manually verify with code
      setIsLoading(false)
    }
  }, [searchParams])

  const handleVerification = async (verifyToken?: string) => {
    const tokenToVerify = verifyToken || token
    if (!tokenToVerify && !verificationCode) {
      setError("Please enter a verification code or use the email link")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Get last URL from sessionStorage
      const lastUrl = sessionStorage.getItem(SESSION_STORAGE_KEY) || '/'
      
      // Use token from URL or verification code
      const verifyTokenValue = tokenToVerify || verificationCode

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: verifyTokenValue,
          callbackUrl: lastUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      setSuccess(true)

      // Clear sessionStorage
      sessionStorage.removeItem(SESSION_STORAGE_KEY)

      // Redirect to last URL after a short delay
      setTimeout(() => {
        window.location.href = data.redirectTo || lastUrl || '/'
      }, 1500)
    } catch (error: any) {
      setError(error.message || "An error occurred during verification")
      setIsLoading(false)
    }
  }

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleVerification()
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Email Verified!</h2>
              <p className="text-muted-foreground">
                Your email has been successfully verified. Redirecting you now...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            {mode === "link" 
              ? "Verifying your email address..."
              : "Enter the verification code sent to your email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && mode === "link" && (
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Verifying your email address...
              </p>
            </div>
          )}

          {mode === "code" && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  disabled={isLoading}
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your email
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </form>
          )}

          {!isLoading && mode === "link" && !token && (
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  No verification token found. Please check your email for the verification link,
                  or enter the verification code below.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setMode("code")}
              >
                Enter Verification Code Instead
              </Button>
            </div>
          )}

          {mode === "code" && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode("link")
                setVerificationCode("")
              }}
            >
              Use Email Link Instead
            </Button>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Didn't receive the email? Check your spam folder or{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => router.push('/auth/register?tab=login')}
              >
                try logging in again
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

