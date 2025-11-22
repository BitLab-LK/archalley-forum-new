"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface FormData {
  name: string
  email: string
  contactNumber: string
  firmInstitute: string
  websiteUrl: string
  message: string
  agreeToTerms: boolean
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    contactNumber: "",
    firmInstitute: "",
    websiteUrl: "",
    message: "",
    agreeToTerms: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateUrl = (url: string) => {
    if (!url) return true // Optional field
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast.error("Please enter your name")
        setIsSubmitting(false)
        return
      }

      if (!formData.email.trim()) {
        toast.error("Please enter your email address")
        setIsSubmitting(false)
        return
      }

      if (!validateEmail(formData.email)) {
        toast.error("Please enter a valid email address")
        setIsSubmitting(false)
        return
      }

      if (!formData.message.trim()) {
        toast.error("Please enter your message")
        setIsSubmitting(false)
        return
      }

      if (formData.websiteUrl && formData.websiteUrl.trim()) {
        const urlToValidate = formData.websiteUrl.trim().startsWith("http") 
          ? formData.websiteUrl.trim() 
          : `https://${formData.websiteUrl.trim()}`
        if (!validateUrl(urlToValidate)) {
          toast.error("Please enter a valid website URL")
          setIsSubmitting(false)
          return
        }
      }

      if (!formData.agreeToTerms) {
        toast.error("Please agree to the Terms & Conditions and Privacy Policy")
        setIsSubmitting(false)
        return
      }

      // Prepare form data for submission
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        contactNumber: formData.contactNumber.trim() || undefined,
        firmInstitute: formData.firmInstitute.trim() || undefined,
        websiteUrl: formData.websiteUrl.trim()
          ? (formData.websiteUrl.trim().startsWith("http") 
              ? formData.websiteUrl.trim() 
              : `https://${formData.websiteUrl.trim()}`)
          : undefined,
        message: formData.message.trim(),
        agreeToTerms: formData.agreeToTerms,
      }

      // Submit form data
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed validation errors if available
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((err: any) => `${err.path?.join('.') || 'field'}: ${err.message}`).join(', ')
          throw new Error(errorMessages || data.error || "Failed to submit contact form")
        }
        throw new Error(data.error || data.message || "Failed to submit contact form")
      }

      toast.success("Thank you for your message! We'll get back to you soon.")

      // Reset form
      setFormData({
        name: "",
        email: "",
        contactNumber: "",
        firmInstitute: "",
        websiteUrl: "",
        message: "",
        agreeToTerms: false,
      })
    } catch (error) {
      console.error("Error submitting contact form:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit contact form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Send us a Message
        </CardTitle>
        <CardDescription>
          Fill out the form below and we'll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Contact Number */}
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.contactNumber}
              onChange={(e) => handleInputChange("contactNumber", e.target.value)}
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Firm / Institute */}
          <div className="space-y-2">
            <Label htmlFor="firmInstitute">Firm / Institute</Label>
            <Input
              id="firmInstitute"
              type="text"
              placeholder="Your firm or institute name"
              value={formData.firmInstitute}
              onChange={(e) => handleInputChange("firmInstitute", e.target.value)}
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Website / URL */}
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website / URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://example.com"
              value={formData.websiteUrl}
              onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Your message here..."
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full min-h-[120px]"
              rows={6}
            />
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked === true)}
              disabled={isSubmitting}
              className="mt-1"
            />
            <Label
              htmlFor="agreeToTerms"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I agree to the{" "}
              <Link
                href="/terms-conditions"
                className="text-primary hover:underline"
                target="_blank"
              >
                Terms & Conditions
              </Link>{" "}
              and the{" "}
              <Link
                href="/terms-conditions"
                className="text-primary hover:underline"
                target="_blank"
              >
                Privacy Policy
              </Link>
              .
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
