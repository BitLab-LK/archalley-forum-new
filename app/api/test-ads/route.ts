import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log('🧪 Testing ads API...')
    
    // Test the main ads API
    const response = await fetch('http://localhost:3000/api/ads?action=bySize&size=970x180')
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      testResults: {
        apiResponse: data,
        timestamp: new Date().toISOString(),
        requestedSize: '970x180'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}