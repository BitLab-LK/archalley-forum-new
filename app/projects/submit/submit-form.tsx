"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X, Download, FileText, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface FormData {
  name: string
  email: string
  contactNumber: string
  firmInstitute: string
  websiteUrl: string
  message: string
  agreeToTerms: boolean
}

export default function SubmitProjectForm() {
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
  const [isSuccess, setIsSuccess] = useState(false)
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [relatedFiles, setRelatedFiles] = useState<File[]>([])
  const [dragActiveTemplate, setDragActiveTemplate] = useState(false)
  const [dragActiveRelated, setDragActiveRelated] = useState(false)

  const templateInputRef = useRef<HTMLInputElement>(null)
  const relatedInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
  const MAX_RELATED_FILES = 20

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateFile = (file: File, maxSize: number = MAX_FILE_SIZE): boolean => {
    if (file.size > maxSize) {
      toast.error(`File ${file.name} exceeds ${maxSize / (1024 * 1024)}MB limit`)
      return false
    }
    return true
  }

  const handleTemplateFile = (file: File) => {
    if (!validateFile(file)) return
    if (file.name.endsWith('.docx')) {
      setTemplateFile(file)
    } else {
      toast.error("Template file must be a .docx file")
    }
  }

  const handleRelatedFiles = (files: File[]) => {
    const validFiles: File[] = []
    
    if (relatedFiles.length + files.length > MAX_RELATED_FILES) {
      toast.error(`Maximum ${MAX_RELATED_FILES} files allowed`)
      return
    }

    files.forEach(file => {
      if (validateFile(file)) {
        validFiles.push(file)
      }
    })

    setRelatedFiles(prev => [...prev, ...validFiles])
  }

  const removeRelatedFile = (index: number) => {
    setRelatedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Drag and drop handlers for template file
  const handleDragTemplate = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveTemplate(true)
    } else if (e.type === "dragleave") {
      setDragActiveTemplate(false)
    }
  }, [])

  const handleDropTemplate = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveTemplate(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleTemplateFile(e.dataTransfer.files[0])
    }
  }, [])

  // Drag and drop handlers for related files
  const handleDragRelated = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveRelated(true)
    } else if (e.type === "dragleave") {
      setDragActiveRelated(false)
    }
  }, [])

  const handleDropRelated = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveRelated(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleRelatedFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.email) {
        toast.error("Please fill in all required fields")
        setIsSubmitting(false)
        return
      }

      if (!formData.agreeToTerms) {
        toast.error("Please agree to the Terms & Conditions and Privacy Policy")
        setIsSubmitting(false)
        return
      }

      const body = new FormData()
      body.append("name", formData.name)
      body.append("email", formData.email)
      body.append("contactNumber", formData.contactNumber || "")
      body.append("firmInstitute", formData.firmInstitute || "")
      body.append("websiteUrl", formData.websiteUrl || "")
      body.append("message", formData.message || "")
      body.append("agreeToTerms", formData.agreeToTerms ? "true" : "false")
      
      // Append files
      if (templateFile) {
        body.append("templateFile", templateFile)
      }
      relatedFiles.forEach((file) => {
        body.append("relatedFiles", file)
      })

      const res = await fetch("/api/projects/submit", {
        method: "POST",
        body,
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Submission failed" }))
        throw new Error(error || "Submission failed")
      }

      toast.success("Your project submission has been sent successfully! We'll review it and get back to you soon.")
      
      // Show success message
      setIsSuccess(true)
      
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
      setTemplateFile(null)
      setRelatedFiles([])
      if (templateInputRef.current) templateInputRef.current.value = ""
      if (relatedInputRef.current) relatedInputRef.current.value = ""
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      toast.error("Failed to submit. Please try again.")
      console.error("Submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {isSuccess && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Submission Successful!
              </h3>
              <p className="text-green-800">
                Your project submission has been sent successfully! We'll review it and get back to you soon. Thank you for your contribution.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSuccess(false)}
              className="text-green-700 hover:text-green-900"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-orange-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-orange-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="your.email@example.com"
            required
          />
        </div>

        {/* Contact Number */}
        <div className="space-y-2">
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input
            id="contactNumber"
            type="tel"
            value={formData.contactNumber}
            onChange={(e) => handleInputChange("contactNumber", e.target.value)}
            placeholder="+94 71 234 5678"
          />
        </div>

        {/* Firm / Institute */}
        <div className="space-y-2">
          <Label htmlFor="firmInstitute">Firm / Institute</Label>
          <Input
            id="firmInstitute"
            value={formData.firmInstitute}
            onChange={(e) => handleInputChange("firmInstitute", e.target.value)}
            placeholder="Firm or Institute Name"
          />
        </div>

        {/* Website / URL */}
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website / URL</Label>
          <Input
            id="websiteUrl"
            type="url"
            value={formData.websiteUrl}
            onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange("message", e.target.value)}
            placeholder="Tell us about your project..."
            rows={4}
          />
        </div>

        {/* Template File Download and Upload */}
        <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Upload Completed Template File (*.docx)</Label>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/downloads/ARCHALLEY-PROJECTS-FORM.docx"
              download
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Link>
          </div>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              dragActiveTemplate
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            )}
            onDragEnter={handleDragTemplate}
            onDragLeave={handleDragTemplate}
            onDragOver={handleDragTemplate}
            onDrop={handleDropTemplate}
            onClick={() => templateInputRef.current?.click()}
          >
            <input
              ref={templateInputRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleTemplateFile(e.target.files[0])
                }
              }}
            />
            <FileText className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-600 mb-1">
              {templateFile ? templateFile.name : "Click or drag a file to this area to upload."}
            </p>
            <p className="text-xs text-gray-500">Only .docx files accepted</p>
          </div>
          {templateFile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setTemplateFile(null)
                if (templateInputRef.current) templateInputRef.current.value = ""
              }}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Remove file
            </Button>
          )}
        </div>
      </div>

        {/* Related Files Upload */}
        <div className="space-y-2">
          <Label>Upload project related images / files</Label>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              dragActiveRelated
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            )}
            onDragEnter={handleDragRelated}
            onDragLeave={handleDragRelated}
            onDragOver={handleDragRelated}
            onDrop={handleDropRelated}
            onClick={() => relatedInputRef.current?.click()}
          >
            <input
              ref={relatedInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleRelatedFiles(Array.from(e.target.files))
                }
              }}
            />
            <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-600 mb-1">
              Click or drag files to this area to upload.
            </p>
            <p className="text-xs text-gray-500">
              You can upload up to {MAX_RELATED_FILES} files.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              You can upload a maximum of {MAX_RELATED_FILES} files, with each file not exceeding {MAX_FILE_SIZE / (1024 * 1024)}MB in size.
            </p>
          </div>
          
          {relatedFiles.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium">Uploaded Files ({relatedFiles.length}/{MAX_RELATED_FILES}):</p>
              <div className="space-y-1">
                {relatedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRelatedFile(index)}
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Agreement */}
        <div className="flex items-start space-x-2">
          <Checkbox
            id="agreeToTerms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
          />
          <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed cursor-pointer">
            I agree to the Terms & Conditions and the Privacy Policy
          </Label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
    </form>
    </div>
  )
}

