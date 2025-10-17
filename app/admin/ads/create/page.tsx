"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import AdForm, { type AdFormData } from '@/components/ad-form'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CreateEditAdPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const adId = searchParams.get('id')
  const mode = adId ? 'edit' : 'create'
  
  const [isLoading, setIsLoading] = useState(false)
  const [initialData, setInitialData] = useState<Partial<AdFormData> | undefined>()
  const [error, setError] = useState<string | null>(null)

  // Load existing ad data for editing
  useEffect(() => {
    if (mode === 'edit' && adId) {
      loadAdData(adId)
    }
  }, [mode, adId])

  const loadAdData = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/ads`)
      if (!response.ok) {
        throw new Error('Failed to load advertisements')
      }

      const data = await response.json()
      const ad = data.banners?.find((banner: any) => banner.id === id)
      
      if (!ad) {
        throw new Error('Advertisement not found')
      }

      setInitialData({
        id: ad.id,
        title: ad.title || '',
        description: ad.description || '',
        imageUrl: ad.imageUrl,
        redirectUrl: ad.redirectUrl,
        size: ad.size,
        active: ad.active,
        weight: ad.weight || 5,
        priority: ad.priority?.toLowerCase() || 'medium'
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load advertisement'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (formData: AdFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const apiEndpoint = '/api/admin/ads'
      const method = 'POST'
      
      const requestBody = {
        action: mode === 'create' ? 'create' : 'update',
        ...(mode === 'edit' && { bannerId: adId }),
        adData: {
          title: formData.title,
          description: formData.description || null,
          imageUrl: formData.imageUrl,
          redirectUrl: formData.redirectUrl,
          size: formData.size,
          active: formData.active,
          weight: formData.weight,
          priority: formData.priority.toUpperCase()
        }
      }

      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to save advertisement')
      }

      if (result.success) {
        toast.success(result.message || `Advertisement ${mode === 'create' ? 'created' : 'updated'} successfully`)
        router.push('/admin/ads')
      } else {
        throw new Error(result.error || 'Unexpected response from server')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save advertisement'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/ads')
  }

  // Check permissions
  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/ads">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ads
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && mode === 'edit' && !initialData && (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading advertisement data...</p>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {(mode === 'create' || (mode === 'edit' && initialData)) && (
        <AdForm
          mode={mode}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}