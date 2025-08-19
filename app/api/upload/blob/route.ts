import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { put, del } from '@vercel/blob'

// Rate limiting map (in production, use Redis or similar)
const uploadAttempts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userAttempts = uploadAttempts.get(userId)
  
  if (!userAttempts || now > userAttempts.resetTime) {
    uploadAttempts.set(userId, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }
  
  if (userAttempts.count >= 10) { // Max 10 uploads per minute
    return false
  }
  
  userAttempts.count++
  return true
}

function sanitizeFilename(filename: string): string {
  // Remove any path traversal attempts and special characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 100) // Limit length
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }

    const data = await request.formData()
    const files = data.getAll("images") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    // Limit number of files
    if (files.length > 5) {
      return NextResponse.json({ error: "Maximum 5 files allowed per upload" }, { status: 400 })
    }

    // Configurable file size limits
    const maxSize = parseInt(process.env.UPLOAD_MAX_SIZE || "5242880") // 5MB default
    const maxDimensions = parseInt(process.env.UPLOAD_MAX_DIMENSIONS || "2048") // 2048px default
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]

const uploadPromises = files.map(async (file) => {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type for ${file.name}: ${file.type}`)
      }

      let buffer = Buffer.from(await file.arrayBuffer()) as Buffer
      let outputMime = "image/webp"
      let sanitizedFilename = sanitizeFilename(file.name)
      let filenameBase = `${Date.now()}-${sanitizedFilename}`.replace(/\.[^.]+$/, "")
      let filename = `${filenameBase}.webp`
      let processed = false

      // Always process images that are too large or not in optimal format
      if (buffer.length > maxSize || file.type !== "image/webp") {
        try {
          const sharp = (await import("sharp")).default
          let sharpImg = sharp(buffer).rotate()
          const metadata = await sharpImg.metadata()

          // Resize if image dimensions are too large
          if (metadata.width && metadata.width > maxDimensions) {
            sharpImg = sharpImg.resize(maxDimensions, null, { withoutEnlargement: true })
          }
          if (metadata.height && metadata.height > maxDimensions) {
            sharpImg = sharpImg.resize(null, maxDimensions, { withoutEnlargement: true })
          }
          
          // Try WebP compression first
          let quality = 85
          let webpBuffer = await sharpImg.webp({ quality }).toBuffer()
          
          // If still too large, reduce quality progressively
          while (webpBuffer.length > maxSize && quality > 20) {
            quality -= 15
            webpBuffer = await sharpImg.webp({ quality }).toBuffer()
          }
          
          if (webpBuffer.length <= maxSize) {
            buffer = webpBuffer as Buffer
            processed = true
            
          } else {
            // If WebP still too large, try JPEG
            
            quality = 85
            let jpgBuffer = await sharpImg.jpeg({ quality }).toBuffer()
            
            while (jpgBuffer.length > maxSize && quality > 20) {
              quality -= 15
              jpgBuffer = await sharpImg.jpeg({ quality }).toBuffer()
            }
            
            if (jpgBuffer.length <= maxSize) {
              buffer = jpgBuffer as Buffer
              outputMime = "image/jpeg"
              filename = `${filenameBase}.jpg`
              processed = true
              
            }
          }
        } catch (err) {
          console.error(`❌ Image processing error for ${file.name}:`, err)
          // If processing fails, we'll continue with original file
        }
      }

      // If not processed and still too large, try one more aggressive compression
      if (!processed && buffer.length > maxSize) {
        try {
          const sharp = (await import("sharp")).default
          let sharpImg = sharp(buffer).rotate()
          
          // Get metadata
          const metadata = await sharpImg.metadata()
          
          // More aggressive resizing
          let targetWidth = metadata.width
          let targetHeight = metadata.height
          
          if (metadata.width && metadata.width > maxDimensions) {
            targetWidth = maxDimensions
          }
          if (metadata.height && metadata.height > maxDimensions) {
            targetHeight = maxDimensions
          }
          
          sharpImg = sharpImg.resize(targetWidth, targetHeight, { withoutEnlargement: true })
          
          // Try very low quality compression
          let quality = 50
          let compressedBuffer = await sharpImg.jpeg({ quality }).toBuffer()
          
          while (compressedBuffer.length > maxSize && quality > 10) {
            quality -= 10
            compressedBuffer = await sharpImg.jpeg({ quality }).toBuffer()
          }
          
          if (compressedBuffer.length <= maxSize) {
            buffer = compressedBuffer as Buffer
            outputMime = "image/jpeg"
            filename = `${filenameBase}.jpg`
            processed = true
            
          }
        } catch (err) {
          console.error(`❌ Final compression failed for ${file.name}:`, err)
        }
      }

      // If still too large after all processing attempts, throw error
      if (buffer.length > maxSize) {
        throw new Error(`File too large after processing: ${file.name} (${buffer.length} bytes, max: ${maxSize} bytes)`)
      }

      try {
        // Upload to Vercel Blob

const blob = await put(filename, buffer, {
          access: 'public',
          addRandomSuffix: true, // Avoid filename conflicts
          cacheControlMaxAge: 60 * 60 * 24 * 30, // Cache for 30 days
        })

// Test if the blob is immediately accessible
        try {
          const testResponse = await fetch(blob.url, { method: 'HEAD' })
          
          if (!testResponse.ok) {
            console.warn(`⚠️ Blob may not be immediately accessible: ${testResponse.status}`)
          }
        } catch (testError) {
          console.warn(`⚠️ Could not test blob accessibility:`, testError)
        }

        return {
          url: blob.url, // Use regular URL for display, not downloadUrl
          name: file.name,
          size: buffer.length,
          type: outputMime,
          pathname: blob.pathname,
          downloadUrl: blob.downloadUrl
        }
      } catch (blobError) {
        console.error(`❌ Blob upload failed for ${filename}:`)
        console.error('Error details:', blobError)
        console.error('Error message:', blobError instanceof Error ? blobError.message : 'Unknown error')
        console.error('Error stack:', blobError instanceof Error ? blobError.stack : 'No stack trace')
        
        // Provide more specific error information
        let specificError = `Failed to upload ${filename} to blob storage`
        if (blobError instanceof Error) {
          if (blobError.message.includes('unauthorized') || blobError.message.includes('403')) {
            specificError = `Authentication failed for blob storage. Please check your BLOB_READ_WRITE_TOKEN.`
          } else if (blobError.message.includes('not found') || blobError.message.includes('404')) {
            specificError = `Blob storage endpoint not found. Please verify your token configuration.`
          } else if (blobError.message.includes('rate limit') || blobError.message.includes('429')) {
            specificError = `Rate limit exceeded for blob storage. Please try again later.`
          } else {
            specificError = `Blob storage error: ${blobError.message}`
          }
        }
        
        throw new Error(specificError)
      }
    })

    try {
      const uploadedFiles = await Promise.all(uploadPromises)
      return NextResponse.json({ images: uploadedFiles })
    } catch (error) {
      console.error("File processing error:", error)
      
      // Provide user-friendly error messages
      let errorMessage = "File processing failed"
      let errorDetails = ""
      
      if (error instanceof Error) {
        if (error.message.includes("File too large")) {
          const maxSizeMB = Math.round(maxSize / (1024 * 1024))
          errorMessage = `File is too large. Maximum size allowed is ${maxSizeMB}MB.`
          errorDetails = "The image has been compressed as much as possible but is still too large. Please try a smaller image."
        } else if (error.message.includes("Invalid file type")) {
          errorMessage = "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
        } else if (error.message.includes("Failed to upload") && error.message.includes("blob storage")) {
          errorMessage = "Cloud storage upload failed. Please try again."
          errorDetails = "There was an issue uploading your file to cloud storage."
        } else {
          errorMessage = error.message
          errorDetails = error.stack || ""
        }
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: errorDetails || "",
        maxFileSize: `${Math.round(maxSize / (1024 * 1024))}MB`,
        allowedTypes: allowedTypes
      }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ Upload error:", error)
    console.error("❌ Upload error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
    
    return NextResponse.json({ 
      error: "Upload failed",
      message: "Failed to upload files. Please try again.",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }
}

// DELETE endpoint to remove blobs
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: "URL parameter required" }, { status: 400 })
    }

    // Delete from Vercel Blob
    await del(url)

return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ 
      error: "Delete failed",
      message: error instanceof Error ? error.message : "Failed to delete file"
    }, { status: 500 })
  }
}

