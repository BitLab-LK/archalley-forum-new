// Debug component to help troubleshoot production issues
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DeploymentDebugger() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const testResults: any = {}

    // Test 1: Auth status
    try {
      const response = await fetch('/api/debug/auth')
      testResults.auth = {
        status: response.status,
        data: await response.json()
      }
    } catch (error) {
      testResults.auth = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 2: Categories
    try {
      const response = await fetch('/api/categories')
      testResults.categories = {
        status: response.status,
        data: await response.json()
      }
    } catch (error) {
      testResults.categories = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 3: Posts GET
    try {
      const response = await fetch('/api/posts?limit=1')
      testResults.postsGet = {
        status: response.status,
        data: await response.json()
      }
    } catch (error) {
      testResults.postsGet = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 4: Simple POST test (should always work)
    try {
      const response = await fetch('/api/test/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'test data'
      })
      
      const responseText = await response.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { rawResponse: responseText.substring(0, 500) }
      }

      testResults.simplePost = {
        status: response.status,
        data: data
      }
    } catch (error) {
      testResults.simplePost = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 5: Posts POST (should fail if not authenticated)
    try {
      const formData = new FormData()
      formData.append('content', 'Test post')
      formData.append('categoryId', 'test')
      formData.append('isAnonymous', 'false')
      formData.append('tags', '[]')

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData
      })
      
      const responseText = await response.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { rawResponse: responseText.substring(0, 500) }
      }

      testResults.postsPost = {
        status: response.status,
        data: data
      }
    } catch (error) {
      testResults.postsPost = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    setResults(testResults)
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Deployment Debugger</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={loading} className="mb-4">
            {loading ? "Running Tests..." : "Run Diagnostic Tests"}
          </Button>

          {Object.keys(results).length > 0 && (
            <div className="space-y-4">
              {Object.entries(results).map(([test, result]: [string, any]) => (
                <Card key={test} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <h3 className="font-semibold capitalize">{test} Test</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className={`px-2 py-1 rounded text-sm ${
                        result.status === 200 || result.status === 401 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        Status: {result.status}
                      </div>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                        {JSON.stringify(result.data || result.error, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-red-600">Error: "Unexpected token '&lt;', "&lt;!DOCTYPE "... is not valid JSON"</h4>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>Middleware is returning HTML login page instead of JSON error</li>
              <li>API route is crashing and showing Next.js error page</li>
              <li>Authentication session is not working in production</li>
              <li>Environment variables are missing or incorrect</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-blue-600">Expected Test Results:</h4>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li><strong>Auth Test:</strong> Should return 200 with session info</li>
              <li><strong>Categories Test:</strong> Should return 200 with categories list</li>
              <li><strong>Posts GET Test:</strong> Should return 200 with posts array</li>
              <li><strong>Simple POST Test:</strong> Should return 200 with success message</li>
              <li><strong>Posts POST Test:</strong> Should return 401 if not logged in, or 201/400 if successful</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
