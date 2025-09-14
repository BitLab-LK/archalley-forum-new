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
  onPostCreated: (createdPost?: any) => void
}

interface AIClassification {
  category: string
  categories?: string[]  // Multiple AI-suggested categories
  tags: string[]
  confidence: number
  originalLanguage: string
  translatedContent: string
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
    setAiStatus("Starting AI analysis...")

    try {
      // Step 1: Get AI classification
      setAiProgress(20)
      setAiStatus("Posting...")
      
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
      
      // Log multiple categories if available
      if (classification.categories && classification.categories.length > 0) {
        console.log("AI suggested categories:", classification.categories);
      }
      
      // Override classification for test posts if needed
      let classifiedCategory = classification.category;
      const { tags, originalLanguage } = classification
      
      setAiProgress(60)
      setAiStatus(originalLanguage !== "English" 
        ? `Translated from ${originalLanguage} and analyzing content...`
        : "Analyzing content and generating tags..."
      )

      // Update suggested tags
      setSuggestedTags(tags)

      // Step 2: Get category ID from category name
      setAiProgress(70)
      setAiStatus("Posting...")
      
      let categoryId = ''
      try {
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          
          // Categories API returns array directly, not wrapped in 'categories' property
          const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData.categories || [])
          
          if (categories && categories.length > 0) {
            // Try to find exact match first (case insensitive)
            let foundCategory = categories.find((cat: any) => 
              cat.name.toLowerCase() === classifiedCategory.toLowerCase() ||
              cat.slug.toLowerCase() === classifiedCategory.toLowerCase()
            )
            
            // If no exact match, try partial matching
            if (!foundCategory) {
              foundCategory = categories.find((cat: any) => 
                cat.name.toLowerCase().includes(classifiedCategory.toLowerCase()) ||
                classifiedCategory.toLowerCase().includes(cat.name.toLowerCase())
              )
            }
            
            // If still no match, try common category mappings with enhanced mappings
            if (!foundCategory) {
              const categoryMappings: Record<string, string> = {
                // Design related
                'architecture': 'design',
                'interior': 'design', 
                'art': 'design',
                'creative': 'design',
                'graphic': 'design',
                'illustration': 'design',
                'ui': 'design',
                'ux': 'design',
                'visual': 'design',
                'artistic': 'design',
                
                // Career related
                'work': 'career',
                'job': 'career',
                'employment': 'career',
                'profession': 'career',
                'interview': 'career',
                'resume': 'career',
                'workplace': 'career',
                'professional': 'career',
                'networking': 'career',
                'skill': 'career',
                'development': 'career',
                'freelance': 'career',
                'consultant': 'career',
                'promotion': 'career',
                
                // Jobs related (separate from career - this is for job postings)
                'hiring': 'jobs',
                'recruitment': 'jobs',
                'position': 'jobs',
                'vacancy': 'jobs',
                'opening': 'jobs',
                'opportunity': 'jobs',
                'posting': 'jobs',
                'apply': 'jobs',
                
                // Business related
                'company': 'business',
                'startup': 'business',
                'entrepreneur': 'business',
                'finance': 'business',
                'marketing': 'business',
                'management': 'business',
                'investment': 'business',
                'economics': 'business',
                
                // Construction related
                'building': 'construction',
                'engineering': 'construction',
                'project': 'construction',
                'materials': 'construction',
                'construction-development': 'construction',
                'infrastructure': 'construction',
                'renovation': 'construction',
                
                // Academic related
                'education': 'academic',
                'research': 'academic',
                'study': 'academic',
                'university': 'academic',
                'college': 'academic',
                'theory': 'academic',
                'teaching': 'academic',
                'learning': 'academic',
                'scholar': 'academic',
                'paper': 'academic',
                'thesis': 'academic',
                'journal': 'academic',
                'lecture': 'academic',
                'student': 'academic',
                'professor': 'academic',
                'curriculum': 'academic',
                'school': 'academic',
                
                // Informative related
                'information': 'informative',
                'news': 'informative',
                'update': 'informative',
                'article': 'informative',
                'insight': 'informative',
                'facts': 'informative',
                'instructions': 'informative',
                'knowledge': 'informative',
                'tutorial': 'informative',
                'how-to': 'informative',
                'guide': 'informative',
                'report': 'informative',
                'announcement': 'informative',
                'resource': 'informative',
                'explanation': 'informative',
                
                // Other related
                'general': 'other',
                'miscellaneous': 'other',
                'discussion': 'other',
                'question': 'other',
                'random': 'other',
                'various': 'other',
                'diverse': 'other',
                'chat': 'other',
                'talk': 'other',
                'conversation': 'other',
                'forum': 'other'
              }
              
              // Convert to lowercase for comparison
              const lowerClassifiedCategory = classifiedCategory.toLowerCase();
              
              // Try to find direct mapping first
              let mappedCategory = categoryMappings[lowerClassifiedCategory];
              
              // If no direct mapping, check if any keyword appears in the classified category
              if (!mappedCategory) {
                for (const [keyword, category] of Object.entries(categoryMappings)) {
                  if (lowerClassifiedCategory.includes(keyword)) {
                    mappedCategory = category;
                    break;
                  }
                }
              }
              
              if (mappedCategory) {
                foundCategory = categories.find((cat: any) => 
                  cat.slug.toLowerCase() === mappedCategory.toLowerCase() ||
                  cat.name.toLowerCase() === mappedCategory.toLowerCase()
                )
              }
            }
            
            // If we still don't have a category match, try to find a category by exact name match
            if (!foundCategory) {
              // Try to find direct match for special categories that might be underrepresented
              if (classifiedCategory.toLowerCase() === "other" || 
                  classifiedCategory.toLowerCase() === "academic" || 
                  classifiedCategory.toLowerCase() === "informative") {
                
                foundCategory = categories.find((cat: any) => 
                  cat.name.toLowerCase() === classifiedCategory.toLowerCase()
                )
                
                if (foundCategory) {
                  console.log(`Direct match found for "${classifiedCategory}" category`)
                }
              }
            }
            
            // Use found category or fallback to appropriate default
            if (!foundCategory) {
              // Check if the AI specifically suggested "Other" - respect that decision
              if (classifiedCategory.toLowerCase() === "other") {
                foundCategory = categories.find((cat: any) => cat.name.toLowerCase() === "other")
              } else {
                // For other cases, try to find the most appropriate category
                // But still respect AI's decision if it's valid
                foundCategory = categories.find((cat: any) => cat.name.toLowerCase() === "informative") ||
                               categories.find((cat: any) => cat.name.toLowerCase() === "design") ||
                               categories.find((cat: any) => cat.name.toLowerCase() === "business") ||
                               categories.find((cat: any) => cat.name.toLowerCase() === "other")
              }
            }
            
            // Final fallback - respect AI's "Other" decision or use first category
            if (!foundCategory) {
              foundCategory = categories[0]
            }
            
            categoryId = foundCategory?.id || ''
          }
        }
      } catch (error) {
        // Silent error handling for category fetch
      }

      if (!categoryId) {
        // Fallback: Try to get categories again and use the first one
        try {
          const fallbackResponse = await fetch('/api/categories')
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            const categories = Array.isArray(fallbackData) ? fallbackData : (fallbackData.categories || [])
            const firstCategory = categories[0]
            
            if (firstCategory) {
              categoryId = firstCategory.id
            }
          }
        } catch (fallbackError) {
          // Silent error handling for fallback category fetch
        }
        
        // If still no category, throw an error instead of using hardcoded ID
        if (!categoryId) {
          throw new Error('No categories available. Please create categories in your database first.')
        }
      }

      // Step 3: Create the post
      setAiProgress(80)
      setAiStatus("Posting...")

      // Prepare form data for the posts API (it expects FormData, not JSON)
      const formData = new FormData()
      formData.append('content', content.trim()) // Send original content, not translated
      formData.append('categoryId', categoryId)
      formData.append('isAnonymous', isAnonymous.toString())
      formData.append("tags", JSON.stringify(selectedTags)) // Max 5 tags
      formData.append('originalLanguage', originalLanguage || 'English')
      // Note: translatedContent will be generated by the API if needed
      
      // Add blob URLs as image data
      uploadedFiles.forEach((file, index) => {
        formData.append(`image_${index}_url`, file.url)
        formData.append(`image_${index}_name`, file.name)
      })

      try {
        const response = await makeApiRequest("/api/posts", {
          method: "POST",
          body: formData, // Send as FormData, not JSON
        })

        // Get the created post from the response
        let createdPost = null
        try {
          if (response && typeof response === 'object') {
            // Check if response has json method (Response object)
            if ('json' in response && typeof (response as any).json === 'function') {
              createdPost = await (response as Response).json()
            } else {
              // Response is already parsed JSON
              createdPost = response
            }
          }
        } catch (parseError) {
          console.log("Could not parse response, but post was created successfully")
        }

        // Immediately show success and reset form for instant feedback
        toast.success("Post created successfully!")
        setAiProgress(100)
        setAiStatus("Post created successfully!")

        // Reset form state immediately (optimistic update)
        setContent("")
        setIsAnonymous(false)
        resetUpload() // Reset upload state without deleting blobs
        setSelectedTags([])
        setSuggestedTags([])
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        // Call parent callback with the created post for optimistic update
        onPostCreated(createdPost)
        
        // Clear status after a brief moment
        setTimeout(() => {
          setAiProgress(0)
          setAiStatus("")
        }, 1000)

      } catch (error) {
        
        if (error instanceof DeploymentError) {
          logDeploymentError(error)
          
          // Provide specific error messages based on error type
          if (error.details?.responseType === 'html') {
            setAiStatus("Authentication error. Please refresh the page and try again.")
          } else if (error.statusCode === 503) {
            setAiStatus("Database connection issue. Please try again in a moment.")
          } else if (error.statusCode === 401) {
            setAiStatus("Please log in again and try posting.")
          } else {
            setAiStatus(error.message || "Failed to create post. Please try again.")
          }
        } else {
          setAiStatus("Network error. Please check your connection and try again.")
        }
        
        setAiProgress(0)
        // DON'T clear files on error - user might want to retry
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create post"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
      setAiProgress(0)
      setAiStatus(null)
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

