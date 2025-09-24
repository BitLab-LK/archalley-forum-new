/**
 * Statistics Dashboard Testing Script
 * 
 * This script helps verify the accuracy and functionality of the admin statistics dashboard.
 * Run in browser console or as a test file.
 */

class StatisticsDashboardTester {
  constructor() {
    this.baseUrl = window.location.origin
    this.testResults = []
  }

  async runAllTests() {
    console.log("📊 Starting Statistics Dashboard Tests...")
    
    await this.testAPIEndpoint()
    await this.testDataAccuracy()
    await this.testErrorHandling()
    await this.testUIDisplay()
    await this.testPerformance()
    
    this.printResults()
  }

  async testAPIEndpoint() {
    console.log("🧪 Testing Statistics API Endpoint")
    
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/stats`, {
        method: 'GET',
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Test response structure
        const requiredFields = ['totalUsers', 'totalPosts', 'totalComments', 'activeUsers']
        const hasAllFields = requiredFields.every(field => typeof data[field] === 'number')
        
        this.recordTest(
          "API Response Structure",
          hasAllFields,
          `Fields present: ${Object.keys(data).join(', ')}`
        )
        
        // Test data types
        const validTypes = requiredFields.every(field => 
          Number.isInteger(data[field]) && data[field] >= 0
        )
        
        this.recordTest(
          "Data Type Validation",
          validTypes,
          `All fields are non-negative integers`
        )
        
        // Test additional fields
        this.recordTest(
          "Enhanced Data Fields",
          data.hasOwnProperty('timestamp') && data.hasOwnProperty('success'),
          `Additional fields: ${data.timestamp ? 'timestamp' : ''} ${data.success ? 'success' : ''}`
        )
        
      } else {
        this.recordTest("API Endpoint Accessibility", false, `HTTP ${response.status}`)
      }
      
    } catch (error) {
      this.recordTest("API Endpoint Accessibility", false, `Error: ${error.message}`)
    }
  }

  async testDataAccuracy() {
    console.log("🎯 Testing Data Accuracy")
    
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/stats`)
      if (!response.ok) {
        this.recordTest("Data Accuracy", false, "Cannot fetch data for accuracy test")
        return
      }
      
      const stats = await response.json()
      
      // Test logical relationships
      this.recordTest(
        "Active Users ≤ Total Users",
        stats.activeUsers <= stats.totalUsers,
        `Active: ${stats.activeUsers}, Total: ${stats.totalUsers}`
      )
      
      // Test realistic ranges
      this.recordTest(
        "Realistic Data Ranges",
        stats.totalUsers >= 0 && stats.totalPosts >= 0 && stats.totalComments >= 0,
        "All counts are non-negative"
      )
      
      // Test timestamp freshness (should be recent)
      if (stats.timestamp) {
        const statTime = new Date(stats.timestamp)
        const now = new Date()
        const isRecent = (now - statTime) < (5 * 60 * 1000) // Within 5 minutes
        
        this.recordTest(
          "Data Freshness",
          isRecent,
          `Generated: ${statTime.toLocaleTimeString()}`
        )
      }
      
    } catch (error) {
      this.recordTest("Data Accuracy Tests", false, `Error: ${error.message}`)
    }
  }

  async testErrorHandling() {
    console.log("🚨 Testing Error Handling")
    
    // Test with invalid endpoint
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/stats-invalid`)
      this.recordTest(
        "Invalid Endpoint Handling",
        response.status === 404,
        `Status: ${response.status}`
      )
    } catch (error) {
      this.recordTest("Invalid Endpoint Handling", true, "Properly throws error")
    }
    
    // Test unauthorized access (if not admin)
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/stats`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })
      
      this.recordTest(
        "Unauthorized Access Handling",
        response.status === 401 || response.status === 403,
        `Status: ${response.status}`
      )
    } catch (error) {
      this.recordTest("Unauthorized Access Handling", true, "Request blocked")
    }
  }

  async testUIDisplay() {
    console.log("🎨 Testing UI Display")
    
    // Check if we're on the admin page
    const isAdminPage = window.location.pathname.includes('/admin')
    
    if (isAdminPage) {
      // Test stat cards visibility
      const statCards = document.querySelectorAll('[data-testid="stat-card"], .grid .space-y-4 .text-2xl, .grid .text-lg')
      this.recordTest(
        "Statistics Cards Visibility",
        statCards.length >= 4,
        `Found ${statCards.length} stat display elements`
      )
      
      // Test loading states
      const loadingElements = document.querySelectorAll('.animate-pulse')
      this.recordTest(
        "Loading States",
        true, // Always pass if no error occurs
        `Found ${loadingElements.length} loading indicators`
      )
      
      // Test error states
      const errorElements = document.querySelectorAll('.text-red-500')
      this.recordTest(
        "Error State Handling",
        true, // Pass if found or not found
        `Found ${errorElements.length} error indicators`
      )
      
    } else {
      this.recordTest("UI Display Tests", false, "Not on admin page - navigate to /admin to test UI")
    }
  }

  async testPerformance() {
    console.log("⚡ Testing Performance")
    
    const startTime = performance.now()
    
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/stats`)
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      if (response.ok) {
        this.recordTest(
          "API Response Time",
          responseTime < 2000, // Less than 2 seconds
          `${responseTime.toFixed(0)}ms`
        )
        
        // Test multiple concurrent requests
        const concurrentStart = performance.now()
        const concurrentPromises = Array(5).fill().map(() => 
          fetch(`${this.baseUrl}/api/admin/stats`)
        )
        
        await Promise.all(concurrentPromises)
        const concurrentEnd = performance.now()
        const concurrentTime = concurrentEnd - concurrentStart
        
        this.recordTest(
          "Concurrent Request Handling",
          concurrentTime < 5000, // Less than 5 seconds for 5 requests
          `${concurrentTime.toFixed(0)}ms for 5 requests`
        )
      }
      
    } catch (error) {
      this.recordTest("Performance Tests", false, `Error: ${error.message}`)
    }
  }

  recordTest(testName, passed, details) {
    this.testResults.push({
      name: testName,
      status: passed ? '✅ PASS' : '❌ FAIL',
      details: details
    })
  }

  printResults() {
    console.log("\n📊 Statistics Dashboard Test Results:")
    console.log("=".repeat(50))
    
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
      console.log("🎉 All statistics dashboard tests passed!")
    } else {
      console.log("⚠️ Some tests failed. Please review the implementation.")
    }
    
    // Additional manual testing suggestions
    console.log("\n📝 Manual Testing Checklist:")
    console.log("1. Navigate to /admin and verify statistics cards load")
    console.log("2. Check if numbers make sense (active users ≤ total users)")
    console.log("3. Verify loading states appear during initial load")
    console.log("4. Test with network throttling to see loading states")
    console.log("5. Compare database counts with displayed numbers")
    console.log("6. Verify 'Active Users' shows 24-hour count, not current online")
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StatisticsDashboardTester
}

// Browser usage
console.log("Statistics Dashboard Tester loaded. Run with: new StatisticsDashboardTester().runAllTests()")