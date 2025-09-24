/**
 * Admin Access Control Test Script
 * 
 * This script helps verify the security implementation of admin access control.
 * Run in browser console or as a separate test file.
 */

class AdminSecurityTester {
  constructor() {
    this.baseUrl = window.location.origin
    this.testResults = []
  }

  async runAllTests() {
    console.log("🔍 Starting Admin Security Tests...")
    
    await this.testUnauthorizedAccess()
    await this.testAPIEndpointSecurity()
    await this.testClientSideProtection()
    await this.testSessionValidation()
    
    this.printResults()
  }

  async testUnauthorizedAccess() {
    console.log("🧪 Testing unauthorized access to /admin")
    
    try {
      // Test direct navigation to admin without auth
      const adminResponse = await fetch(`${this.baseUrl}/admin`, {
        method: 'GET',
        credentials: 'same-origin'
      })
      
      // Should redirect to home or return 401/403
      this.recordTest(
        "Unauthorized admin access",
        adminResponse.status !== 200 || adminResponse.redirected,
        `Status: ${adminResponse.status}, Redirected: ${adminResponse.redirected}`
      )
    } catch (error) {
      this.recordTest("Unauthorized admin access", false, `Error: ${error.message}`)
    }
  }

  async testAPIEndpointSecurity() {
    console.log("🧪 Testing API endpoint security")
    
    const endpoints = [
      '/api/admin/stats',
      '/api/admin/users',
      '/api/admin/settings',
      '/api/admin/pages'
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          credentials: 'same-origin'
        })
        
        // Should return 401 or 403 for unauthorized access
        this.recordTest(
          `API Security: ${endpoint}`,
          response.status === 401 || response.status === 403,
          `Status: ${response.status}`
        )
      } catch (error) {
        this.recordTest(`API Security: ${endpoint}`, false, `Error: ${error.message}`)
      }
    }
  }

  async testClientSideProtection() {
    console.log("🧪 Testing client-side protection")
    
    // Check if admin content is hidden from DOM
    const adminElements = document.querySelectorAll('[data-admin-only]')
    const hasAdminContent = adminElements.length > 0
    
    this.recordTest(
      "Client-side content protection",
      !hasAdminContent || this.isUserAdmin(),
      `Found ${adminElements.length} admin elements`
    )
  }

  async testSessionValidation() {
    console.log("🧪 Testing session validation")
    
    try {
      // Test with invalid/expired session
      const response = await fetch(`${this.baseUrl}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })
      
      this.recordTest(
        "Invalid session handling",
        response.status === 401 || response.status === 403,
        `Status: ${response.status}`
      )
    } catch (error) {
      this.recordTest("Invalid session handling", false, `Error: ${error.message}`)
    }
  }

  isUserAdmin() {
    // Check if current user is admin (this would be replaced with actual auth check)
    const user = window.localStorage.getItem('user')
    return user && JSON.parse(user).role === 'ADMIN'
  }

  recordTest(testName, passed, details) {
    this.testResults.push({
      name: testName,
      status: passed ? '✅ PASS' : '❌ FAIL',
      details: details
    })
  }

  printResults() {
    console.log("\n📊 Admin Security Test Results:")
    console.log("=" * 50)
    
    this.testResults.forEach(result => {
      console.log(`${result.status} ${result.name}`)
      if (result.details) {
        console.log(`   Details: ${result.details}`)
      }
    })
    
    const passedTests = this.testResults.filter(r => r.status.includes('PASS')).length
    const totalTests = this.testResults.length
    
    console.log(`\n📈 Summary: ${passedTests}/${totalTests} tests passed`)
    
    if (passedTests === totalTests) {
      console.log("🎉 All security tests passed!")
    } else {
      console.log("⚠️ Some security tests failed. Please review the implementation.")
    }
  }
}

// Usage instructions:
// 1. Open browser developer tools
// 2. Navigate to your forum homepage
// 3. Paste this code in console
// 4. Run: new AdminSecurityTester().runAllTests()

console.log("Admin Security Tester loaded. Run with: new AdminSecurityTester().runAllTests()")

export default AdminSecurityTester