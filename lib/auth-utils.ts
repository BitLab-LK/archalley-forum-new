/**
 * Utility functions for authentication and redirect handling
 */

const SESSION_STORAGE_KEY = 'archalley-last-url'

/**
 * Save the current URL to sessionStorage before redirecting to login/register
 */
export function saveLastUrl(): void {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname + window.location.search
    // Don't save auth pages as last URL
    if (!currentPath.startsWith('/auth/') && !currentPath.startsWith('/api/')) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, currentPath)
    }
  }
}

/**
 * Get the last URL from sessionStorage
 */
export function getLastUrl(): string {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) || '/'
  }
  return '/'
}

/**
 * Clear the last URL from sessionStorage
 */
export function clearLastUrl(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

/**
 * Redirect to last URL and clear it
 */
export function redirectToLastUrl(): void {
  if (typeof window !== 'undefined') {
    const lastUrl = getLastUrl()
    clearLastUrl()
    window.location.href = lastUrl
  }
}

