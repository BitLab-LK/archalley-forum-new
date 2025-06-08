"use client"

import React, { useState, useRef, useEffect, ReactNode, FormEvent, ChangeEvent } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { Image as ImageIcon, Send, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface Category {
  id: string
  name: string
  color: string
  icon: string
  slug: string
}

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
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [aiProgress, setAiProgress] = useState(0)
  const [aiStatus, setAiStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    // Ensure content is valid UTF-8
    try {
      decodeURIComponent(escape(content))
      setContent(content)
    } catch (error) {
      console.error("Invalid UTF-8 content:", error)
      // Optionally show an error message to the user
      toast.error("Invalid character detected. Please use standard characters.")
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!isAuthenticated) {
      setError("Please sign in to create a post")
      return
    }

    if (!content.trim()) {
      setError("Please enter some content")
      return
    }

    // Validate UTF-8 content
    try {
      decodeURIComponent(escape(content))
    } catch (error) {
      setError("Invalid content encoding. Please use standard characters.")
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
        body: JSON.stringify({ content }),
      })

      if (!classificationResponse.ok) {
        throw new Error("Failed to analyze content")
      }

      const classification = await classificationResponse.json() as AIClassification
      const { category: classifiedCategory, tags, confidence, originalLanguage, translatedContent } = classification
      
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
        throw new Error("Failed to get category ID")
      }
      const categoryData = await categoryResponse.json()
      if (!categoryData.category) {
        throw new Error("Category not found")
      }

      // Step 2: Create the post
      const formData = new FormData()
      formData.append("content", content)
      formData.append("categoryId", categoryData.category.id) // Use category ID
      formData.append("isAnonymous", String(isAnonymous))
      formData.append("tags", JSON.stringify(tags) as string)
      formData.append("originalLanguage", originalLanguage)
      formData.append("translatedContent", translatedContent)

      // Add images if any
      images.forEach((image: UploadedImage, index: number) => {
        formData.append(`image${index}`, image.url)
      })

      setAiProgress(90)
      setAiStatus("Creating post...")

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create post")
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

      // Refresh the page to show the new post
      window.location.reload()
    } catch (error) {
      console.error("Error creating post:", error)
      setError(error instanceof Error ? error.message : "Failed to create post")
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
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i])
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload images')
      }

      const data = await response.json()
      setImages(prev => [...prev, ...data.images])
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setIsUploading(false)
      // Reset file input
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
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
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
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative group aspect-square">
                      <Image
                        src={image.url}
                        alt={`Uploaded image ${index + 1}`}
                        fill
                        className="rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
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
          </form>
        )}
      </CardContent>
    </Card>
  )
}
