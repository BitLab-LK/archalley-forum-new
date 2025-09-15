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
      // OPTIMIZATION: Skip AI classification on frontend, let backend handle it
      // This dramatically reduces post creation time
      setAiProgress(30)
      setAiStatus("Uploading...")
      
      // Step 1: Quick category selection (use a default category for speed)
      let categoryId = ''
      try {
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData.categories || [])
          
          if (categories && categories.length > 0) {
            // Use first available category as default for speed
            // Backend AI will enhance categorization later
            const defaultCategory = categories.find((cat: any) => 
              cat.name.toLowerCase() === "general" || 
              cat.name.toLowerCase() === "other" ||
              cat.name.toLowerCase() === "informative"
            ) || categories[0]
            
            categoryId = defaultCategory?.id || ''
          }
        }
      } catch (error) {
        // Silent error handling for category fetch
      }

      if (!categoryId) {
        throw new Error('No categories available. Please refresh the page and try again.')
      }

      // Step 2: Create the post immediately
      setAiProgress(60)
      setAiStatus("Publishing...")

      // Prepare form data for the posts API
      const formData = new FormData()
      formData.append('content', content.trim())
      formData.append('categoryId', categoryId)
      formData.append('isAnonymous', isAnonymous.toString())
      formData.append("tags", JSON.stringify(selectedTags))
      formData.append('originalLanguage', 'English') // Simplified for speed
      
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

