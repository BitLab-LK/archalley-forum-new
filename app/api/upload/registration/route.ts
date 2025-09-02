import { type NextRequest, NextResponse } from "next/server"
import { put } from '@vercel/blob'
import { generateSecureImageFilename, getExtensionFromMimeType, generateDisplayFilename } from "@/lib/utils"

// Rate limiting map for unauthenticated uploads
const registrationUploadAttempts = new Map<string, { count: number; resetTime: number }>()

function checkRegistrationRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempts = registrationUploadAttempts.get(ip)
  
  if (!attempts || now > attempts.resetTime) {
    registrationUploadAttempts.set(ip, { count: 1, resetTime: now + 300000 }) // 5 minute window
    return true
  }
  
  if (attempts.count >= 3) { // Max 3 uploads per 5 minutes for registration
    return false
  }
  
  attempts.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Check rate limit for registration uploads
    if (!checkRegistrationRateLimit(ip)) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }

    const data = await request.formData()
    const files = data.getAll("images") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    // Only allow 1 file for registration (profile picture)
    if (files.length > 1) {
      return NextResponse.json({ error: "Only 1 profile picture allowed for registration" }, { status: 400 })
    }

    const file = files[0]
    
    // Stricter validation for registration uploads
    const maxSize = 2 * 1024 * 1024 // 2MB for registration
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` }, { status: 400 })
    }

    // Validate file size
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size, 'max:', maxSize)
      return NextResponse.json({ error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.` }, { status: 400 })
    }

    let buffer = Buffer.from(await file.arrayBuffer())
    
    // Generate short secure filename for registration
    let filename = `profile_${generateSecureImageFilename(getExtensionFromMimeType(file.type)).replace('img_', '')}`

    try {
      // Check if BLOB_READ_WRITE_TOKEN is available
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('BLOB_READ_WRITE_TOKEN not found in environment variables')
        return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 })
      }

      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: file.type,
      })

      return NextResponse.json({
        images: [{
          url: blob.url,
          filename: filename,
          size: buffer.length,
          originalName: 'profile' + getExtensionFromMimeType(file.type) // Clean name for user downloads
        }]
      })
    } catch (error) {
      console.error("Blob upload error:", error)
      return NextResponse.json({ error: "Failed to upload to storage" }, { status: 500 })
    }
  } catch (error) {
    console.error("Registration upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

