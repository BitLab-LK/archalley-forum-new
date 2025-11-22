export type AuditEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_LOCKED"
  | "LOGOUT"
  | "REGISTRATION_SUCCESS"
  | "REGISTRATION_FAILED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_SUCCESS"
  | "PASSWORD_RESET_FAILED"
  | "PASSWORD_CHANGED"
  | "EMAIL_VERIFIED"
  | "EMAIL_VERIFICATION_FAILED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_UNLOCKED"
  | "RATE_LIMIT_EXCEEDED"
  | "SUSPICIOUS_ACTIVITY"

export interface AuditLogData {
  userId?: string | null
  email?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  eventType: AuditEventType
  details?: Record<string, any>
  success: boolean
  errorMessage?: string | null
}

/**
 * Create an audit log entry
 * This should be called for all security-sensitive events
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // In production, you might want to use a separate audit log table
    // For now, we'll use console logging and optionally store in database
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...data,
    }

    // Console logging for development/debugging
    if (process.env.NODE_ENV === "development") {
      console.log("🔒 [AUDIT LOG]", logEntry)
    }

    // Store in database if audit logging is enabled
    // Note: You may want to create a separate AuditLog table in Prisma
    // For now, we'll just log to console and optionally to a file
    
    // Optional: Store in database
    // await prisma.auditLog.create({
    //   data: {
    //     userId: data.userId,
    //     email: data.email,
    //     ipAddress: data.ipAddress,
    //     userAgent: data.userAgent,
    //     eventType: data.eventType,
    //     details: data.details,
    //     success: data.success,
    //     errorMessage: data.errorMessage,
    //   },
    // })
  } catch (error) {
    // Don't throw errors from audit logging - it shouldn't break the main flow
    console.error("Failed to create audit log:", error)
  }
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  eventType: AuditEventType,
  data: {
    userId?: string | null
    email?: string | null
    ipAddress?: string | null
    userAgent?: string | null
    success: boolean
    details?: Record<string, any>
    errorMessage?: string | null
  }
): Promise<void> {
  await createAuditLog({
    ...data,
    eventType,
  })
}

/**
 * Check for suspicious activity patterns
 * This can be used to detect potential security threats
 */
export async function checkSuspiciousActivity(
  _email: string,
  _ipAddress: string
): Promise<boolean> {
  // This is a placeholder - in production, you'd check against stored audit logs
  // For now, we'll use rate limiting as a proxy for suspicious activity
  
  // Example checks:
  // - Multiple failed logins from different IPs
  // - Rapid password reset requests
  // - Unusual login patterns
  
  return false // Placeholder
}
