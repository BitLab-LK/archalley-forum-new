// Test component to verify privacy settings behavior
"use client"

import { useState } from "react"
import { shouldShowField, type PrivacyContext, type PrivacyLevel } from "@/lib/privacy-utils"

interface TestScenario {
  name: string
  privacy: PrivacyLevel
  context: PrivacyContext
  expectedResult: boolean
}

export default function PrivacyTestComponent() {
  // Removed unused state variables for selectedScenario and setSelectedScenario

  const testScenarios: TestScenario[] = [
    // Test case 1: Public field - Everyone should see it
    {
      name: "Public Email - Logged in user viewing",
      privacy: "EVERYONE",
      context: { isOwnProfile: false, viewerIsAuthenticated: true, viewerIsMember: true },
      expectedResult: true
    },
    {
      name: "Public Email - Guest user viewing",
      privacy: "EVERYONE", 
      context: { isOwnProfile: false, viewerIsAuthenticated: false, viewerIsMember: false },
      expectedResult: true
    },

    // Test case 2: Members Only field
    {
      name: "Members Only Phone - Logged in member viewing",
      privacy: "MEMBERS_ONLY",
      context: { isOwnProfile: false, viewerIsAuthenticated: true, viewerIsMember: true },
      expectedResult: true
    },
    {
      name: "Members Only Phone - Guest user viewing",
      privacy: "MEMBERS_ONLY",
      context: { isOwnProfile: false, viewerIsAuthenticated: false, viewerIsMember: false },
      expectedResult: false
    },

    // Test case 3: Private field (Only Me)
    {
      name: "Private Profile Photo - Owner viewing",
      privacy: "ONLY_ME",
      context: { isOwnProfile: true, viewerIsAuthenticated: true, viewerIsMember: true },
      expectedResult: true
    },
    {
      name: "Private Profile Photo - Other user viewing",
      privacy: "ONLY_ME",
      context: { isOwnProfile: false, viewerIsAuthenticated: true, viewerIsMember: true },
      expectedResult: false
    },
    {
      name: "Private Profile Photo - Guest viewing",
      privacy: "ONLY_ME",
      context: { isOwnProfile: false, viewerIsAuthenticated: false, viewerIsMember: false },
      expectedResult: false
    },

    // Test case 4: Owner always sees their own fields
    {
      name: "Own Private Field - Owner viewing",
      privacy: "ONLY_ME",
      context: { isOwnProfile: true, viewerIsAuthenticated: true, viewerIsMember: true },
      expectedResult: true
    },
    {
      name: "Own Members Only Field - Owner viewing",
      privacy: "MEMBERS_ONLY",
      context: { isOwnProfile: true, viewerIsAuthenticated: true, viewerIsMember: true },
      expectedResult: true
    }
  ]

  const runTest = (scenario: TestScenario) => {
    const result = shouldShowField(scenario.privacy, scenario.context)
    return result === scenario.expectedResult
  }

  const runAllTests = () => {
    return testScenarios.map((scenario, index) => ({
      index,
      scenario,
      result: runTest(scenario),
      actualResult: shouldShowField(scenario.privacy, scenario.context)
    }))
  }

  const testResults = runAllTests()
  const allTestsPassed = testResults.every(test => test.result)

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Privacy Settings Verification Tests
      </h2>

      <div className="mb-6">
        <div className={`p-4 rounded-lg ${allTestsPassed ? 'bg-green-100 dark:bg-green-900 border-green-500' : 'bg-red-100 dark:bg-red-900 border-red-500'} border-2`}>
          <h3 className={`text-lg font-semibold ${allTestsPassed ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
            {allTestsPassed ? '✅ All Tests Passed' : '❌ Some Tests Failed'}
          </h3>
          <p className={`${allTestsPassed ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
            {testResults.filter(test => test.result).length} / {testResults.length} tests passed
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {testResults.map((test, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${
              test.result 
                ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {test.result ? '✅' : '❌'} {test.scenario.name}
              </h4>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                test.result 
                  ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' 
                  : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
              }`}>
                {test.result ? 'PASS' : 'FAIL'}
              </span>
            </div>
            
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Privacy Level:</strong> {test.scenario.privacy}</p>
              <p><strong>Context:</strong> {JSON.stringify(test.scenario.context)}</p>
              <p><strong>Expected:</strong> {test.scenario.expectedResult ? 'Show' : 'Hide'}</p>
              <p><strong>Actual:</strong> {test.actualResult ? 'Show' : 'Hide'}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Privacy Rules Summary:
        </h3>
        <ul className="space-y-1 text-blue-700 dark:text-blue-300 text-sm">
          <li><strong>EVERYONE:</strong> Visible to all users (logged in or guest)</li>
          <li><strong>MEMBERS_ONLY:</strong> Visible only to authenticated/logged-in users</li>
          <li><strong>ONLY_ME:</strong> Visible only to the profile owner</li>
          <li><strong>Profile Owner:</strong> Always sees their own fields regardless of privacy setting</li>
        </ul>
      </div>
    </div>
  )
}
