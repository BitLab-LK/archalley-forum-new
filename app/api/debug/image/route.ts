import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')
  
  if (!imageUrl) {
    return NextResponse.json({
      error: "No URL provided",
      usage: "Add ?url=<image_url> to test if an image URL is accessible"
    }, { status: 400 })
  }

  try {
    console.log('🔍 Testing image URL:', imageUrl)
    
    // Try to fetch the image to check if it's accessible
    const response = await fetch(imageUrl, {
      method: 'HEAD', // Just get headers to check if accessible
    })
    
    const result = {
      url: imageUrl,
      status: response.status,
      statusText: response.statusText,
      accessible: response.ok,
      headers: {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
        'cache-control': response.headers.get('cache-control'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Image test result:', result)
    
    return NextResponse.json(result)
  } catch (error) {
    const result = {
      url: imageUrl,
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
    
    console.error('❌ Image test failed:', result)
    
    return NextResponse.json(result, { status: 500 })
  }
}
