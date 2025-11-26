/**
 * Role-based permission system for admin dashboard
 * Defines what each role can access and perform
 */

export type UserRole = 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'

export interface RolePermissions {
  // Dashboard Tab Access
  canViewStatistics: boolean
  canViewUsers: boolean
  canViewCategories: boolean
  canViewPosts: boolean
  canViewSettings: boolean
  canViewPermissions: boolean
  canViewAppearance: boolean
  canViewPages: boolean
  canViewAds: boolean
  canViewCompetitions: boolean
  
  // User Management
  canEditUsers: boolean
  canChangeUserRoles: boolean
  canDeleteUsers: boolean
  canViewUserDetails: boolean
  
  // Post Management
  canEditPosts: boolean
  canDeletePosts: boolean
  canPinPosts: boolean
  canLockPosts: boolean
  canHidePosts: boolean
  canApproveFlags: boolean
  
  // Reporting System
  canReportPosts: boolean           // Can report posts for review
  canViewReports: boolean           // Can view the moderation queue
  canReviewReports: boolean         // Can review and act on reports
  canEscalateReports: boolean       // Can escalate reports to higher authority
  canDismissReports: boolean        // Can dismiss reports as invalid
  canViewModerationQueue: boolean   // Can access moderation dashboard
  canViewModerationHistory: boolean // Can view history of moderation actions
  canPerformModerationActions: boolean // Can perform moderation actions
  
  // Category Management
  canCreateCategories: boolean
  canEditCategories: boolean
  canDeleteCategories: boolean
  
  // Settings & Configuration
  canChangeSettings: boolean
  canManagePermissions: boolean
  canCustomizeAppearance: boolean
  canManagePages: boolean
  
  // Advertisement Management
  canViewAdsPanel: boolean
  canCreateAds: boolean
  canEditAds: boolean
  canDeleteAds: boolean
  canToggleAds: boolean
  canViewAdStats: boolean
  
