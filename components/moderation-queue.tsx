'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Shield, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSocket } from '@/lib/socket-context'
import { formatDistanceToNow } from 'date-fns'

interface Report {
  id: string
  reason: string
  customReason?: string | null
  description?: string | null
  status: string
  severity: string
  createdAt: string
  updatedAt: string
  reviewedAt?: string | null
  reviewNotes?: string | null
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  post: {
    id: string
    content: string
    createdAt: string
    isHidden: boolean
    isFlagged: boolean
    authorId: string
    author: {
      id: string
      name: string | null
      email: string | null
      image: string | null
    }
  }
  reviewer?: {
    id: string
    name: string | null
    email: string | null
    role: string | null
  } | null
}

interface ModerationStats {
  pendingReports: number
  reviewedReports: number
  resolvedReports: number
  dismissedReports: number
  escalatedReports: number
  flaggedPosts: number
  totalReports: number
}

const SEVERITY_COLORS = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
}

const STATUS_COLORS = {
  PENDING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  REVIEWED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  DISMISSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  ESCALATED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
}

export function ModerationQueue() {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStatus, setCurrentStatus] = useState('PENDING')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [moderationAction, setModerationAction] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    fetchStats()
    fetchReports()
  }, [currentStatus, currentPage])

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleFlagsResolved = (data: any) => {
      console.log('📋 Flags resolved update received in moderation queue:', data)
      
      // Remove resolved reports from the list if viewing PENDING
      if (currentStatus === 'PENDING') {
        setReports(prevReports => 
          prevReports.filter(report => 
            !(report.post.id === data.postId && report.id === data.flagId)
          )
        )
      }
      
      // Refresh stats
      fetchStats()
      
      // Show notification
      toast({
        title: 'Flag Resolved',
        description: data.message,
        duration: 3000
      })
    }

    const handlePostModerationUpdate = (data: any) => {
      console.log('📝 Post moderation update received in moderation queue:', data)
      
      // Refresh current view if it might be affected
      if (data.action === 'flagReviewed' || data.action === 'approve') {
        fetchReports()
        fetchStats()
      }
    }

    // Handle new flag creation
    const handleNewFlagCreated = (data: any) => {
      console.log('🚩 New flag created in moderation queue:', data)
      
      // Add new report to the list if viewing PENDING status
      if (currentStatus === 'PENDING') {
        fetchReports()
      }
      
      // Refresh stats
      fetchStats()
      
      // Show notification for high/critical severity flags
      if (data.severity === 'HIGH' || data.severity === 'CRITICAL') {
        toast({
          title: `${data.severity} Priority Flag`,
          description: data.message,
          variant: data.severity === 'CRITICAL' ? 'destructive' : 'default',
          duration: 5000
        })
      }
    }

    // Handle moderation stats updates
    const handleModerationStatsUpdate = (data: any) => {
      console.log('📊 Moderation stats update received in moderation queue:', data)
      fetchStats()
    }

    socket.on('flagsResolved', handleFlagsResolved)
    socket.on('postModerationUpdate', handlePostModerationUpdate)
    socket.on('newFlagCreated', handleNewFlagCreated)
    socket.on('moderationStatsUpdate', handleModerationStatsUpdate)

    return () => {
      socket.off('flagsResolved', handleFlagsResolved)
      socket.off('postModerationUpdate', handlePostModerationUpdate)
      socket.off('newFlagCreated', handleNewFlagCreated)
      socket.off('moderationStatsUpdate', handleModerationStatsUpdate)
    }
  }, [socket, isConnected, currentStatus, toast])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/moderation/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/flags?status=${currentStatus}&page=${currentPage}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch reports')
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch reports. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReviewReport = (report: Report) => {
    setSelectedReport(report)
    setReviewAction('')
    setReviewNotes('')
    setModerationAction('')
    setIsReviewModalOpen(true)
  }

  const submitReview = async () => {
    if (!selectedReport || !reviewAction) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/flags/${selectedReport.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: reviewAction,
          reviewNotes,
          moderationAction: moderationAction || undefined,
          moderationReason: reviewNotes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to review report')
      }

      toast({
        title: 'Success',
        description: `Report ${reviewAction.toLowerCase()} successfully.`
      })

      setIsReviewModalOpen(false)
      fetchReports()
      fetchStats()
    } catch (error) {
      console.error('Error reviewing report:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to review report.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatReason = (reason: string, customReason?: string | null) => {
    const formatted = reason.replace(/_/g, ' ').toLowerCase()
    return customReason ? `${formatted}: ${customReason}` : formatted
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.pendingReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Reviewed</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.reviewedReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolvedReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-sm font-medium">Dismissed</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.dismissedReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Escalated</p>
                  <p className="text-2xl font-bold text-red-600">{stats.escalatedReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Flagged Posts</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.flaggedPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Moderation Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              <Select value={currentStatus} onValueChange={(value) => {
                setCurrentStatus(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                  <SelectItem value="ESCALATED">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reports List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reports found for the selected status.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS]}>
                            {report.severity}
                          </Badge>
                          <Badge className={STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]}>
                            {report.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        <div>
                          <p className="font-medium text-sm">Reason: {formatReason(report.reason, report.customReason)}</p>
                          {report.description && (
                            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                          )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-600">
                              Post by {report.post.author.name || 'Unknown User'}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{report.post.content}</p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Reported by: {report.user.name || 'Anonymous'}</span>
                          {report.reviewer && (
                            <span>Reviewed by: {report.reviewer.name}</span>
                          )}
                        </div>
                      </div>

                      <div className="ml-4">
                        {report.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => handleReviewReport(report)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        )}
                        {report.status !== 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewReport(report)}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              Review and take action on this report.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Report Details */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Report Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Reason:</span> {formatReason(selectedReport.reason, selectedReport.customReason)}
                  </div>
                  <div>
                    <span className="font-medium">Severity:</span> 
                    <Badge className={`ml-2 ${SEVERITY_COLORS[selectedReport.severity as keyof typeof SEVERITY_COLORS]}`}>
                      {selectedReport.severity}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Reported by:</span> {selectedReport.user.name || 'Anonymous'}
                  </div>
                  <div>
                    <span className="font-medium">Reported:</span> {formatDistanceToNow(new Date(selectedReport.createdAt), { addSuffix: true })}
                  </div>
                </div>
                {selectedReport.description && (
                  <div className="mt-3">
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-sm">{selectedReport.description}</p>
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Reported Post</h3>
                <div className="text-sm mb-2">
                  <span className="font-medium">Author:</span> {selectedReport.post.author.name || 'Unknown User'}
                </div>
                <p className="text-sm">{selectedReport.post.content}</p>
              </div>

              {/* Review Actions */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Review Decision *</Label>
                  <Select value={reviewAction} onValueChange={setReviewAction}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select an action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REVIEWED">Mark as Reviewed</SelectItem>
                      <SelectItem value="RESOLVED">Resolve (Valid Report)</SelectItem>
                      <SelectItem value="DISMISSED">Dismiss (Invalid Report)</SelectItem>
                      <SelectItem value="ESCALATED">Escalate to Higher Authority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(reviewAction === 'RESOLVED' || reviewAction === 'REVIEWED') && (
                  <div>
                    <Label className="text-base font-medium">Moderation Action (Optional)</Label>
                    <Select value={moderationAction} onValueChange={setModerationAction}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select a moderation action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No additional action</SelectItem>
                        <SelectItem value="HIDE_POST">Hide Post</SelectItem>
                        <SelectItem value="PIN_POST">Pin Post</SelectItem>
                        <SelectItem value="LOCK_POST">Lock Post</SelectItem>
                        <SelectItem value="DELETE_POST">Delete Post</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="reviewNotes" className="text-base font-medium">Review Notes</Label>
                  <Textarea
                    id="reviewNotes"
                    placeholder="Add notes about your decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitReview}
                  disabled={!reviewAction || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? 'Processing...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}