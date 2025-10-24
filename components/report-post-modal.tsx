'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Flag, Shield, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ReportPostModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  postContent: string
  postAuthor: string
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam', description: 'Unwanted commercial content or repetitive posts' },
  { value: 'HARASSMENT', label: 'Harassment', description: 'Bullying, intimidation, or personal attacks' },
  { value: 'HATE_SPEECH', label: 'Hate Speech', description: 'Content promoting hatred based on identity' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content', description: 'Content not suitable for this community' },
  { value: 'MISINFORMATION', label: 'Misinformation', description: 'False or misleading information' },
  { value: 'COPYRIGHT_VIOLATION', label: 'Copyright Violation', description: 'Unauthorized use of copyrighted material' },
  { value: 'PERSONAL_INFORMATION', label: 'Personal Information', description: 'Sharing private information without consent' },
  { value: 'OFF_TOPIC', label: 'Off Topic', description: 'Content not relevant to this community' },
  { value: 'DUPLICATE_CONTENT', label: 'Duplicate Content', description: 'Reposted or copied content' },
  { value: 'SCAM_FRAUD', label: 'Scam/Fraud', description: 'Deceptive or fraudulent content' },
  { value: 'VIOLENCE_THREATS', label: 'Violence/Threats', description: 'Threats of violence or harmful content' },
  { value: 'SEXUAL_CONTENT', label: 'Sexual Content', description: 'Inappropriate sexual content' },
  { value: 'ILLEGAL_CONTENT', label: 'Illegal Content', description: 'Content that violates laws' },
  { value: 'OTHER', label: 'Other', description: 'Other reason not listed above' }
]

const SEVERITY_LEVELS = [
  { value: 'LOW', label: 'Low', description: 'Minor issue that can be addressed when convenient', color: 'text-green-600' },
  { value: 'MEDIUM', label: 'Medium', description: 'Moderate issue requiring attention', color: 'text-yellow-600' },
  { value: 'HIGH', label: 'High', description: 'Serious issue requiring prompt attention', color: 'text-orange-600' },
  { value: 'CRITICAL', label: 'Critical', description: 'Urgent issue requiring immediate action', color: 'text-red-600' }
]

export function ReportPostModal({ isOpen, onClose, postId, postContent, postAuthor }: ReportPostModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customReason, setCustomReason] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<string>('MEDIUM')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedReason) {
      toast({
        title: 'Error',
        description: 'Please select a reason for reporting this post.',
        variant: 'destructive'
      })
      return
    }

    if (selectedReason === 'OTHER' && !customReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a custom reason when selecting \"Other\".',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId,
          reason: selectedReason,
          customReason: selectedReason === 'OTHER' ? customReason : undefined,
          description: description.trim() || undefined,
          severity
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to report post')
      }

      toast({
        title: 'Report Submitted',
        description: 'Thank you for helping keep our community safe. A moderator will review this report.',
      })

      // Reset form and close modal
      setSelectedReason('')
      setCustomReason('')
      setDescription('')
      setSeverity('MEDIUM')
      onClose()

    } catch (error) {
      console.error('Error reporting post:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit report. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedReasonData = REPORT_REASONS.find(r => r.value === selectedReason)
  const selectedSeverityData = SEVERITY_LEVELS.find(s => s.value === severity)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Report Post
          </DialogTitle>
          <DialogDescription>
            Help us maintain a safe and respectful community by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Post by {postAuthor}
              </span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3">
              {postContent}
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Reason for reporting *</Label>
            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {REPORT_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="radio"
                    id={reason.value}
                    name="reportReason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1 h-4 w-4 text-primary border-gray-300 focus:ring-primary focus:ring-2"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={reason.value} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {reason.label}
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Reason (when OTHER is selected) */}
          {selectedReason === 'OTHER' && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Custom Reason *</Label>
              <Textarea
                id="customReason"
                placeholder="Please specify the reason for reporting this post..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="min-h-[80px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500">{customReason.length}/500 characters</p>
            </div>
          )}

          {/* Additional Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context that might help moderators understand the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500">{description.length}/1000 characters</p>
          </div>

          {/* Severity Selection */}
          <div className="space-y-2">
            <Label>Severity Level</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-current ${level.color}`} />
                      <span>{level.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSeverityData && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {selectedSeverityData.description}
              </p>
            )}
          </div>

          {/* Warning Message */}
          {selectedReasonData && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Important Information
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    False reports may result in restrictions on your account. Please ensure your report is accurate and made in good faith.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedReason || isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}