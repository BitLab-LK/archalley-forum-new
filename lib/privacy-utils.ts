// Privacy utility functions for user profile visibility

export type PrivacyLevel = "EVERYONE" | "MEMBERS_ONLY" | "ONLY_ME"

export interface PrivacyContext {
  isOwnProfile: boolean
  viewerIsAuthenticated: boolean
  viewerIsMember?: boolean
}

/**
 * Determines if a field should be visible based on privacy settings
 */
export function shouldShowField(
  privacy: PrivacyLevel,
  context: PrivacyContext
): boolean {
  const { isOwnProfile, viewerIsAuthenticated, viewerIsMember = true } = context

  // Owner can always see their own fields
  if (isOwnProfile) return true

  switch (privacy) {
    case "EVERYONE":
      return true
    case "MEMBERS_ONLY":
      return viewerIsAuthenticated && viewerIsMember
    case "ONLY_ME":
      return false
    default:
      return true // Default to visible for unknown privacy levels
  }
}

/**
 * Get privacy display text for UI
 */
export function getPrivacyDisplayText(privacy: PrivacyLevel): string {
  switch (privacy) {
    case "EVERYONE":
      return "Everyone"
    case "MEMBERS_ONLY":
      return "Members Only"
    case "ONLY_ME":
      return "Only Me"
    default:
      return "Everyone"
  }
}

/**
 * Get privacy icon for UI
 */
export function getPrivacyIcon(privacy: PrivacyLevel): string {
  switch (privacy) {
    case "EVERYONE":
      return "👥" // Public
    case "MEMBERS_ONLY":
      return "🔒" // Members only
    case "ONLY_ME":
      return "🚫" // Private
    default:
      return "👥"
  }
}