  // Advanced Actions
  canViewSystemStats: boolean
  canAccessDeveloperTools: boolean
  canPromoteToAdmin: boolean
}

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'MODERATOR':
      return {
        // Dashboard Tab Access - Limited access
        canViewStatistics: true,
        canViewUsers: true,
        canViewCategories: true,
        canViewPosts: true,
        canViewSettings: false,
        canViewPermissions: false,
        canViewAppearance: false,
        canViewPages: false,
        canViewCompetitions: true, // Moderators can view competitions
        
        // User Management - View only, limited actions
        canEditUsers: false,
        canChangeUserRoles: false,
        canDeleteUsers: false,
        canViewUserDetails: true,
        
        // Post Management - Moderators can only change visibility, not edit/delete
        canEditPosts: false,          // Only ADMIN and SUPER_ADMIN can edit posts
        canDeletePosts: false,        // Only ADMIN and SUPER_ADMIN can delete posts
        canPinPosts: true,
        canLockPosts: true,
        canHidePosts: true,           // Moderators can hide/unhide posts
        canApproveFlags: true,
        
        // Reporting System - Full moderation capabilities
        canReportPosts: true,                   // Can report posts like any user
        canViewReports: true,                   // Can access the moderation queue
        canReviewReports: true,                 // Can review and act on reports
        canEscalateReports: true,               // Can escalate complex cases
        canDismissReports: true,                // Can dismiss invalid reports
        canViewModerationQueue: true,           // Can access moderation dashboard
        canViewModerationHistory: true,         // Can view moderation history
        canPerformModerationActions: true,      // Can perform moderation actions
        
        // Category Management - Limited access for moderation
        canCreateCategories: true,
        canEditCategories: true,
        canDeleteCategories: false,
        
        // Settings & Configuration - No access
        canChangeSettings: false,
        canManagePermissions: false,
        canCustomizeAppearance: false,
        canManagePages: false,
        
        // Advertisement Management - View only
        canViewAds: false,
        canViewAdsPanel: false,
        canCreateAds: false,
        canEditAds: false,
        canDeleteAds: false,
        canToggleAds: false,
        canViewAdStats: false,
        
        // Advanced Actions - No access
        canViewSystemStats: false,
        canAccessDeveloperTools: false,
        canPromoteToAdmin: false,
      }

    case 'ADMIN':
      return {
        // Dashboard Tab Access - Full access except permissions, settings, appearance, and pages
        canViewStatistics: true,
        canViewUsers: true,
        canViewCategories: true,
        canViewPosts: true,
        canViewSettings: false,
        canViewPermissions: false, // Reserved for SUPER_ADMIN
        canViewAppearance: false,
        canViewPages: false,
        canViewCompetitions: true, // Admins have full competition access
        
        // User Management - Full except role changes
        canEditUsers: true,
        canChangeUserRoles: false, // Can't change roles
        canDeleteUsers: true,
        canViewUserDetails: true,
        
        // Post Management - Full access
        canEditPosts: true,
        canDeletePosts: true,
        canPinPosts: true,
        canLockPosts: true,
        canHidePosts: true,
        canApproveFlags: true,
        
        // Reporting System - Full access including escalation handling
        canReportPosts: true,                   // Can report posts like any user
        canViewReports: true,                   // Can access the moderation queue
        canReviewReports: true,                 // Can review and act on reports
        canEscalateReports: true,               // Can escalate to super admin
        canDismissReports: true,                // Can dismiss reports
        canViewModerationQueue: true,           // Full moderation queue access
        canViewModerationHistory: true,         // Can view all moderation history
        canPerformModerationActions: true,      // Can perform all moderation actions
        
        // Category Management - Full access
        canCreateCategories: true,
        canEditCategories: true,
        canDeleteCategories: true,
        
        // Settings & Configuration - No access to these features
        canChangeSettings: false,
        canManagePermissions: false, // Reserved for SUPER_ADMIN
        canCustomizeAppearance: false,
        canManagePages: false,
        
        // Advertisement Management - Full access
        canViewAds: true,
        canViewAdsPanel: true,
        canCreateAds: true,
        canEditAds: true,
        canDeleteAds: true,
        canToggleAds: true,
        canViewAdStats: true,
        
        // Advanced Actions - Limited
        canViewSystemStats: true,
        canAccessDeveloperTools: false,
        canPromoteToAdmin: false,
      }

    case 'SUPER_ADMIN':
      return {
        // Dashboard Tab Access - Full access except settings, appearance, and pages
        canViewStatistics: true,
        canViewUsers: true,
        canViewCategories: true,
        canViewPosts: true,
        canViewSettings: false,
        canViewPermissions: false,
        canViewAppearance: false,
        canViewPages: false,
        canViewCompetitions: true, // Super admins have full competition access
        
        // User Management - Full control
        canEditUsers: true,
        canChangeUserRoles: true,
        canDeleteUsers: true,
        canViewUserDetails: true,
        
        // Post Management - Full access
        canEditPosts: true,
        canDeletePosts: true,
        canPinPosts: true,
        canLockPosts: true,
        canHidePosts: true,
        canApproveFlags: true,
        
        // Reporting System - Ultimate authority
        canReportPosts: true,                   // Can report posts like any user
        canViewReports: true,                   // Can access all reports
        canReviewReports: true,                 // Can review and act on any report
        canEscalateReports: false,              // No need to escalate - highest authority
        canDismissReports: true,                // Can dismiss any report
        canViewModerationQueue: true,           // Full access to moderation systems
        canViewModerationHistory: true,         // Can view complete moderation history
        canPerformModerationActions: true,      // Can perform any moderation action
        
        // Category Management - Full access
        canCreateCategories: true,
        canEditCategories: true,
        canDeleteCategories: true,
        
        // Settings & Configuration - No access to these removed features
        canChangeSettings: false,
        canManagePermissions: false,
        canCustomizeAppearance: false,
        canManagePages: false,
        
        // Advertisement Management - Full access
        canViewAds: true,
        canViewAdsPanel: true,
        canCreateAds: true,
        canEditAds: true,
        canDeleteAds: true,
        canToggleAds: true,
        canViewAdStats: true,
        
        // Advanced Actions - Full access
        canViewSystemStats: true,
        canAccessDeveloperTools: true,
        canPromoteToAdmin: true,
      }

    default: // MEMBER or unknown
      return {
        canViewStatistics: false,
        canViewUsers: false,
        canViewCategories: false,
        canViewPosts: false,
        canViewSettings: false,
        canViewPermissions: false,
        canViewAppearance: false,
        canViewPages: false,
        canViewCompetitions: false, // Members cannot access admin competitions
        canEditUsers: false,
        canChangeUserRoles: false,
        canDeleteUsers: false,
        canViewUserDetails: false,
        canEditPosts: false,
        canDeletePosts: false,
        canPinPosts: false,
        canLockPosts: false,
        canHidePosts: false,
        canApproveFlags: false,
        
        // Reporting System - Members can only report
        canReportPosts: true,                   // Members can report inappropriate content
        canViewReports: false,                  // Cannot access moderation queue
        canReviewReports: false,                // Cannot review reports
        canEscalateReports: false,              // Cannot escalate reports
        canDismissReports: false,               // Cannot dismiss reports
        canViewModerationQueue: false,          // No access to moderation queue
        canViewModerationHistory: false,        // Cannot view moderation history
        canPerformModerationActions: false,     // Cannot perform moderation actions
        
        canCreateCategories: false,
        canEditCategories: false,
        canDeleteCategories: false,
        canChangeSettings: false,
        canManagePermissions: false,
        canCustomizeAppearance: false,
        canManagePages: false,
        
        // Advertisement Management - No access
        canViewAds: false,
        canViewAdsPanel: false,
        canCreateAds: false,
        canEditAds: false,
        canDeleteAds: false,
        canToggleAds: false,
        canViewAdStats: false,
        
        canViewSystemStats: false,
        canAccessDeveloperTools: false,
        canPromoteToAdmin: false,
      }
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: UserRole, permission: keyof RolePermissions): boolean {
  const permissions = getRolePermissions(userRole)
  return permissions[permission]
}

