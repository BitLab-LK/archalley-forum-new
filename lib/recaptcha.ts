/**
 * reCAPTCHA v3 verification
 * This file handles reCAPTCHA verification for registration and other sensitive operations
 */

export interface RecaptchaVerificationResult {
  success: boolean
  score?: number
  action?: string
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
}

/**
 * Verify reCAPTCHA v3 token
 * @param token - The reCAPTCHA token from the client
 * @param action - The action name (e.g., 'register', 'login')
 * @returns Verification result
 */
export async function verifyRecaptcha(
  token: string,
  action: string = 'register'
): Promise<RecaptchaVerificationResult> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  // If reCAPTCHA is not configured, allow the request (for development)
  if (!secretKey || secretKey === 'your-recaptcha-secret-key') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ reCAPTCHA not configured - allowing request in development mode')
      return { success: true, score: 0.9, action }
    }
    // In production, if not configured, we should still allow but log a warning
    console.warn('⚠️ reCAPTCHA not configured - request allowed but not verified')
    return { success: true, score: 0.5, action }
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data: RecaptchaVerificationResult = await response.json()

    // Check if the action matches
    if (data.action && data.action !== action) {
      console.warn(`reCAPTCHA action mismatch: expected ${action}, got ${data.action}`)
      return { ...data, success: false }
    }

    // Check score (reCAPTCHA v3 returns a score from 0.0 to 1.0)
    // Lower scores indicate more suspicious activity
    // Typical threshold is 0.5, but we'll use 0.3 for better user experience
    const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.3')
    
    if (data.score !== undefined && data.score < minScore) {
      console.warn(`reCAPTCHA score too low: ${data.score} (minimum: ${minScore})`)
      return { ...data, success: false }
    }

    return data
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    // On error, we'll allow the request but log it
    // In production, you might want to be more strict
    return {
      success: false,
      'error-codes': ['network-error'],
    }
  }
}

/**
 * Check if reCAPTCHA is enabled
 */
export function isRecaptchaEnabled(): boolean {
  return !!(
    process.env.RECAPTCHA_SECRET_KEY &&
    process.env.RECAPTCHA_SECRET_KEY !== 'your-recaptcha-secret-key' &&
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY &&
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY !== 'your-recaptcha-site-key'
  )
}
