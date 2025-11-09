/**
 * Device fingerprinting for session tracking
 * This helps identify and track devices for security purposes
 */

export interface DeviceFingerprint {
  userAgent: string
  language: string
  platform: string
  screenResolution?: string
  timezone?: string
  cookieEnabled: boolean
  hash: string
}

/**
 * Generate device fingerprint from browser information
 * This is a simple fingerprint - in production, consider using a library like FingerprintJS
 */
export function generateDeviceFingerprint(userAgent: string, additionalInfo?: {
  language?: string
  platform?: string
  screenResolution?: string
  timezone?: string
  cookieEnabled?: boolean
}): DeviceFingerprint {
  const fingerprint: DeviceFingerprint = {
    userAgent: userAgent || 'unknown',
    language: additionalInfo?.language || 'unknown',
    platform: additionalInfo?.platform || 'unknown',
    screenResolution: additionalInfo?.screenResolution,
    timezone: additionalInfo?.timezone,
    cookieEnabled: additionalInfo?.cookieEnabled ?? true,
    hash: '',
  }

  // Generate hash from fingerprint data
  const fingerprintString = [
    fingerprint.userAgent,
    fingerprint.language,
    fingerprint.platform,
    fingerprint.screenResolution,
    fingerprint.timezone,
    fingerprint.cookieEnabled,
  ].filter(Boolean).join('|')

  // Simple hash (in production, use crypto.createHash)
  let hash = 0
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  fingerprint.hash = Math.abs(hash).toString(36)

  return fingerprint
}

/**
 * Get device name from user agent
 */
export function getDeviceName(userAgent: string): string {
  if (!userAgent) return 'Unknown Device'

  // Simple device detection
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    if (userAgent.includes('iPhone')) return 'iPhone'
    if (userAgent.includes('iPad')) return 'iPad'
    if (userAgent.includes('Android')) {
      // Try to extract Android device name
      const match = userAgent.match(/Android.*?; (.*?)\)/)
      if (match && match[1]) {
        return match[1].trim()
      }
      return 'Android Device'
    }
    return 'Mobile Device'
  }

  if (userAgent.includes('Windows')) {
    if (userAgent.includes('Windows NT 10.0')) return 'Windows 10/11'
    if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1'
    if (userAgent.includes('Windows NT 6.2')) return 'Windows 8'
    if (userAgent.includes('Windows NT 6.1')) return 'Windows 7'
    return 'Windows'
  }

  if (userAgent.includes('Mac OS X')) {
    return 'Mac'
  }

  if (userAgent.includes('Linux')) {
    return 'Linux'
  }

  if (userAgent.includes('Chrome')) return 'Chrome Browser'
  if (userAgent.includes('Firefox')) return 'Firefox Browser'
  if (userAgent.includes('Safari')) return 'Safari Browser'
  if (userAgent.includes('Edge')) return 'Edge Browser'

  return 'Unknown Device'
}

/**
 * Get browser name from user agent
 */
export function getBrowserName(userAgent: string): string {
  if (!userAgent) return 'Unknown'

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edg')) return 'Edge'
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera'

  return 'Unknown Browser'
}
