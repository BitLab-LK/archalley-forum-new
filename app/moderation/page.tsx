'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { hasPermission } from '@/lib/role-permissions'
import { ModerationQueue } from '@/components/moderation-queue'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ModerationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    const userRole = session.user.role as any
    const canViewQueue = hasPermission(userRole, 'canViewModerationQueue')
    
    if (!canViewQueue) {
      router.push('/')
      return
    }

    setIsAuthorized(true)
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to access the moderation queue.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage reported content to maintain community standards.
          </p>
        </div>

        {/* Moderation Queue */}
        <ModerationQueue />
      </div>
    </div>
  )
}