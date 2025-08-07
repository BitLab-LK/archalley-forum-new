// Test Vercel Blob upload locally
const { put } = require('@vercel/blob')
require('dotenv').config()

async function testBlobUpload() {
  console.log('🧪 Testing Vercel Blob upload...')
  console.log('📝 Environment variables:')
  console.log(`- BLOB_READ_WRITE_TOKEN exists: ${!!process.env.BLOB_READ_WRITE_TOKEN}`)
  console.log(`- Token value (first 20 chars): ${process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20)}...`)
  
  try {
    // Create a simple test buffer
    const testBuffer = Buffer.from('Hello, this is a test file!')
    const filename = `test-${Date.now()}.txt`
    
    console.log(`📤 Uploading test file: ${filename}`)
    
    const blob = await put(filename, testBuffer, {
      access: 'public',
      addRandomSuffix: true,
    })
    
    console.log('✅ Upload successful!')
    console.log(`- URL: ${blob.url}`)
    console.log(`- Download URL: ${blob.downloadUrl}`)
    console.log(`- Pathname: ${blob.pathname}`)
    
    // Test if the blob is accessible
    const response = await fetch(blob.url)
    const content = await response.text()
    
    console.log(`🔍 Blob accessibility test: ${response.status}`)
    console.log(`📄 Content: ${content}`)
    
  } catch (error) {
    console.error('❌ Blob upload failed:')
    console.error('Error message:', error.message)
    console.error('Error details:', error)
  }
}

testBlobUpload()
