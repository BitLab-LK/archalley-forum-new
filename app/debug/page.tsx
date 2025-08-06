'use client'

import { useState } from 'react'

export default function DebugPage() {
  const [userId, setUserId] = useState('430cf6d5-b4b2-4ccb-95f6-52ef48c1efa9')
  const [result, setResult] = useState('')

  const testAPI = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Debug Tool</h1>
      <div className="mb-4">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border p-2 mr-2 w-96"
          placeholder="User ID"
        />
        <button
          onClick={testAPI}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test API
        </button>
      </div>
      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
        {result}
      </pre>
    </div>
  )
}
