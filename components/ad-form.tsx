"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Save, AlertCircle, Eye, EyeOff } from 'lucide-react'
import AdImageUpload from '@/components/ad-image-upload'
import { type AdImageUploadResult } from '@/hooks/use-ad-image-upload'

export interface AdFormData {
  id?: string
  title: string
  description: string
  imageUrl: string
  redirectUrl: string
  size: string
  active: boolean
  weight: number
  priority: 'high' | 'medium' | 'low'
}

interface AdFormProps {
  initialData?: Partial<AdFormData>
  onSubmit: (data: AdFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

const AD_SIZES = [
  { value: '320x320', label: '320×320 (Small Square)' },
  { value: '350x350', label: '350×350 (Square)' },
  { value: '680x180', label: '680×180 (Banner)' },
  { value: '800x200', label: '800×200 (Wide Banner)' },
  { value: '970x180', label: '970×180 (Leaderboard)' },
  { value: '1200x240', label: '1200×240 (Large Banner)' },
  { value: '1200x300', label: '1200×300 (Mega Banner)' }
]

const PRIORITIES = [
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'low', label: 'Low Priority' }
]

export default function AdForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: AdFormProps) {
  const [formData, setFormData] = useState<AdFormData>({
    title: '',
    description: '',
    imageUrl: '',
    redirectUrl: '',
    size: '350x350',
    active: true,
    weight: 5,
    priority: 'medium',
    ...initialData
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previewMode, setPreviewMode] = useState(false)

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const handleInputChange = (field: keyof AdFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleImagesChange = (images: AdImageUploadResult[]) => {
    if (images.length > 0) {
      // Use the first uploaded image
      handleInputChange('imageUrl', images[0].url)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Advertisement image is required'
    }

    if (!formData.redirectUrl.trim()) {
      newErrors.redirectUrl = 'Redirect URL is required'
    } else {
      try {
        new URL(formData.redirectUrl)
      } catch {
        newErrors.redirectUrl = 'Please enter a valid URL'
      }
    }

    if (!formData.size) {
      newErrors.size = 'Advertisement size is required'
    }

    if (formData.weight < 1 || formData.weight > 10) {
      newErrors.weight = 'Weight must be between 1 and 10'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const renderPreview = () => {
    if (!formData.imageUrl) {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">No image uploaded yet</p>
        </div>
      )
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <img
          src={formData.imageUrl}
          alt={formData.title || 'Advertisement Preview'}
          className="w-full h-auto object-cover"
          style={{
            aspectRatio: formData.size === '350x350' || formData.size === '320x320' ? '1/1' : 
                        formData.size.includes('180') ? '5/1' : 
                        formData.size.includes('200') ? '4/1' : 
                        formData.size.includes('240') ? '5/1' :
                        formData.size.includes('300') ? '4/1' : 'auto'
          }}
        />
        {(formData.title || formData.description) && (
          <div className="p-4 bg-gray-50 border-t">
            {formData.title && (
              <h3 className="font-semibold text-lg">{formData.title}</h3>
            )}
            {formData.description && (
              <p className="text-gray-600 mt-1">{formData.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Click to visit: {formData.redirectUrl}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? 'Create New Advertisement' : 'Edit Advertisement'}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Advertisement Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {renderPreview()}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Advertisement Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter advertisement title"
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter advertisement description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="redirectUrl">Target URL</Label>
                    <Input
                      id="redirectUrl"
                      type="url"
                      value={formData.redirectUrl}
                      onChange={(e) => handleInputChange('redirectUrl', e.target.value)}
                      placeholder="https://example.com"
                      className={errors.redirectUrl ? 'border-red-500' : ''}
                    />
                    {errors.redirectUrl && (
                      <p className="text-sm text-red-500 mt-1">{errors.redirectUrl}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="size">Advertisement Size</Label>
                    <Select
                      value={formData.size}
                      onValueChange={(value) => handleInputChange('size', value)}
                    >
                      <SelectTrigger className={errors.size ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {AD_SIZES.map(size => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.size && (
                      <p className="text-sm text-red-500 mt-1">{errors.size}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleInputChange('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="weight">
                      Weight (1-10) 
                      <Badge variant="secondary" className="ml-2">
                        Current: {formData.weight}
                      </Badge>
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      min={1}
                      max={10}
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', parseInt(e.target.value) || 1)}
                      className={errors.weight ? 'border-red-500' : ''}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Higher weight = more likely to be displayed
                    </p>
                    {errors.weight && (
                      <p className="text-sm text-red-500 mt-1">{errors.weight}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="active">Active Status</Label>
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => handleInputChange('active', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Image Upload */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Advertisement Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdImageUpload
                    adId={formData.id}
                    maxImages={1}
                    onImagesChange={handleImagesChange}
                    initialImages={formData.imageUrl ? [{
                      url: formData.imageUrl,
                      name: 'Current Image',
                      size: 0,
                      type: 'image/jpeg',
                      pathname: '',
                      downloadUrl: formData.imageUrl
                    }] : []}
                  />
                  {errors.imageUrl && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.imageUrl}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Create Advertisement' : 'Update Advertisement'}
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
