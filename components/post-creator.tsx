"use client"

import React, { useState, useRef, FormEvent, ChangeEvent } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Image as ImageIcon, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"



interface PostCreatorProps {
  onPostCreated: () => void
}

interface UploadedImage {
  url: string
  name: string
}

interface AIClassification {
  category: string
  tags: string[]
  confidence: number
  originalLanguage: string
  translatedContent: string
}

export default function PostCreator({ onPostCreated }: PostCreatorProps) {
  const { user, isAuthenticated } = useAuth()
  const [content, setContent] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setSuggestedTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [aiProgress, setAiProgress] = useState(0)
  const [aiStatus, setAiStatus] = useState<string | null>(null)
  const [imageUploadProgress, setImageUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
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
    setAiStatus("Starting AI analysis...")

    try {
      // Step 1: Get AI classification
      setAiProgress(20)
      setAiStatus("Analyzing content and detecting language...")
      
      const classificationResponse = await fetch("/api/ai/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!classificationResponse.ok) {
        const errorData = await classificationResponse.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || "Failed to analyze content")
      }

      const classification = await classificationResponse.json() as AIClassification
      const { category: classifiedCategory, tags, originalLanguage, translatedContent } = classification
      
      setAiProgress(60)
      setAiStatus(originalLanguage !== "English" 
        ? `Translated from ${originalLanguage} and analyzing content...`
        : "Analyzing content and generating tags..."
      )

      // Update suggested tags
      setSuggestedTags(tags)
      setSelectedTags(tags)

      setAiProgress(80)
      setAiStatus("Preparing to create post...")

      // Get category ID from the classified category name
      const categoryResponse = await fetch(`/api/categories?name=${encodeURIComponent(classifiedCategory)}`)
      if (!categoryResponse.ok) {
        const categoryError = await categoryResponse.json().catch(() => ({}))
        throw new Error(categoryError.message || categoryError.error || "Failed to get category")
      }
      
      const categoryData = await categoryResponse.json()
      if (!categoryData.category) {
        throw new Error(`Category "${classifiedCategory}" not found`)
      }

      // Step 2: Create the post
      const formData = new FormData()
      formData.append("content", content.trim())
      formData.append("categoryId", categoryData.category.id)
      formData.append("isAnonymous", String(isAnonymous))
      formData.append("tags", JSON.stringify(selectedTags))
      formData.append("originalLanguage", originalLanguage)
      formData.append("translatedContent", translatedContent)

      // Add images if any
      images.forEach((image, index) => {
        // Only append the URL, as the file is already uploaded
        formData.append(`image${index}`, image.url)
      })

      // Log the form data for debugging
      console.log("Creating post with data:", {
          content: content.trim(),
        categoryId: categoryData.category.id,
          isAnonymous,
        tags: selectedTags,
        originalLanguage,
        hasTranslatedContent: !!translatedContent,
        images: images.map(img => ({
          url: img.url,
          name: img.name
        }))
      })

      setAiProgress(90)
      setAiStatus("Creating post...")

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        console.error("Post creation failed:", {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          message: data.message,
          details: data.details
        })

        // Handle validation errors
        if (response.status === 400 && data.details) {
          const validationErrors = Object.entries(data.details)
            .filter(([key]) => key !== "_errors")
            .map(([field, errors]: [string, any]) => {
              const fieldErrors = errors._errors || []
              return `${field}: ${fieldErrors.join(", ")}`
            })
            .join("\n")
          
          throw new Error(validationErrors || data.message || "Invalid input")
        }

        throw new Error(data.message || data.error || `Failed to create post (${response.status})`)
      }

      setAiProgress(100)
      setAiStatus("Post created successfully!")

      // Reset form
        setContent("")
        setIsAnonymous(false)
      setImages([])
      setSelectedTags([])
      setSuggestedTags([])

      // Notify parent component
      onPostCreated()

      // Show success message
      toast.success("Post created successfully!")

      // Refresh the page to show the new post
        window.location.reload()
    } catch (error) {
      console.error("Error creating post:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create post"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
      // Reset AI progress after a delay
      setTimeout(() => {
        setAiProgress(0)
        setAiStatus(null)
      }, 2000)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev: UploadedImage[]) => prev.filter((_, i: number) => i !== index))
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setError(null)
    setImageUploadProgress(0)

    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i])
      }

      // Use XMLHttpRequest for upload progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload')
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setImageUploadProgress(percent)
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              if (!data.images || !Array.isArray(data.images)) {
                throw new Error('Invalid response from server')
              }
              setImages(prev => [...prev, ...data.images])
              toast.success(`Successfully uploaded ${data.images.length} image${data.images.length > 1 ? 's' : ''}`)
              setImageUploadProgress(100)
              resolve()
            } catch (err) {
              reject(err)
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText)
              setError(data.message || data.error || 'Failed to upload images')
              toast.error(data.message || data.error || 'Failed to upload images')
            } catch {
              setError('Failed to upload images')
              toast.error('Failed to upload images')
            }
            reject(new Error('Failed to upload images'))
          }
        }
        xhr.onerror = () => {
          setError('Failed to upload images')
          toast.error('Failed to upload images')
          reject(new Error('Failed to upload images'))
        }
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Error uploading images:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
      setTimeout(() => setImageUploadProgress(0), 1000)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Card className="mb-6 shadow-sm border-0">
        <CardContent className="p-4">
        {!user ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Please sign in to create a post</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" acceptCharset="UTF-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}
            
            {/* Post Creator Header */}
            <div className="flex items-center space-x-3 pb-3 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={user.image || "/avatar_placeholder.webp"} 
                  alt={user.name || "User avatar"}
                />
                <AvatarFallback>
                  {user.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  id="content"
                  value={content}
                  onChange={handleContentChange}
                  placeholder={`What's on your mind, ${user.name?.split(' ')[0] || 'there'}?`}
                  className="min-h-[80px] border-0 focus-visible:ring-0 resize-none bg-transparent text-base"
                  disabled={isSubmitting}
                  maxLength={10000}
                  dir="auto"
                />
              </div>
            </div>

            {/* Post Options */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || isUploading}
                  className="text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full px-3"
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Photo
                </Button>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                    disabled={isSubmitting}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="anonymous" className="text-sm text-gray-600">Post anonymously</Label>
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading || !content.trim()}
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post"
                )}
              </Button>
            </div>

            {/* Hidden File Input */}
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
              disabled={isSubmitting || isUploading}
            />

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                      style={{
                        maxHeight: '200px',
                        minHeight: '100px',
                        aspectRatio: '1/1'
                      }}
                    >
                      <div className="relative w-full h-full group">
                        <Image
                          src={image.url}
                          alt={`Uploaded image ${index + 1}`}
                          fill
                          className="object-contain"
                          sizes="25vw"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/50 hover:bg-black/70"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Progress Bar */}
            {isSubmitting && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{aiStatus}</span>
                  <span>{aiProgress}%</span>
                </div>
                <Progress value={aiProgress} className="h-1" />
              </div>
            )}

            {/* Image Upload Progress Bar */}
            {isUploading && (
              <div className="mb-2">
                <Progress value={imageUploadProgress} className="h-2" />
                <div className="text-xs text-gray-500 mt-1">Uploading images... {imageUploadProgress}%</div>
              </div>
            )}
          </form>
        )}
        </CardContent>
      </Card>
  )
}
