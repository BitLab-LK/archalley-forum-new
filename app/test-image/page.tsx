"use client"

import { useState } from "react"
import Image from "next/image"

export default function ImageTestPage() {
  const [testUrl, setTestUrl] = useState("https://okxp5q9cgyoio1vt.public.blob.vercel-storage.com/1755598626730-architecture3-HkkJogYSk1BW9fRhxd80ScV9hlhlLG.webp")
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  const testDirectAccess = async () => {
    try {
      setLoading(true)
      const response = await fetch(testUrl, { method: 'HEAD' })
      console.log('Direct fetch test:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
    } catch (error) {
      console.error('Direct fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Image Loading Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Test Image URL:</label>
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex gap-4">
          <button 
            onClick={testDirectAccess}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Direct Access"}
          </button>
          
          <button 
            onClick={() => {
              setImageError(false)
              setImageLoaded(false)
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Reset Image Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next.js Image Component Test */}
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2">Next.js Image Component:</h3>
          <div className="relative w-full h-64 bg-gray-100 rounded">
            {!imageError ? (
              <Image
                src={testUrl}
                alt="Test image"
                fill
                className="object-contain"
                onError={(e) => {
                  console.error('Next.js Image failed:', e)
                  setImageError(true)
                }}
                onLoad={() => {
                  console.log('Next.js Image loaded successfully')
                  setImageLoaded(true)
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-red-500">
                ❌ Next.js Image failed to load
              </div>
            )}
          </div>
          <div className="mt-2 text-sm">
            Status: {imageError ? "❌ Failed" : imageLoaded ? "✅ Loaded" : "⏳ Loading..."}
          </div>
        </div>

        {/* Regular img tag test */}
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2">Regular IMG Tag:</h3>
          <div className="relative w-full h-64 bg-gray-100 rounded overflow-hidden">
            <img
              src={testUrl}
              alt="Test image"
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('Regular img failed:', e)
                e.currentTarget.style.display = 'none'
                const errorDiv = e.currentTarget.nextElementSibling as HTMLElement
                if (errorDiv) errorDiv.style.display = 'flex'
              }}
              onLoad={() => {
                console.log('Regular img loaded successfully')
              }}
            />
            <div className="absolute inset-0 hidden items-center justify-center text-red-500">
              ❌ Regular img failed to load
            </div>
          </div>
        </div>
      </div>

      {/* Browser direct test */}
      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-2">Direct Browser Test:</h3>
        <a 
          href={testUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          Open image in new tab
        </a>
      </div>

      {/* Console output */}
      <div className="border p-4 rounded bg-gray-50">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Open browser developer tools (F12)</li>
          <li>Click "Test Direct Access" to test fetch API</li>
          <li>Check if Next.js Image loads</li>
          <li>Check if regular img tag loads</li>
          <li>Try opening the image in a new tab</li>
          <li>Check console for detailed error messages</li>
        </ol>
      </div>
    </div>
  )
}
