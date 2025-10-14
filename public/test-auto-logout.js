/**
 * Test script to verify auto-logout functionality
 * This can be run in browser console to test session invalidation
 */

// Test session monitoring functionality
async function testSessionMonitoring() {
  console.log('🧪 Testing session monitoring...')
  
  try {
    // Check current session
    const response = await fetch('/api/auth/session-check', {
      method: 'GET',
      credentials: 'include'
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Session is valid:', data)
    } else {
      console.log('❌ Session is invalid:', data)
      
      if (data.requiresReauth) {
        console.log('🔐 Session invalidated due to role change')
      }
    }
    
  } catch (error) {
    console.error('❌ Session check failed:', error)
  }
}

// Simulate role change (admin only)
async function simulateRoleChange(userId, newRole) {
  console.log(`🧪 Simulating role change for user ${userId} to ${newRole}`)
  
  try {
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        userId: userId,
        role: newRole
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Role updated successfully:', data)
      console.log('🔐 User sessions should now be invalidated')
    } else {
      console.error('❌ Role update failed:', data)
    }
    
  } catch (error) {
    console.error('❌ Role update error:', error)
  }
}

console.log('Auto-logout test functions loaded:')
console.log('- testSessionMonitoring(): Check current session validity')
console.log('- simulateRoleChange(userId, newRole): Simulate role change (admin only)')
console.log('')
console.log('Example usage:')
console.log('testSessionMonitoring()')
console.log('simulateRoleChange("user-id", "MODERATOR")')