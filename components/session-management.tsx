/**
 * Admin component for session management
 * Shows options to invalidate user sessions manually
 */

"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Shield, LogOut, AlertTriangle } from "lucide-react"

interface SessionManagementProps {
  isVisible?: boolean
}

export function SessionManagement({ isVisible = false }: SessionManagementProps) {
  const [userIds, setUserIds] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  if (!isVisible) return null

  const handleInvalidateSessions = async () => {
    if (!userIds.trim()) {
      toast.error("Please enter at least one user ID")
      return
    }

    setIsLoading(true)
    
    try {
      const userIdList = userIds
        .split('\n')
        .map(id => id.trim())
        .filter(id => id.length > 0)

      const response = await fetch('/api/admin/invalidate-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: userIdList,
          reason: reason.trim() || "Manual session invalidation by admin"
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      const result = await response.json()
      
      toast.success(
        `Successfully invalidated sessions for ${result.userIds.length} user(s). ` +
        `They will be logged out from all devices.`
      )

      // Clear form
      setUserIds("")
      setReason("")
      
    } catch (error) {
      console.error("Failed to invalidate sessions:", error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to invalidate sessions"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Session Management
        </CardTitle>
        <CardDescription>
          Manually invalidate user sessions for security purposes. Users will be automatically 
          logged out from all devices and must sign in again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Warning:</strong> This will immediately log out the specified users from all devices. 
              They will need to sign in again to continue using the platform.
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="userIds">User IDs (one per line)</Label>
          <Textarea
            id="userIds"
            placeholder="Enter user IDs, one per line..."
            value={userIds}
            onChange={(e) => setUserIds(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            You can enter multiple user IDs, each on a separate line
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Input
            id="reason"
            placeholder="e.g., Security concern, Account compromise, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleInvalidateSessions}
          disabled={isLoading || !userIds.trim()}
          className="w-full"
          variant="destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoading ? "Invalidating Sessions..." : "Invalidate Sessions"}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Note:</strong> This action is logged for audit purposes.</p>
          <p><strong>Auto-logout:</strong> When you change user roles via the user management section, sessions are automatically invalidated.</p>
        </div>
      </CardContent>
    </Card>
  )
}