"use client"

import { useEffect, useState } from 'react'
import { ViewerGuard } from '@/components/viewer-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2 } from 'lucide-react'

interface Registration {
  id: string
  registrationNumber: string
  status: string
  amountPaid: number
  currency: string
  registeredAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  competition: {
    id: string
    slug: string
    title: string
    year: number
  }
  registrationType: {
    id: string
    name: string
    type: string | null
  }
  payment: {
    id: string
    orderId: string
    status: string
    amount: number
    paymentMethod: string
    completedAt: string | null
  } | null
}

export default function CompetitionInfoPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/events/competition-registrations')
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError('You do not have permission to view this page.')
          } else {
            setError('Failed to load registration data.')
          }
          return
        }

        const data = await response.json()
        if (data.success) {
          setRegistrations(data.data)
        } else {
          setError(data.error || 'Failed to load registration data.')
        }
      } catch (err) {
        console.error('Error fetching registrations:', err)
        setError('An error occurred while loading data.')
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number, currency: string = 'LKR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getPaymentStatusBadge = (payment: Registration['payment']) => {
    if (!payment) {
      return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">No Payment</span>
    }
    
    const statusColors: Record<string, string> = {
      'COMPLETED': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'PENDING': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      'FAILED': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      'CANCELLED': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    }
    
    const colorClass = statusColors[payment.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    
    return (
      <span className={`px-2 py-1 text-xs rounded ${colorClass}`}>
        {payment.status}
      </span>
    )
  }

  return (
    <ViewerGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Competition Registration Details</CardTitle>
              <CardDescription>
                View all competition registrations with payment and user information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading registrations...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">No registrations found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead>Entry Type</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {registration.user.name || 'N/A'}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {registration.user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {registration.competition.title}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {registration.competition.year}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {registration.registrationType.name}
                            </span>
                            {registration.registrationType.type && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {registration.registrationType.type}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            {getPaymentStatusBadge(registration.payment)}
                            {registration.payment && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {registration.payment.paymentMethod || 'N/A'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(registration.amountPaid, registration.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatDate(registration.registeredAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ViewerGuard>
  )
}

