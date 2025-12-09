"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface BriefDownloadPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BriefDownloadPopup({ open, onOpenChange }: BriefDownloadPopupProps) {
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [agreedToPrivacyPolicy, setAgreedToPrivacyPolicy] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (user?.email && open) {
      setEmail(user.email)
    } else if (!open) {
      // Reset form when dialog closes
      setEmail("")
      setAgreedToPrivacyPolicy(false)
      setIsSubmitting(false)
    }
  }, [user?.email, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    if (!agreedToPrivacyPolicy) {
      toast.error("Please agree to the Privacy Policy")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/brief-download/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          agreedToPrivacyPolicy,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to request download link")
      }

      toast.success("Download link sent to your email!")
      onOpenChange(false)
    } catch (error) {
      console.error("Error requesting download link:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send download link. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Competition Brief</DialogTitle>
          <DialogDescription>
            Please enter your email address to receive download link
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full"
            />
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacy"
              checked={agreedToPrivacyPolicy}
              onCheckedChange={(checked) => setAgreedToPrivacyPolicy(checked === true)}
              disabled={isSubmitting}
            />
            <Label
              htmlFor="privacy"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the website&apos;s{" "}
              <Link 
                href="/privacy-policy" 
                target="_blank"
                className="text-blue-500 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
              .
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !email || !agreedToPrivacyPolicy}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isSubmitting ? "Sending..." : "Get a Link"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

