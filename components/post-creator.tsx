"use client"

import React, { useState, useRef, FormEvent, ChangeEvent } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { DeploymentError, makeApiRequest, logDeploymentError } from "@/lib/deployment-error-handler"
import { X, Loader2, Cloud } from "lucide-react"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useVercelBlobUpload } from "@/hooks/use-vercel-blob-upload"

// Simple language detection function
function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return "English"
  
  // Remove punctuation and spaces for analysis
  const cleanText = text.replace(/[^\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF]/g, '')
  
  // Sinhala Unicode range: 0D80-0DFF
  if (/[\u0D80-\u0DFF]/.test(cleanText)) {
    return "Sinhala"
  }
  
  // Tamil Unicode range: 0B80-0BFF
  if (/[\u0B80-\u0BFF]/.test(cleanText)) {
    return "Tamil"
  }
  
  // Hindi/Devanagari Unicode range: 0900-097F
  if (/[\u0900-\u097F]/.test(cleanText)) {
    return "Hindi"
  }
  
  // Bengali Unicode range: 0980-09FF
  if (/[\u0980-\u09FF]/.test(cleanText)) {
    return "Bengali"
  }
  
  // Gujarati Unicode range: 0A80-0AFF
  if (/[\u0A80-\u0AFF]/.test(cleanText)) {
    return "Gujarati"
  }
  
  // Punjabi Unicode range: 0A00-0A7F
  if (/[\u0A00-\u0A7F]/.test(cleanText)) {
    return "Punjabi"
  }
  
  // Telugu Unicode range: 0C00-0C7F
  if (/[\u0C00-\u0C7F]/.test(cleanText)) {
    return "Telugu"
  }
  
  // Kannada Unicode range: 0C80-0CFF
  if (/[\u0C80-\u0CFF]/.test(cleanText)) {
    return "Kannada"
  }
  
  // Malayalam Unicode range: 0D00-0D7F
  if (/[\u0D00-\u0D7F]/.test(cleanText)) {
    return "Malayalam"
  }
  
  // Default to English if no specific script is detected
  return "English"
}

interface PostCreatorProps {
  onPostCreated: (result?: { success?: boolean; post?: any; error?: string }) => void
}

