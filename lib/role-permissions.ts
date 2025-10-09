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
  
  // Category Management
  canCreateCategories: boolean
  canEditCategories: boolean
  canDeleteCategories: boolean
  
  // Settings & Configuration
  canChangeSettings: boolean
  canManagePermissions: boolean
  canCustomizeAppearance: boolean
  canManagePages: boolean
  
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
        canViewCategories: false,
        canViewPosts: true,
        canViewSettings: false,
        canViewPermissions: false,
        canViewAppearance: false,
        canViewPages: false,
        
        // User Management - View only, limited actions
        canEditUsers: false,
        canChangeUserRoles: false,
        canDeleteUsers: false,
        canViewUserDetails: true,
        
        // Post Management - Full moderation powers
        canEditPosts: true,
        canDeletePosts: true,
        canPinPosts: true,
        canLockPosts: true,
        canHidePosts: true,
        canApproveFlags: true,
        
        // Category Management - No access
        canCreateCategories: false,
        canEditCategories: false,
        canDeleteCategories: false,
        
        // Settings & Configuration - No access
        canChangeSettings: false,
        canManagePermissions: false,
        canCustomizeAppearance: false,
        canManagePages: false,
        
        // Advanced Actions - No access
        canViewSystemStats: false,
        canAccessDeveloperTools: false,
        canPromoteToAdmin: false,
      }

    case 'ADMIN':
      return {
        // Dashboard Tab Access - Full access except permissions
        canViewStatistics: true,
        canViewUsers: true,
        canViewCategories: true,
        canViewPosts: true,
        canViewSettings: true,
        canViewPermissions: false, // Reserved for SUPER_ADMIN
        canViewAppearance: true,
        canViewPages: true,
        
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
        
        // Category Management - Full access
        canCreateCategories: true,
        canEditCategories: true,
        canDeleteCategories: true,
        
        // Settings & Configuration - Full except permissions
        canChangeSettings: true,
        canManagePermissions: false, // Reserved for SUPER_ADMIN
        canCustomizeAppearance: true,
        canManagePages: true,
        
        // Advanced Actions - Limited
        canViewSystemStats: true,
        canAccessDeveloperTools: false,
        canPromoteToAdmin: false,
      }

    case 'SUPER_ADMIN':
      return {
        // Dashboard Tab Access - Full access to everything
        canViewStatistics: true,
        canViewUsers: true,
        canViewCategories: true,
        canViewPosts: true,
        canViewSettings: true,
        canViewPermissions: true,
        canViewAppearance: true,
        canViewPages: true,
        
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
        
        // Category Management - Full access
        canCreateCategories: true,
        canEditCategories: true,
        canDeleteCategories: true,
        
        // Settings & Configuration - Full access
        canChangeSettings: true,
        canManagePermissions: true,
        canCustomizeAppearance: true,
        canManagePages: true,
        
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
        canCreateCategories: false,
        canEditCategories: false,
        canDeleteCategories: false,
        canChangeSettings: false,
        canManagePermissions: false,
        canCustomizeAppearance: false,
        canManagePages: false,
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
        icon: '🛡️'
      }
    case 'ADMIN':
      return {
        name: 'Administrator',
        description: 'Full access except user roles and permissions',
        color: 'purple',
        icon: '👑'
      }
    case 'SUPER_ADMIN':
      return {
        name: 'Super Administrator',
        description: 'Complete system control and access',
        color: 'red',
        icon: '⚡'
      }
    default:
      return {
        name: 'Member',
        description: 'Regular forum member',
        color: 'gray',
        icon: '👤'
      }
  }
}