"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, Lock, Activity, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Session {
  id: string
  device: string
  browser?: string
  userAgent?: string
  fingerprint?: string
  ipAddress: string
  lastActive: string
  isCurrent: boolean
}

interface AuditLog {
  id: string
  timestamp: string
  eventType: string
  success: boolean
  ipAddress?: string
  userAgent?: string
  details?: any
  errorMessage?: string
}

export default function SecurityDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/register?tab=login")
      return
    }

    if (status === "authenticated" && session?.user?.id) {
      fetchSecurityData()
    }
  }, [status, session, router])

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Fetch sessions
      const sessionsResponse = await fetch("/api/auth/sessions")
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData.sessions || [])
      }

      // Note: Audit logs would require a database table
      // For now, we'll show a placeholder
      setAuditLogs([])
    } catch (error) {
      console.error("Failed to fetch security data:", error)
      setError("Failed to load security data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/auth/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Refresh sessions
        fetchSecurityData()
      } else {
        setError("Failed to revoke session")
      }
    } catch (error) {
      console.error("Failed to revoke session:", error)
      setError("Failed to revoke session")
    }
  }

  const handleRevokeAllSessions = async () => {
    if (!confirm("Are you sure you want to revoke all sessions? You will be logged out.")) {
      return
    }

    try {
      const response = await fetch("/api/auth/sessions?revokeAll=true", {
        method: "DELETE",
      })

      if (response.ok) {
        // Redirect to login
        router.push("/auth/register?tab=login")
      } else {
        setError("Failed to revoke all sessions")
      }
    } catch (error) {
      console.error("Failed to revoke all sessions:", error)
      setError("Failed to revoke all sessions")
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading security dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account security settings and view activity logs
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Active Sessions
                </CardTitle>
                <CardDescription>
                  Manage your active login sessions
                </CardDescription>
              </div>
              {sessions.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRevokeAllSessions}
                >
                  Revoke All Sessions
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No active sessions found
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {session.device}
                        {session.fingerprint && (
                          <span className="text-xs text-muted-foreground block">
                            ID: {session.fingerprint.substring(0, 8)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.browser || 'Unknown'}
                      </TableCell>
                      <TableCell>{session.ipAddress}</TableCell>
                      <TableCell>
                        {new Date(session.lastActive).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {session.isCurrent ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!session.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security Activity Log
            </CardTitle>
            <CardDescription>
              Recent authentication and security events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Audit logging is enabled but requires database storage.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check server logs for recent security events.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.eventType}
                      </TableCell>
                      <TableCell>{log.ipAddress || "N/A"}</TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.errorMessage || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Security Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Enable two-factor authentication for extra security</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Use a strong, unique password</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Review your active sessions regularly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Revoke sessions from devices you no longer use</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Keep your email address verified</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
