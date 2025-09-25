# Super Admin Role-Based Access Control (RBAC) Implementation

## Overview

This implementation adds a comprehensive role-based access control system with **SUPER_ADMIN** privileges for user management operations, following security best practices and the principle of least privilege.

## Role Hierarchy

```
SUPER_ADMIN    → Full privileges (user management, role assignment, user deletion)
    ↓
  ADMIN        → Dashboard access, content management (NO user management)
    ↓
MODERATOR      → Content moderation
    ↓
  MEMBER       → Basic user privileges
```

## Security Architecture

### 1. **Database Schema Changes**
- Added `SUPER_ADMIN` to `UserRole` enum in Prisma schema
- Maintains backward compatibility with existing roles

### 2. **Super Admin Utilities (`/lib/super-admin-utils.ts`)**
```typescript
// Check comprehensive privileges
const privileges = checkSuperAdminPrivileges(user)
console.log(privileges)
// {
//   isSuperAdmin: true,
//   isAdmin: true,
//   canManageUsers: true,
//   canDeleteUsers: true,
//   canModifyRoles: true
// }
```

### 3. **API Security Enforcement**

#### Protected Operations (Super Admin Only):
- **User Role Updates**: Only super admins can change user roles
- **User Deletion**: Only super admins can delete users
- **Super Admin Creation**: Only super admins can assign super admin role

#### Security Validations:
```typescript
// Prevent privilege escalation
if (role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
  return new NextResponse("Only super admins can assign super admin role", { status: 403 })
}

// Prevent targeting other super admins
if (targetUser?.role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
  return new NextResponse("Only super admins can modify super admin accounts", { status: 403 })
}
```

### 4. **UI Access Controls**

#### Dashboard Features:
- **Role Selection Dropdown**: Super admin role only visible to super admins
- **Delete Buttons**: Disabled for non-super-admins with tooltip explanations
- **Privilege Indicators**: Clear visual indication of current user's permissions

#### Security Visual Cues:
- 🔴 **Red Badge**: SUPER_ADMIN (highest privilege)
- 🟡 **Yellow Badge**: ADMIN (limited privileges)
- **Disabled Controls**: Clear indication when actions require higher privileges

## Setup Instructions

### 1. **Database Migration**
```bash
# Generate Prisma client with new SUPER_ADMIN role
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add-super-admin-role
```

### 2. **Environment Configuration**
```bash
# Add to your .env file
INITIAL_SUPER_ADMIN_EMAIL=your-super-admin@example.com
```

### 3. **Initial Super Admin Setup**
```bash
# Run the setup script
npx ts-node scripts/setup-super-admin.ts
```

## Security Features

### 1. **Principle of Least Privilege**
- Regular admins can only access dashboard statistics and content management
- User management operations restricted to super admins only
- Clear separation of concerns between content and user management

### 2. **Self-Protection Mechanisms**
- Users cannot delete their own accounts
- Super admins cannot have their privileges removed by non-super-admins
- Comprehensive audit logging for all super admin operations

### 3. **Audit Trail**
```typescript
logSuperAdminOperation("DELETE_USER", performedBy, targetUserId, {
  targetUserRole: "ADMIN",
  targetUserEmail: "user@example.com",
  ip: "192.168.1.1"
})
```

### 4. **Input Validation & Sanitization**
- Strict role validation at API level
- Type-safe privilege checking
- Comprehensive error handling with meaningful messages

## Usage Examples

### 1. **Checking Privileges in Components**
```typescript
import { checkSuperAdminPrivileges } from '@/lib/super-admin-utils'

function UserManagement({ user }) {
  const privileges = checkSuperAdminPrivileges(user)
  
  return (
    <div>
      {privileges.canDeleteUsers && (
        <Button onClick={handleDelete}>Delete User</Button>
      )}
      {!privileges.canManageUsers && (
        <p>Super admin privileges required for user management</p>
      )}
    </div>
  )
}
```

### 2. **API Endpoint Protection**
```typescript
// Check super admin privileges
const validation = validateSuperAdminOperation(user, "DELETE_USER")
if (!validation.isValid) {
  return new NextResponse(validation.errorMessage, { status: 403 })
}
```

### 3. **Role Assignment Restrictions**
```typescript
// Only super admins can create other super admins
if (newRole === "SUPER_ADMIN" && !isSuperAdmin(currentUser)) {
  throw new Error("Insufficient privileges")
}
```

## Testing Checklist

### ✅ **Security Tests**
- [ ] Non-super-admins cannot access user management endpoints
- [ ] Non-super-admins cannot modify super admin accounts
- [ ] Users cannot escalate their own privileges
- [ ] Self-deletion is prevented
- [ ] Super admin role assignment is restricted

### ✅ **UI Tests**
- [ ] Role dropdowns show appropriate options based on privileges
- [ ] Delete buttons are disabled for non-super-admins
- [ ] Privilege indicators display correctly
- [ ] Tooltips explain required permissions

### ✅ **Functional Tests**
- [ ] Super admin can manage all users
- [ ] Super admin can assign any role including super admin
- [ ] Regular admin can access dashboard but not user management
- [ ] Audit logs capture all super admin operations

## Migration Path

### For Existing Admins:
1. Current `ADMIN` users retain dashboard access
2. User management features become read-only for regular admins
3. At least one `SUPER_ADMIN` must be designated for user management
4. Clear messaging explains the privilege changes

### Rollback Plan:
1. Remove `SUPER_ADMIN` checks from API endpoints
2. Revert UI controls to original admin-only checks
3. Update database schema to remove `SUPER_ADMIN` role
4. No data loss - only privilege restrictions are removed

## Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security (UI, API, Database)
2. **Fail Secure**: Operations fail closed when privileges are insufficient
3. **Audit Logging**: Comprehensive logging of all privileged operations
4. **Clear Error Messages**: Meaningful feedback for authorization failures
5. **Type Safety**: TypeScript ensures compile-time privilege validation
6. **Principle of Least Privilege**: Minimal permissions for each role level

## Compliance & Security

- ✅ **OWASP Compliance**: Follows broken access control prevention guidelines
- ✅ **Data Protection**: Prevents unauthorized access to user management functions
- ✅ **Audit Trail**: Complete logging for compliance and security investigations
- ✅ **Role Separation**: Clear separation between content and user management privileges

---

## Quick Start

1. **Update Schema**: Add `SUPER_ADMIN` to UserRole enum
2. **Set Environment**: Add `INITIAL_SUPER_ADMIN_EMAIL` to .env
3. **Run Migration**: `npx prisma migrate dev`
4. **Setup Super Admin**: `npx ts-node scripts/setup-super-admin.ts`
5. **Test**: Verify privilege restrictions work as expected

Your forum now has enterprise-grade role-based access control! 🔐