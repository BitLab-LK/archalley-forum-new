/**
 * Super Admin Utilities
 * Provides secure role-based access control for super admin privileges
 * Following security best practices and principle of least privilege
 */

import { UserRole } from "@prisma/client"

// Type definitions for better type safety
export interface UserWithRole {
  id: string
  role: UserRole
  email?: string
}

export interface SuperAdminCheck {
  isSuperAdmin: boolean
  isAdmin: boolean
  canManageUsers: boolean
  canDeleteUsers: boolean
  canModifyRoles: boolean
}

/**
 * Check if user has super admin privileges
 * @param user - User object with role
 * @returns SuperAdminCheck object with detailed permissions
 */
export function checkSuperAdminPrivileges(user: UserWithRole | null | undefined): SuperAdminCheck {
  const defaultCheck: SuperAdminCheck = {
    isSuperAdmin: false,
    isAdmin: false,
    canManageUsers: false,
    canDeleteUsers: false,
    canModifyRoles: false
  }

  if (!user) {
    return defaultCheck
  }

  const isSuperAdmin = (user.role as string) === "SUPER_ADMIN"
  const isAdmin = (user.role as string) === "ADMIN" || isSuperAdmin

  return {
    isSuperAdmin,
    isAdmin,
    canManageUsers: isSuperAdmin, // Only super admins can manage users
    canDeleteUsers: isSuperAdmin, // Only super admins can delete users
    canModifyRoles: isSuperAdmin  // Only super admins can modify user roles
  }
}

/**
 * Check if user can perform user management operations
 * @param user - User object with role
 * @returns boolean indicating if user can manage users
 */
export function canManageUsers(user: UserWithRole | null | undefined): boolean {
  return checkSuperAdminPrivileges(user).canManageUsers
}

/**
 * Check if user can delete other users
 * @param user - User object with role
 * @returns boolean indicating if user can delete users
 */
export function canDeleteUsers(user: UserWithRole | null | undefined): boolean {
  return checkSuperAdminPrivileges(user).canDeleteUsers
}

/**
 * Check if user can modify user roles
 * @param user - User object with role
 * @returns boolean indicating if user can modify roles
 */
export function canModifyUserRoles(user: UserWithRole | null | undefined): boolean {
  return checkSuperAdminPrivileges(user).canModifyRoles
}

/**
 * Check if user has admin access (admin or super admin)
 * @param user - User object with role
 * @returns boolean indicating if user has admin access  
 */
export function hasAdminAccess(user: UserWithRole | null | undefined): boolean {
  return checkSuperAdminPrivileges(user).isAdmin
}

/**
 * Check if user is super admin
 * @param user - User object with role
 * @returns boolean indicating if user is super admin
 */
export function isSuperAdmin(user: UserWithRole | null | undefined): boolean {
  return checkSuperAdminPrivileges(user).isSuperAdmin
}

/**
 * Get user permission level as string for logging/debugging
 * @param user - User object with role
 * @returns string describing permission level
 */
export function getUserPermissionLevel(user: UserWithRole | null | undefined): string {
  if (!user) return "NO_ACCESS"
  
  const privileges = checkSuperAdminPrivileges(user)
  
  if (privileges.isSuperAdmin) return "SUPER_ADMIN"
  if (privileges.isAdmin) return "ADMIN"
  if ((user.role as string) === "MODERATOR") return "MODERATOR"
  if ((user.role as string) === "MEMBER") return "MEMBER"
  
  return "UNKNOWN"
}

/**
 * Validate super admin operation with detailed error messages
 * @param user - User object with role
 * @param operation - Operation being attempted
 * @returns validation result with error message if invalid
 */
export function validateSuperAdminOperation(
  user: UserWithRole | null | undefined, 
  operation: "MANAGE_USERS" | "DELETE_USER" | "MODIFY_ROLES"
): { isValid: boolean; errorMessage?: string; errorCode?: string } {
  if (!user) {
    return {
      isValid: false,
      errorMessage: "Authentication required",
      errorCode: "AUTH_REQUIRED"
    }
  }

  const privileges = checkSuperAdminPrivileges(user)

  switch (operation) {
    case "MANAGE_USERS":
      if (!privileges.canManageUsers) {
        return {
          isValid: false,
          errorMessage: "Super admin privileges required for user management",
          errorCode: "INSUFFICIENT_PRIVILEGES"
        }
      }
      break
    
    case "DELETE_USER":
      if (!privileges.canDeleteUsers) {
        return {
          isValid: false,
          errorMessage: "Super admin privileges required to delete users",
          errorCode: "INSUFFICIENT_PRIVILEGES"
        }
      }
      break
    
    case "MODIFY_ROLES":
      if (!privileges.canModifyRoles) {
        return {
          isValid: false,
          errorMessage: "Super admin privileges required to modify user roles",
          errorCode: "INSUFFICIENT_PRIVILEGES"
        }
      }
      break
    
    default:
      return {
        isValid: false,
        errorMessage: "Unknown operation",
        errorCode: "INVALID_OPERATION"
      }
  }

  return { isValid: true }
}

/**
 * Environment variable for initial super admin email
 * This should be set in production to bootstrap the first super admin
 */
export const INITIAL_SUPER_ADMIN_EMAIL = process.env.INITIAL_SUPER_ADMIN_EMAIL

/**
 * Check if email is the initial super admin
 * @param email - Email to check
 * @returns boolean indicating if email is initial super admin
 */
export function isInitialSuperAdmin(email: string | null | undefined): boolean {
  return !!(INITIAL_SUPER_ADMIN_EMAIL && email && email === INITIAL_SUPER_ADMIN_EMAIL)
}

/**
 * Security audit log for super admin operations
 * @param operation - Operation performed
 * @param performedBy - User who performed the operation
 * @param targetUser - User who was targeted (if applicable)
 * @param metadata - Additional metadata
 */
export function logSuperAdminOperation(
  operation: string,
  performedBy: string,
  targetUser?: string,
  metadata?: Record<string, any>
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    performedBy,
    targetUser,
    metadata,
    severity: "HIGH" // Super admin operations are always high severity
  }
  
  // In production, this should go to a secure audit log
  console.log("[SUPER_ADMIN_AUDIT]", JSON.stringify(logEntry))
}