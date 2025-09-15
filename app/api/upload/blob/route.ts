import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { put, del } from '@vercel/blob'
import { generateSecureImageFilename, getExtensionFromMimeType } from "@/lib/utils"

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
      let outputMime = file.type // Keep original format for speed unless conversion needed
      
      // Generate secure filename
      let filename = generateSecureImageFilename(getExtensionFromMimeType(file.type))

      // OPTIMIZATION: Only process images if they're too large or in problematic format
      // This reduces upload time significantly for most images
      const needsProcessing = buffer.length > maxSize || 
                             (file.type !== "image/webp" && file.type !== "image/jpeg" && file.type !== "image/png")

      if (needsProcessing) {
        try {
          const sharp = (await import("sharp")).default
          let sharpImg = sharp(buffer).rotate()
          const metadata = await sharpImg.metadata()

          // Quick resize if dimensions are too large
          if ((metadata.width && metadata.width > maxDimensions) || 
              (metadata.height && metadata.height > maxDimensions)) {
            sharpImg = sharpImg.resize(maxDimensions, maxDimensions, { 
              fit: 'inside', 
              withoutEnlargement: true 
            })
          }
          
          // Try to keep original format if possible, only convert to WebP if too large
          if (buffer.length > maxSize) {
            // Try WebP compression
            let quality = 85
            let webpBuffer = await sharpImg.webp({ quality }).toBuffer()
            
            // Quick quality reduction if still too large
            if (webpBuffer.length > maxSize && quality > 50) {
              quality = 70
              webpBuffer = await sharpImg.webp({ quality }).toBuffer()
            }
            
            if (webpBuffer.length <= maxSize) {
              buffer = webpBuffer as Buffer
              outputMime = "image/webp"
              filename = generateSecureImageFilename(".webp")
            } else {
              // Fallback to JPEG if WebP still too large
              let jpegBuffer = await sharpImg.jpeg({ quality: 70 }).toBuffer()
              if (jpegBuffer.length <= maxSize) {
                buffer = jpegBuffer as Buffer
                outputMime = "image/jpeg"
                filename = generateSecureImageFilename(".jpg")
              } else {
                throw new Error(`File ${file.name} is too large even after compression`)
              }
            }
          } else {
            // Keep original format but apply resize if needed
            if ((metadata.width && metadata.width > maxDimensions) || 
                (metadata.height && metadata.height > maxDimensions)) {
              if (file.type === "image/jpeg") {
                buffer = await sharpImg.jpeg({ quality: 90 }).toBuffer()
              } else if (file.type === "image/png") {
                buffer = await sharpImg.png().toBuffer()
              } else {
                buffer = await sharpImg.webp({ quality: 90 }).toBuffer()
                outputMime = "image/webp"
                filename = generateSecureImageFilename(".webp")
              }
            }
          }
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error)
          
          // If processing fails but file is under size limit, use original
          if (buffer.length <= maxSize) {
            console.log(`Using original file for ${file.name} due to processing error`)
          } else {
            throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      try {
        // Upload to Vercel Blob
        const blob = await put(filename, buffer, {
          access: 'public',
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 30, // Cache for 30 days
        })

        return {
          url: blob.url,
          name: file.name, // Keep original name for user reference
          size: buffer.length,
          type: outputMime,
          pathname: blob.pathname,
          downloadUrl: blob.downloadUrl
        }
      } catch (blobError) {
        console.error(`Blob upload failed for ${filename}:`, blobError)
        
        let specificError = `Failed to upload to blob storage`
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
  } catch (error: unknown) {
    console.error("Upload error:", error)
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