/**
 * Get available tabs for a role
 */
export function getAvailableTabs(userRole: UserRole): string[] {
  const permissions = getRolePermissions(userRole)
  const tabs: string[] = []
  
  if (permissions.canViewStatistics) tabs.push('statistics')
  if (permissions.canViewUsers) tabs.push('users')
  if (permissions.canViewCategories) tabs.push('categories')
  if (permissions.canViewPosts) tabs.push('posts')
  if (permissions.canViewCompetitions) tabs.push('competitions')
  if (permissions.canViewCompetitions) tabs.push('submissions')
  if (permissions.canViewAds) tabs.push('ads')
  if (permissions.canViewSettings) tabs.push('settings')
  if (permissions.canViewPermissions) tabs.push('permissions')
  if (permissions.canViewAppearance) tabs.push('appearance')
  if (permissions.canViewPages) tabs.push('pages')
  
  return tabs
}

/**
 * Get default tab for a role (first available tab)
 */
export function getDefaultTab(userRole: UserRole): string {
  const availableTabs = getAvailableTabs(userRole)
  return availableTabs[0] || 'posts' // Default to posts if no tabs available
}

/**
 * Role hierarchy check
 */
export function isHigherRole(userRole: UserRole, targetRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    'MEMBER': 0,
    'MODERATOR': 1,
    'ADMIN': 2,
    'SUPER_ADMIN': 3
  }
  
  return hierarchy[userRole] > hierarchy[targetRole]
}

/**
 * Get role display information
 */
export function getRoleInfo(role: UserRole) {
  switch (role) {
    case 'MODERATOR':
      return {
        name: 'Moderator',
        description: 'Can moderate posts and users, handle flags',
        color: 'blue',
        icon: ''
      }
    case 'ADMIN':
      return {
        name: 'Administrator',
        description: 'Full access except user roles and permissions',
        color: 'purple',
        icon: ''
      }
    case 'SUPER_ADMIN':
      return {
        name: 'Super Administrator',
        description: 'Complete system control and access',
        color: 'red',
        icon: ''
      }
    default:
      return {
        name: 'Member',
        description: 'Regular forum member',
        color: 'gray',
        icon: ''
      }
  }
}