export default function PostCreator({ onPostCreated }: PostCreatorProps) {
  const { user, isAuthenticated } = useAuth()
  const [content, setContent] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setSuggestedTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [aiProgress, setAiProgress] = useState(0)
  const [aiStatus, setAiStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use Vercel Blob upload hook
  const {
    isUploading,
    uploadProgress,
    uploadedFiles,
    error: uploadError,
    uploadFiles,
    removeFile,
    clearAllFiles,
    resetUpload,
    hasFiles,
    canUploadMore,
    remainingSlots
  } = useVercelBlobUpload({
    maxFiles: 5,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    onProgress: () => {
      // Upload progress tracking
    },
    onSuccess: (files) => {
      toast.success(`Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''} to cloud storage`)
    },
    onError: (error) => {
      setError(error)
    }
  })

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    if (newContent !== content) {
      setContent(newContent)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!isAuthenticated) {
      setError("Please sign in to create a post")
      return
    }

    if (!content || !content.trim()) {
      setError("Please enter some content")
      return
    }

    setIsSubmitting(true)
    setAiProgress(0)
    setAiStatus("Creating post...")

    try {
      // OPTIMIZATION: Do robust AI classification on frontend for proper categorization
      setAiProgress(30)
      setAiStatus("Posting...")
      
      // Step 1: Get AI classification with proper timeout and fallback
      let classifiedCategory = 'informative' // Better fallback than 'other'
      let categoryId = ''
      let aiClassificationSuccess = false
      let suggestedCategories: string[] = [] // Declare here so it's available in the outer scope
      
      try {
        // Set a more reasonable timeout for AI classification (8 seconds)
        const classificationPromise = fetch("/api/ai/classify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: content.trim() }),
        })
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI classification timeout')), 8000)
        )
        
        const classificationResponse = await Promise.race([classificationPromise, timeoutPromise]) as Response
        
        if (classificationResponse.ok) {
          const classification = await classificationResponse.json()
          console.log("🤖 AI Classification Response:", classification)
          
          // Handle both single category and multiple categories response
          
          if (classification.categories && Array.isArray(classification.categories) && classification.categories.length > 0) {
            // New format with multiple categories
            suggestedCategories = classification.categories
            classifiedCategory = classification.categories[0] // Use first category as primary
            aiClassificationSuccess = true
            console.log("✅ AI classified with multiple categories:", classification.categories, "confidence:", classification.confidence)
          } else if (classification.category && classification.category !== 'unknown' && classification.category !== 'other') {
            // Old format with single category
            classifiedCategory = classification.category
            suggestedCategories = [classification.category]
            aiClassificationSuccess = true
            console.log("✅ AI classified as single category:", classifiedCategory, "confidence:", classification.confidence)
          } else {
            console.log("⚠️ AI returned no valid category, using content-based fallback")
          }
        } else {
          const errorText = await classificationResponse.text()
          console.warn("⚠️ AI classification failed with status:", classificationResponse.status, errorText)
        }
      } catch (error) {
        console.warn("⚠️ AI classification timeout or error, using content-based fallback:", error)
      }
      
      // Step 1.5: Content-based fallback classification if AI fails
      if (!aiClassificationSuccess) {
        const lowerContent = content.toLowerCase()
        const detectedCategories: string[] = []
        
        // Multi-category content analysis - can detect multiple categories
        if (lowerContent.includes('job') || lowerContent.includes('hiring') || lowerContent.includes('vacancy') || lowerContent.includes('opportunity') || lowerContent.includes('employment')) {
          detectedCategories.push('jobs')
        }
        if (lowerContent.includes('business') || lowerContent.includes('startup') || lowerContent.includes('entrepreneur') || lowerContent.includes('company') || lowerContent.includes('market') || lowerContent.includes('commercial')) {
          detectedCategories.push('business')
        }
        if (lowerContent.includes('design') || lowerContent.includes('ui') || lowerContent.includes('ux') || lowerContent.includes('graphic') || lowerContent.includes('creative') || lowerContent.includes('visual')) {
          detectedCategories.push('design')
        }
        if (lowerContent.includes('construction') || lowerContent.includes('building') || lowerContent.includes('architecture') || lowerContent.includes('engineer') || lowerContent.includes('project') || lowerContent.includes('infrastructure')) {
          detectedCategories.push('construction')
        }
        if (lowerContent.includes('academic') || lowerContent.includes('research') || lowerContent.includes('study') || lowerContent.includes('university') || lowerContent.includes('education') || lowerContent.includes('school')) {
          detectedCategories.push('academic')
        }
        if (lowerContent.includes('career') || lowerContent.includes('professional') || lowerContent.includes('skill') || lowerContent.includes('development') || lowerContent.includes('growth') || lowerContent.includes('advancement')) {
          detectedCategories.push('career')
        }
        
        // Assign detected categories or fallback to informative
        if (detectedCategories.length > 0) {
          suggestedCategories = detectedCategories
          classifiedCategory = detectedCategories[0] // Use first category as primary
          console.log("📝 Content-based classification found multiple categories:", detectedCategories)
        } else {
          // Fallback to informative for general content
          suggestedCategories = ['informative']
          classifiedCategory = 'informative'
          console.log("📝 Content-based classification fallback to informative")
        }
      }
      
      setAiProgress(50)
      setAiStatus("Posting...")
      
      // Step 2: Get categories and find the best match
      try {
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData.categories || [])
          
          if (categories && categories.length > 0) {
            // Try to find the AI-classified primary category first
            let foundCategory = categories.find((cat: any) => 
              cat.name.toLowerCase() === classifiedCategory.toLowerCase() ||
              cat.slug.toLowerCase() === classifiedCategory.toLowerCase()
            )
            
            // If we have multiple suggested categories from AI, try each one
            if (!foundCategory && typeof suggestedCategories !== 'undefined') {
              for (const suggestedCat of suggestedCategories) {
                foundCategory = categories.find((cat: any) => 
                  cat.name.toLowerCase() === suggestedCat.toLowerCase() ||
                  cat.slug.toLowerCase() === suggestedCat.toLowerCase()
                )
                if (foundCategory) {
                  classifiedCategory = suggestedCat // Update the primary category
                  break
                }
              }
            }
            
            // If no exact match, use smart category mapping
            if (!foundCategory) {
              const categoryMappings: Record<string, string> = {
                'design': 'design',
                'career': 'career', 
                'business': 'business',
                'construction': 'construction',
                'academic': 'academic',
                'informative': 'informative',
                'jobs': 'jobs',
                'other': 'other'
              }
              
              const mappedCategory = categoryMappings[classifiedCategory.toLowerCase()]
              if (mappedCategory) {
                foundCategory = categories.find((cat: any) => 
                  cat.name.toLowerCase() === mappedCategory ||
                  cat.slug.toLowerCase() === mappedCategory
                )
              }
            }
            
            // Final fallback - intelligent default based on content
            if (!foundCategory) {
              const contentLower = content.toLowerCase()
              if (contentLower.includes('job') || contentLower.includes('hiring') || contentLower.includes('career')) {
                foundCategory = categories.find((cat: any) => cat.name.toLowerCase().includes('job') || cat.name.toLowerCase().includes('career'))
              } else if (contentLower.includes('design') || contentLower.includes('architecture')) {
                foundCategory = categories.find((cat: any) => cat.name.toLowerCase().includes('design'))
              } else if (contentLower.includes('business') || contentLower.includes('company')) {
                foundCategory = categories.find((cat: any) => cat.name.toLowerCase().includes('business'))
              } else {
                // Default to informative for educational/info content
                foundCategory = categories.find((cat: any) => cat.name.toLowerCase() === 'informative') || categories[0]
              }
            }
            
            categoryId = foundCategory?.id || categories[0]?.id || ''
            console.log("✅ Selected category:", foundCategory?.name || 'Unknown')
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }

      if (!categoryId) {
        throw new Error('No categories available. Please refresh the page and try again.')
      }

      // Step 2: Detect language and create the post
      setAiProgress(60)
      setAiStatus("Posting...")

      // Detect language of the content
      const detectedLanguage = detectLanguage(content.trim())
      console.log("🗣️ Detected language:", detectedLanguage)

      // Prepare form data for the posts API
      const formData = new FormData()
      formData.append('content', content.trim())
      formData.append('categoryId', categoryId)
      formData.append('isAnonymous', isAnonymous.toString())
      formData.append("tags", JSON.stringify(selectedTags))
      formData.append('originalLanguage', detectedLanguage) // Use detected language
      
      // CRITICAL: Send AI-suggested categories to backend for immediate multiple category assignment
      if (suggestedCategories && suggestedCategories.length > 0) {
        formData.append('aiSuggestedCategories', JSON.stringify(suggestedCategories))
        console.log("🤖 Sending AI suggested categories to backend:", suggestedCategories)
      }
      
      // Add blob URLs as image data
      uploadedFiles.forEach((file, index) => {
        console.log(`📤 Adding image ${index}:`, { url: file.url, name: file.name })
        formData.append(`image_${index}_url`, file.url)
        formData.append(`image_${index}_name`, file.name)
      })

      console.log("📦 FormData being sent with", uploadedFiles.length, "images")

      setAiProgress(80)
      setAiStatus("Finalizing...")

      const response = await makeApiRequest("/api/posts", {
        method: "POST",
        body: formData,
      })

      // Get the created post from the response
      let createdPost = null
      try {
        if (response && typeof response === 'object') {
          if ('json' in response && typeof (response as any).json === 'function') {
            createdPost = await (response as Response).json()
          } else {
            createdPost = response
          }
          
          // Debug: Log the response to see what we're getting
          console.log("🔍 Post creation response:", createdPost)
          console.log("🔍 Attachments in response:", createdPost?.attachments)
          
          // Additional debugging for image data
          if (uploadedFiles && uploadedFiles.length > 0) {
            console.log("📤 Uploaded files sent to API:", uploadedFiles.map(f => ({ url: f.url, name: f.name })))
          }
        }
      } catch (parseError) {
        console.log("Could not parse response, but post was created successfully", parseError)
      }

      // Immediately show success and reset form for instant feedback
      setAiProgress(100)
      setAiStatus("Post created successfully!")
      toast.success("Post created successfully!")

      // Reset form state immediately
      setContent("")
      setIsAnonymous(false)
      resetUpload()
      setSelectedTags([])
      setSuggestedTags([])
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Call parent callback with success result
      onPostCreated({
        success: true,
        post: createdPost
      })
      
      // Clear status after a brief moment
      setTimeout(() => {
        setAiProgress(0)
        setAiStatus("")
      }, 1000)

    } catch (error) {
      let errorMessage = "Failed to create post. Please try again."
      
      if (error instanceof DeploymentError) {
        logDeploymentError(error)
        
        if (error.details?.responseType === 'html') {
          errorMessage = "Authentication error. Please refresh the page and try again."
        } else if (error.statusCode === 503) {
          errorMessage = "Service temporarily unavailable. Please wait a moment and try again."
        } else if (error.statusCode === 502 || error.statusCode === 504) {
          errorMessage = "Server timeout. Please try again in a few moments."
        } else if (error.statusCode === 401) {
          errorMessage = "Please log in again and try posting."
        } else {
          errorMessage = error.message || "Failed to create post. Please try again."
        }
      } else {
        errorMessage = error instanceof Error ? error.message : "Network error. Please check your connection and try again."
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
      setAiStatus("")
      setAiProgress(0)
      
      // Call parent callback with error result
      onPostCreated({
        success: false,
        error: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      await uploadFiles(files)
    } catch (error) {
      // Upload error will be handled by the hook
    } finally {
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full mb-6">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-600">Please sign in to create a post.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full mb-6 smooth-transition hover-lift animate-scale-in">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
            <AvatarFallback>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-gray-500">Create a new post</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{uploadError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={handleContentChange}
              className="min-h-[120px] resize-none"
              disabled={isSubmitting}
            />

            {/* Image Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || !canUploadMore || isSubmitting}
                    className="flex items-center gap-2 smooth-transition hover-scale active:scale-95"
                  >
                    <Cloud className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
                    {hasFiles ? `Add More Images (${remainingSlots} left)` : 'Upload Media'}
                  </Button>
                  
                  {hasFiles && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearAllFiles}
                      disabled={isUploading || isSubmitting}
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Anonymous Toggle - Inline on the right */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="anonymous" className="text-sm whitespace-nowrap">
                    Post anonymously
                  </Label>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading || !canUploadMore || isSubmitting}
              />

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Uploaded Images Preview */}
              {hasFiles && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Uploaded Images ({uploadedFiles.length})
                    </span>
                    {/* Clear All button is already available in the upload controls above */}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={file.url}
                          alt={file.name}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                        disabled={isUploading || isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs p-1 rounded truncate">
                        {file.name}
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Progress */}
            {(isSubmitting && aiProgress > 0) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {aiStatus ? aiStatus : "Posting..."}
                </div>
                <Progress value={aiProgress} className="w-full" />
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full smooth-transition hover-scale active:scale-95 animate-fade-in-up"
              disabled={isSubmitting || isUploading || !content.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Post...
                </>
              ) : (
                "Create Post"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

